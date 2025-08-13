const express = require('express')
const router = express.Router()
const { createContent, getUserContent, deleteContent } = require('../controllers/contentController')
const { protect } = require('../middleware/authMiddleware')

// Apply protection to all content routes
router.use(protect)

router.post('/', createContent)
router.get('/', getUserContent)
router.delete('/:id', deleteContent)

module.exports = router
