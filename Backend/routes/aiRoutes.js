const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateContent } = require('../controllers/aiController');

// @route   POST /api/ai/generate
// @desc    Generate content using AI
// @access  Private
router.post('/generate', auth, generateContent);

module.exports = router; 