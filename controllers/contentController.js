const asyncHandler = require('express-async-handler')
const Content = require('../models/contentModel')
const { processContent } = require('../services/contentProcessor');
const Space = require('../models/spaceModel')

// @desc    Create new content
// @route   POST /api/content
// @access  Private
const createContent = asyncHandler(async (req, res) => {
  const { url, spaceId, title, summary, tags } = req.body // Expect spaceId now

  if (!url || !spaceId) {
    res.status(400)
    throw new Error('URL and spaceId are required')
  }

  // Verify the space exists and belongs to the current user
  const space = await Space.findById(spaceId)
  if (!space || space.user.toString() !== req.user.id) {
    res.status(404)
    throw new Error('Space not found or user not authorized')
  }

  const content = await Content.create({
    user: req.user.id,
    space: spaceId,
    url,
    title,
    summary,
    tags,
  })

  // Kick off background processing
  processContent(content._id);

  res.status(201).json(content)
})

// @desc    Get user's content
// @route   GET /api/content
// @access  Private
const getUserContent = asyncHandler(async (req, res) => {
  const contents = await Content.find({ user: req.user.id }).sort({ createdAt: -1 })
  res.json(contents)
})

// @desc    Delete content
// @route   DELETE /api/content/:id
// @access  Private
const deleteContent = asyncHandler(async (req, res) => {
  const content = await Content.findById(req.params.id)

  if (!content) {
    res.status(404)
    throw new Error('Content not found')
  }

  // Ensure user owns the content
  if (content.user.toString() !== req.user.id) {
    res.status(401)
    throw new Error('Not authorized')
  }

  await content.deleteOne()

  res.json({ id: req.params.id })
})

module.exports = { createContent, getUserContent, deleteContent }
