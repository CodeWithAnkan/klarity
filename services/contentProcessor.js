const fs = require('fs');
const path = require('path');
const util = require('util');
const { exec } = require('child_process');
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
const LOCAL_SUMMARIZATION_API_URL = 'http://localhost:5002/summarize';

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

                const downloadCommand = `yt-dlp -x --audio-format mp3 -o "${tempAudioPath}" "${url}"`;
                await execPromise(downloadCommand);
                console.log('Audio downloaded successfully via yt-dlp.');

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

        // Summarization
        if (extractedText && extractedText.length > 200) {
            const summaryResponse = await axios.post(LOCAL_SUMMARIZATION_API_URL, { text: extractedText });
            finalSummary = summaryResponse.data.summary_text;
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
            const index = pinecone.index('klarity'); // Assumes an index named 'klarity'

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