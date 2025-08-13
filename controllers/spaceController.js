const asyncHandler = require('express-async-handler');
const axios = require('axios');
const Space = require('../models/spaceModel');
const Content = require('../models/contentModel');
const pinecone = require('../config/pinecone');
const { PipelineSingleton } = require('../services/contentProcessor');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// @desc    Create a new space
// @route   POST /api/spaces
// @access  Private
const createSpace = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Please provide a name for the space');
  }

  const space = await Space.create({
    user: req.user.id,
    name,
    description,
  });

  res.status(201).json(space);
});

// @desc    Get all spaces for a user
// @route   GET /api/spaces
// @access  Private
const getSpaces = asyncHandler(async (req, res) => {
  const spaces = await Space.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json(spaces);
});

// @desc    Update a space
// @route   PUT /api/spaces/:id
// @access  Private
const updateSpace = asyncHandler(async (req, res) => {
  const space = await Space.findById(req.params.id);

  if (!space) {
    res.status(404);
    throw new Error('Space not found');
  }

  if (space.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  const updatedSpace = await Space.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.status(200).json(updatedSpace);
});

// @desc    Delete a space
// @route   DELETE /api/spaces/:id
// @access  Private
const deleteSpace = asyncHandler(async (req, res) => {
  const space = await Space.findById(req.params.id);

  if (!space) {
    res.status(404);
    throw new Error('Space not found');
  }

  if (space.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  // Note: We also need to delete vectors from Pinecone. This is an advanced step.
  await Content.deleteMany({ space: req.params.id });
  await space.deleteOne();

  res.status(200).json({ id: req.params.id });
});

// @desc    Get all content for a specific space
// @route   GET /api/spaces/:id/content
// @access  Private
const getSpaceContent = asyncHandler(async (req, res) => {
    const spaceId = req.params.id;
  
    const space = await Space.findById(spaceId);
    if (!space || space.user.toString() !== req.user.id) {
      res.status(404);
      throw new Error('Space not found or user not authorized');
    }
  
    const contents = await Content.find({ space: spaceId }).sort({ createdAt: -1 });
  
    res.status(200).json(contents);
});

// @desc    Search within a specific space (using Pinecone)
// @route   POST /api/spaces/:id/search
// @access  Private
const searchSpace = asyncHandler(async (req, res) => {
  const { query } = req.body;
  const spaceId = req.params.id;

  if (!query) {
    res.status(400);
    throw new Error('Search query is required');
  }

  const extractor = await PipelineSingleton.getInstance();
  const queryEmbedding = await extractor(query, { pooling: 'mean', normalize: true });

  const index = pinecone.index('klarity');
  const queryResponse = await index.query({
    vector: Array.from(queryEmbedding.data),
    topK: 5,
    filter: {
        spaceId: { '$eq': spaceId }
    },
    includeMetadata: true,
  });

  res.status(200).json(queryResponse);
});

// @desc    Chat within a specific space (RAG with Pinecone & Groq)
// @route   POST /api/spaces/:id/chat
// @access  Private
const chatInSpace = asyncHandler(async (req, res) => {
    const { query } = req.body;
    const spaceId = req.params.id;
  
    if (!query) {
      res.status(400);
      throw new Error('Search query is required');
    }
  
    const extractor = await PipelineSingleton.getInstance();
    const queryEmbedding = await extractor(query, { pooling: 'mean', normalize: true });

    const index = pinecone.index('klarity');
    const searchResults = await index.query({
        vector: Array.from(queryEmbedding.data),
        topK: 5,
        filter: {
            spaceId: { '$eq': spaceId }
        },
        includeMetadata: true,
    });
    
    const topScore = searchResults.matches.length > 0 ? searchResults.matches[0].score : 0;
    
    let systemPrompt = "";
    const context = searchResults.matches.map(match => match.metadata.text).join('\n---\n');

    // --- THIS IS THE FIX ---
    if (topScore > 0.5) { // Lowered threshold for better context retrieval
    // --- END OF FIX ---
        console.log("Found relevant context. Performing RAG with Groq...");
        systemPrompt = `You are a helpful assistant. Answer the user's question based only on the following context:\n\n${context}`;
    } else {
        console.log("No relevant context found. Answering from general knowledge with Groq...");
        systemPrompt = "You are a helpful assistant. Answer the user's question from your general knowledge.";
    }
  
    const groqResponse = await axios.post(
        GROQ_API_URL,
        {
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: query }
            ],
            model: "llama3-8b-8192"
        },
        {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );
  
    res.status(200).json({ answer: groqResponse.data.choices[0].message.content });
});

module.exports = {
  createSpace,
  getSpaces,
  updateSpace,
  deleteSpace,
  getSpaceContent,
  searchSpace,
  chatInSpace,
};
