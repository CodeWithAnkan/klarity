const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createContent, getUserContent, deleteContent } = require('../controllers/contentController');
const { protect } = require('../middleware/authMiddleware');

// Configure multer for temporary file storage in memory or on disk
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// The main route now handles both URL (as JSON) and file uploads (as multipart/form-data)
router.route('/')
  .get(protect, getUserContent)
  .post(protect, upload.single('file'), createContent); // Use multer middleware

router.route('/:id').delete(protect, deleteContent);

module.exports = router;