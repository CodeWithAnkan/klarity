<div align="center"><img src="https://github.com/CodeWithAnkan/klarity/blob/main/client/public/logo.svg" alt="Klarity Logo" width="120" /><h1>Klarity ✨</h1><p><strong>An intelligent knowledge hub that turns your saved articles and videos into a searchable, interactive, and conversational library.</strong></p><p><a href="https://klarity-sigma.vercel.app/" target="_blank"><img src="https://www.google.com/search?q=https://img.shields.io/badge/Live_Demo-000000%3Fstyle%3Dfor-the-badge%26logo%3Dvercel%26logoColor%3Dwhite" alt="Live Demo"/></a></p><p><img src="https://www.google.com/search?q=https://img.shields.io/badge/React-20232A%3Fstyle%3Dflat%26logo%3Dreact%26logoColor%3D61DAFB" alt="React Badge"/><img src="https://www.google.com/search?q=https://img.shields.io/badge/Node.js-339933%3Fstyle%3Dflat%26logo%3Dnodedotjs%26logoColor%3Dwhite" alt="Node.js Badge"/><img src="https://www.google.com/search?q=https://img.shields.io/badge/MongoDB-4EA94B%3Fstyle%3Dflat%26logo%3Dmongodb%26logoColor%3Dwhite" alt="MongoDB Badge"/><img src="https://www.google.com/search?q=https://img.shields.io/badge/Python-3776AB%3Fstyle%3Dflat%26logo%3Dpython%26logoColor%3Dwhite" alt="Python Badge"/><img src="https://www.google.com/search?q=https://img.shields.io/badge/Pinecone-3d82f7%3Fstyle%3Dflat%26logo%3Dpinecone%26logoColor%3Dwhite" alt="Pinecone Badge"/><img src="https://www.google.com/search?q=https://img.shields.io/badge/AssemblyAI-000000%3Fstyle%3Dflat%26logo%3Dassemblyai%26logoColor%3Dwhite" alt="AssemblyAI Badge"/></p></div>🚀 OverviewKlarity is a full-stack MERN application designed to solve information overload. Instead of a messy list of bookmarks, Klarity automatically processes your saved content, extracts the key information, and indexes it for intelligent search and chat. It's your personal "second brain" that you can have a conversation with.This project showcases a modern, distributed system architecture, combining a robust Node.js backend with local AI microservices and high-performance cloud APIs to deliver a seamless and powerful user experience.📸 Screenshots<p align="center"><strong>Main Dashboard & Content Feed</strong><br/><img src="https://www.google.com/search?q=https://raw.githubusercontent.com/CodeWithAnkan/klarity/main/screenshots/dashboard.png" alt="Klarity Dashboard" width="800"/></p><p align="center"><strong>AI Chat Panel</strong><br/><img src="https://www.google.com/search?q=https://raw.githubusercontent.com/CodeWithAnkan/klarity/main/screenshots/chat.png" alt="Klarity Chat" width="800"/></p>✨ Key FeaturesUniversal Content Saver: Save any article or YouTube video with a single link.Automated AI Pipeline: A multi-stage, resilient pipeline processes all content:Intelligent Scraping: Uses HTML semantics (<article>, <main>) to extract clean, relevant text from articles.Transcription: Automatically transcribes any video using a tiered system:Fetches existing captions for speed.Falls back to the high-speed AssemblyAI API for videos without transcripts.Translation: Intelligently detects the language of any content and translates it to English using a high-quality, reliable translation API.Summarization: Generates a concise summary for every piece of content using a local Python AI model.Semantic Search: Go beyond keywords. Search your library by concept or meaning to find the exact information you need, powered by vector embeddings."Chat with Your Content" (RAG): Ask questions in natural language and get direct, accurate answers synthesized from your saved documents. This is powered by a full Retrieval-Augmented Generation (RAG) pipeline using the high-speed Groq API.Spaces: Organize your knowledge into different "Spaces" (e.g., "React Development," "DSA") and chat with an AI that is an expert only on the content within that space.🛠️ Tech Stack & ArchitectureKlarity is built with a modern, distributed architecture. The deployed version uses cloud services for performance, while the local setup can use self-hosted models.Deployed Architecturegraph TD
    subgraph Frontend
        A[React App on Vercel]
    end

    subgraph Backend API on Railway
        B[Node.js / Express]
        B -- Manages Users/Content --> C[MongoDB Atlas]
        B -- Indexes/Queries Vectors --> D[Pinecone Vector DB]
        B -- Generates Chat Responses --> E[Groq API - Llama 3]
        B -- Transcribes Audio --> F[AssemblyAI API]
    end
    
    A --> B
Core TechnologiesFrontend: React (Vite), Tailwind CSS, Lucide IconsBackend: Node.js, Express.js, MongoDB (Mongoose), JWTAI & Data Pipeline:Transcription: AssemblyAI API (Production) / local Whisper AI (Development)Translation: @vitalets/google-translate-apiSummarization: Local Python Flask server running a distilbart modelEmbeddings: @xenova/transformers (running locally in Node.js)Vector Database: PineconeChat Generation (RAG): Groq API (running Llama 3)⚙️ Local Setup & InstallationTo run this project locally, you'll need Node.js, Python, and several command-line tools installed.PrerequisitesNode.js (v20 or higher)Python (v3.10 or higher)System Tools: yt-dlp, ffmpeg1. Backend Setup# Navigate to the project root
cd Klarity

# Install backend dependencies
npm install

# Set up your .env file
cp .env.example .env 
# Add all required API keys (MONGO_URI, JWT_SECRET, GROQ_API_KEY, PINECONE_API_KEY, ASSEMBLYAI_API_KEY)

# Run the backend server
npm run server
2. AI Microservices Setup (Optional for Deployment)For local development, you can run a summarization server.# Navigate to the summarization server directory
cd summarization-server

# Install dependencies
pip install Flask transformers torch

# Run the server (will download the model on first run)
python app.py
(This server runs on http://localhost:5002)3. Frontend Setup# Navigate to the client directory from the root
cd client

# Install frontend dependencies
npm install

# Run the frontend dev server
npm run dev
(The frontend will be available at http://localhost:5173)📜 LicenseThis project is licensed under the MIT License. See the LICENSE file for details.<div align="center"><p>Built with ❤️ by <a href="https://www.google.com/search?q=https://github.com/CodeWithAnkan">Ankan</a></p></div>
