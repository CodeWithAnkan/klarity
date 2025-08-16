const fs = require('fs');
const path = require('path');
const util = require('util');
// We no longer need child_process
// const { exec, spawn } = require('child_process');
// const execPromise = util.promisify(exec);

const axios = require('axios');
const cheerio = require('cheerio');
const { YoutubeTranscript } = require('youtube-transcript');
const { franc } = require('franc');
const { translate } = require('@vitalets/google-translate-api');
const { AssemblyAI } = require('assemblyai');

const Content = require('../models/contentModel');
const pinecone = require('../config/pinecone');

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

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
    // No longer need tempAudioPath
    // let tempAudioPath = null; 

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
                
                // --- THIS IS THE FIX: Pass URL directly to AssemblyAI ---
                const assemblyClient = new AssemblyAI({ apiKey: ASSEMBLYAI_API_KEY });
                const transcript = await assemblyClient.transcripts.transcribe({
                    audio: url, // Pass the youtube URL directly
                });

                if (transcript.status === 'error') {
                    throw new Error(`AssemblyAI failed: ${transcript.error}`);
                }
                extractedText = transcript.text;
                console.log('Successfully transcribed audio using AssemblyAI.');
                // --- END OF FIX ---
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
            } else {
                console.log('Text is already in English.');
            }
        }

        // Get YouTube Title
        if (url.includes('youtube.com') && !extractedTitle) {
            try {
                const info = await axios.get(`https://www.youtube.com/oembed?url=${url}&format=json`);
                extractedTitle = info.data.title;
            } catch { extractedTitle = 'YouTube Video'; }
        }

        // Summarization with Groq
        if (process.env.ENABLE_SUMMARIZER === 'true' && extractedText && extractedText.length > 200) {
            console.log('Sending text to Groq for summarization...');
            
            const systemPrompt = `You are an expert summarizer. Create a concise, easy-to-read summary of the following text. The summary should be about 3-4 sentences long.\n\nText:\n${extractedText}`;

            const groqResponse = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    messages: [{ role: "system", content: systemPrompt }],
                    model: "llama3-8b-8192"
                },
                { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
            );
            
            finalSummary = groqResponse.data.choices[0].message.content;
            console.log('Summary generated successfully by Groq.');
        } else {
            console.log('Summarization is disabled or text is too short, skipping.');
        }

        // Final Save & Indexing
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
    } 
};

module.exports = { processContent, PipelineSingleton };
