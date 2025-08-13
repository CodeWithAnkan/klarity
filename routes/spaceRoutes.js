const express = require('express');
const router = express.Router();
const {
  createSpace,
  getSpaces,
  updateSpace,
  deleteSpace,
  getSpaceContent,
  searchSpace,
  chatInSpace,
} = require('../controllers/spaceController');
const { protect } = require('../middleware/authMiddleware');

// Route definitions
router.route('/').get(protect, getSpaces).post(protect, createSpace);
router.route('/:id').put(protect, updateSpace).delete(protect, deleteSpace);

// Route to get all content items within a space
router.route('/:id/content').get(protect, getSpaceContent);

// Route to perform semantic search within a space
router.route('/:id/search').post(protect, searchSpace);

// Route to perform a full chat/RAG query
router.route('/:id/chat').post(protect, chatInSpace);

module.exports = router;