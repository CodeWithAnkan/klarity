const asyncHandler = require('express-async-handler');
const Content = require('../models/contentModel');
const Space = require('../models/spaceModel');
const { processContent } = require('../services/contentProcessor');

// @desc    Create new content from URL or File
// @route   POST /api/content
// @access  Private
const createContent = asyncHandler(async (req, res) => {
  // Multer handles multipart/form-data, so text fields are in req.body
  const { url, spaceId } = req.body; 
  const file = req.file; // Multer makes the uploaded file available here

  if (!spaceId) {
    res.status(400);
    throw new Error('spaceId is required');
  }

  if (!url && !file) {
    res.status(400);
    throw new Error('Either a URL or a file is required');
  }

  // Verify the space exists and belongs to the user
  const space = await Space.findById(spaceId);
  if (!space || space.user.toString() !== req.user.id) {
    res.status(404);
    throw new Error('Space not found or user not authorized');
  }

  // If it's a file upload, the 'url' field in the DB will be the original filename
  const contentData = {
    user: req.user.id,
    space: spaceId,
    url: file ? file.originalname : url, 
  };
  
  const content = await Content.create(contentData);
  
  // Kick off background processing, passing the file path if it exists
  processContent(content._id, file ? file.path : null); 

  res.status(201).json(content);
});

// getUserContent and deleteContent functions remain the same...

const getUserContent = asyncHandler(async (req, res) => {
    const contents = await Content.find({ user: req.user.id }).sort({ createdAt: -1 })
    res.json(contents)
});

const deleteContent = asyncHandler(async (req, res) => {
    const content = await Content.findById(req.params.id)

    if (!content) {
        res.status(404)
        throw new Error('Content not found')
    }

    if (content.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error('Not authorized')
    }

    await content.deleteOne()

    res.json({ id: req.params.id })
});


module.exports = { createContent, getUserContent, deleteContent };