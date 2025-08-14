<div align="center">
<img src="https://github.com/CodeWithAnkan/klarity/blob/main/client/public/logo.svg" alt="Klarity Logo" width="120" />
<a href="https://klarity-sigma.vercel.app/"><strong>Klarity</strong></a>
<p><strong>An intelligent knowledge hub that turns your saved articles and videos into a searchable, interactive, and conversational library.</strong></p>
<p>
    <img src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB" alt="React Badge"/>
    <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white" alt="Node.js Badge"/>
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white" alt="MongoDB Badge"/>
    <img src="https://img.shields.io/badge/Pinecone-3d82f7?style=flat&logo=pinecone&logoColor=white" alt="Pinecone Badge"/>
    <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white" alt="Python Badge"/>
    <img src="https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker Badge"/>
  </p>
</div>

🚀 Overview
Klarity is a full-stack MERN application designed to solve information overload. Instead of a messy list of bookmarks, Klarity automatically processes your saved content, extracts the key information, and indexes it for intelligent search and chat. It's your personal "second brain" that you can have a conversation with.

This project showcases a modern, distributed system architecture, combining a robust Node.js backend with local AI microservices and high-performance cloud APIs to deliver a seamless and powerful user experience.

📸 Screenshots
<p align="center">
<strong>Main Dashboard & Content Feed</strong><br/>
<img src="https://github.com/CodeWithAnkan/klarity/blob/main/client/public/dashboard.png" alt="Klarity Dashboard" width="800"/>
</p>
<p align="center">
<strong>AI Chat Panel</strong><br/>
<img src="https://github.com/CodeWithAnkan/klarity/blob/main/client/public/ai-chat.png" alt="Klarity Chat" width="800"/>
</p>

# Key Features

1. Universal Content Saver: Save any article or YouTube video with a single link.
2. Automated AI Pipeline: A multi-stage, resilient pipeline processes all content:
3. Intelligent Scraping: Uses HTML semantics `(<article>, <main>)` to extract clean, relevant text from articles.
4. Transcription: Automatically transcribes any video using a tiered system:
5. Fetches existing captions for speed.
6. Falls back to a AssemblyAI API for English videos without transcripts.
7. Translation: Intelligently detects the language of any content and translates it to English using a high-quality, reliable translation API.
8. Summarization: Generates a concise summary for every piece of content using a local Python AI model.
9. Semantic Search: Go beyond keywords. Search your library by concept or meaning to find the exact information you need, powered by vector embeddings.
10. "Chat with Your Content" (RAG): Ask questions in natural language and get direct, accurate answers synthesized from your saved documents. This is powered by a full Retrieval-Augmented Generation (RAG) pipeline using the high-speed Groq API.
11. Spaces: Organize your knowledge into different "Spaces" (e.g., "React Development," "DSA") and chat with an AI that is an expert only on the content within that space.

# Tech Stack & Architecture
Klarity is built with a modern, distributed architecture, combining a MERN stack with a suite of local and cloud-based AI services.

graph TD
    
    subgraph Frontend
        A[React App on Vercel]
    end

    subgraph Backend API on Render
        B[Node.js / Express]
        B -- Manages Users/Content --> C[MongoDB Atlas]
        B -- Indexes/Queries Vectors --> D[Pinecone Vector DB]
        B -- Generates Chat Responses --> E[Groq API - Llama 3]
    end

    subgraph AI Processing Pipeline
        B -- Triggers Processing --> F{Content Processor}
        F -- Scrapes --> G[Articles]
        F -- Transcribes --> H[YouTube Videos]
        F -- Translates --> I[Google Translate API]
        F -- Summarizes --> J[Local Python Summarizer]
        H -- Tier 1 --> K[youtube-transcript]
        H -- Tier 2 Fallback --> L[AssemblyAI API]
        J -- Runs on --> M[Local Python Server]
    end

    A --> B

# Frontend
Framework: React (Vite)
Styling: Tailwind CSS
UI Components: Lucide Icons

# Backend
Runtime: Node.js
Framework: Express.js
Database: MongoDB (with Mongoose)
Authentication: JWT

# AI & Data Pipeline
Transcription: youtube-transcript & AssemblyAI API
Translation: @vitalets/google-translate-api
Summarization: Local Python Flask server running a distilbart model
Embeddings: @xenova/transformers (running locally in Node.js)
Vector Database: Pinecone
Chat Generation (RAG): Groq API (running Llama 3)

# Local Setup & Installation
To run this project locally, you'll need Node.js, Python, Docker, and several command-line tools installed.

# Prerequisites
Node.js (v18 or higher)
Python (v3.10 or higher)
Docker Desktop

# System Tools:

yt-dlp: winget install yt-dlp
ffmpeg: winget install FFmpeg.FFmpeg
git: winget install Git.Git

1. Backend Setup
# Navigate to the project root
cd Klarity

# Install backend dependencies
npm install

# Set up your .env file
cp .env.example .env 
# Add your MONGO_URI, JWT_SECRET, GROQ_API_KEY, and PINECONE_API_KEY

# Run the backend server
npm run server

2. AI Microservices Setup
You need to run two local Python servers and the Whisper AI model.

A. Local Whisper Installation

# Install the Whisper package
pip install openai-whisper

B. Summarization Server

# Navigate to the summarization server directory
cd summarization-server

# Install dependencies
pip install Flask transformers torch

# Run the server (will download the model on first run)
python app.py

(This server runs on http://localhost:5002)

3. Frontend Setup
# Navigate to the client directory from the root
cd client

# Install frontend dependencies
npm install

# Run the frontend dev server
npm run dev

(The frontend will be available at http://localhost:5173)

📜 License
This project is licensed under the MIT License. See the LICENSE file for details.

<div align="center">
<p>Built with ❤️ by <a href="https://www.google.com/search?q=https://github.com/CodeWithAnkan">Ankan</a></p>
</div>
