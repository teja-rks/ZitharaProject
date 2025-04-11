const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  registerUser,
  loginUser,
  getMe,
  updateUser,
  getConnectedPlatforms
} = require('../controllers/userController');

// ... existing routes ...

router.get('/connected-platforms', protect, getConnectedPlatforms);

// ... existing code ... 