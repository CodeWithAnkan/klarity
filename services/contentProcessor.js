const fs = require('fs');
const path = require('path');
const util = require('util');
const { exec, spawn } = require('child_process');
const execPromise = util.promisify(exec);

const axios = require('axios');
const cheerio = require('cheerio');
const { YoutubeTranscript } = require('youtube-transcript');
const { franc } = require('franc');
const { translate } = require('@vitalets/google-translate-api');
const { AssemblyAI } = require('assemblyai');

const Content = require('../models/contentModel');
const pinecone = require('../config/pinecone');

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

class PipelineSingleton {
    static instance = null;
    static async getInstance() {
        if (this.instance === null) {
            const { pipeline } = await import('@xenova/transformers');
            this.instance = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }
        return this.instance;
    }
}

// Helper function to poll Replicate for results
const pollReplicate = async (predictionUrl) => {
    for (let i = 0; i < 60; i++) { // Poll for up to 2 minutes
        const response = await axios.get(predictionUrl, {
            headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
        });
        const { status, output } = response.data;
        if (status === 'succeeded') {
            return output.join("");
        }
        if (status === 'failed' || status === 'canceled') {
            throw new Error('Replicate summarization failed.');
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    }
    throw new Error('Replicate summarization timed out.');
};

const processContent = async (contentId) => {
    console.log(`Starting processing for content ID: ${contentId}`);
    let tempAudioPath = null;

    try {
        const content = await Content.findById(contentId);
        if (!content) throw new Error(`Content with ID ${contentId} not found.`);

        const { url } = content;
        let extractedTitle = '';
        let extractedText = '';
        let finalSummary = '';
        let isEnglish = true;

        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            console.log('Processing YouTube URL...');
            try {
                const transcript = await YoutubeTranscript.fetchTranscript(url);
                extractedText = transcript.map((line) => line.text).join(' ').trim();
                if (!extractedText || extractedText.length < 20) {
                    throw new Error(`Fetched transcript was empty.`);
                }
                console.log('Transcript found. Proceeding with processing.');
            } catch (transcriptError) {
                console.log(`Tier 1 failed: ${transcriptError.message}. Falling back to AssemblyAI...`);
                
                const tempAudioFilename = `temp_audio_${contentId}.mp3`;
                tempAudioPath = path.join(__dirname, tempAudioFilename);

                console.log('Downloading audio with yt-dlp...');
                await new Promise((resolve, reject) => {
                    const downloadProcess = spawn('yt-dlp', [ '-x', '--audio-format', 'mp3', '-o', tempAudioPath, url ]);
                    downloadProcess.on('close', (code) => {
                        if (code === 0) {
                            console.log('Audio downloaded successfully via yt-dlp.');
                            resolve();
                        } else {
                            reject(new Error(`yt-dlp process exited with code ${code}`));
                        }
                    });
                });

                const assemblyClient = new AssemblyAI({ apiKey: ASSEMBLYAI_API_KEY });
                const transcript = await assemblyClient.transcripts.transcribe({
                    audio: tempAudioPath,
                });

                if (transcript.status === 'error') {
                    throw new Error(`AssemblyAI failed: ${transcript.error}`);
                }
                extractedText = transcript.text;
                console.log('Successfully transcribed audio using AssemblyAI.');
            }
        } else {
            // Article Workflow
            console.log('Processing article URL...');
            const response = await axios.get(url);
            const html = response.data;
            const $ = cheerio.load(html);
            extractedTitle = $('title').text() || $('h1').first().text();
            let articleBody = $('article');
            if (!articleBody.length) articleBody = $('main');
            if (!articleBody.length) articleBody = $('#content');
            if (!articleBody.length) articleBody = $('.post-content');
            if (!articleBody.length) articleBody = $('body');
            articleBody.find('script, style, noscript, header, footer, nav, aside').remove();
            extractedText = articleBody.text().replace(/\s\s+/g, ' ').trim();
        }

        // Language Detection & Translation
        if (extractedText && extractedText.length > 10) {
            const langCode = franc(extractedText.substring(0, 1000));
            isEnglish = (langCode === 'eng');
            if (!isEnglish) {
                console.log(`Language detected: ${langCode}. Translating...`);
                const { text } = await translate(extractedText, { to: 'en' });
                extractedText = text;
            }
        }

        // Get YouTube Title
        if (url.includes('youtube.com') && !extractedTitle) {
            try {
                const info = await axios.get(`https://www.youtube.com/oembed?url=${url}&format=json`);
                extractedTitle = info.data.title;
            } catch { extractedTitle = 'YouTube Video'; }
        }

        // Summarization with Replicate
        if (process.env.ENABLE_SUMMARIZER === 'true' && extractedText && extractedText.length > 200) {
            console.log('Sending text to Replicate for summarization...');
            const safeText = extractedText.substring(0, 4000);
            const startResponse = await axios.post(
                'https://api.replicate.com/v1/predictions',
                {
                    version: "4b7ff053cda122aeb4f9b8c83c50a3111b4c6837947721832041d8b2d1314f17",
                    input: { text: safeText }
                },
                { headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` } }
            );

            const predictionUrl = startResponse.data.urls.get;
            finalSummary = await pollReplicate(predictionUrl);
            console.log('Summary generated successfully by Replicate.');
        } else {
            console.log('Summarization is disabled or text is too short, skipping.');
        }

        // Final Save to MongoDB
        content.title = extractedTitle;
        content.text = extractedText;
        content.summary = finalSummary;
        content.status = 'processed';
        await content.save();
        console.log(`Content ID ${contentId} processed successfully.`);

        // Index Content in Pinecone
        if (extractedText && extractedText.length > 100) {
            console.log('Starting indexing for semantic search in Pinecone...');
            
            const extractor = await PipelineSingleton.getInstance();
            const index = pinecone.index('klarity');

            const words = extractedText.split(' ');
            const chunkSize = 150;
            const chunks = [];
            for (let i = 0; i < words.length; i += chunkSize) {
                chunks.push(words.slice(i, i + chunkSize).join(' '));
            }

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const output = await extractor(chunk, { pooling: 'mean', normalize: true });
                const embedding = Array.from(output.data);
                
                await index.upsert([{
                    id: `${content._id}_chunk_${i}`,
                    values: embedding,
                    metadata: {
                        text: chunk,
                        contentId: content._id.toString(),
                        spaceId: content.space.toString(),
                        userId: content.user.toString()
                    }
                }]);
            }
            
            console.log(`Successfully indexed ${chunks.length} chunks into Pinecone.`);
        }

    } catch (error) {
        console.error(`Error processing content ID ${contentId}:`, error.message);
        const content = await Content.findById(contentId);
        if (content) {
            content.status = 'failed';
            content.failureReason = error.message;
            await content.save();
        }
    } finally {
        if (tempAudioPath && fs.existsSync(tempAudioPath)) {
            fs.unlinkSync(tempAudioPath);
            console.log('Temporary audio file deleted.');
        }
    }
};

module.exports = { processContent, PipelineSingleton };
