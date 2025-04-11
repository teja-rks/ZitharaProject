const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const User = require('../models/User');
const axios = require('axios');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('confirmPassword', 'Please confirm your password').exists()
  ],
  authController.register
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  authController.login
);

// @route   GET /api/auth/me
// @desc    Get user data
// @access  Private
router.get('/me', auth, authController.getMe);

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', auth, authController.updateProfile);

// Instagram OAuth routes
router.get('/instagram/connect', auth, (req, res) => {
  const state = Math.random().toString(36).substring(7);
  const redirectUri = `http://localhost:5000/api/auth/instagram/callback`;
  const url = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code&state=${state}`;
  res.json({ url, state });
});

router.post('/instagram/save-username', auth, async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user.socialConnections) {
      user.socialConnections = {};
    }
    
    user.socialConnections.instagram = {
      ...user.socialConnections.instagram,
      username
    };
    
    await user.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving Instagram username:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/instagram/callback', auth, async (req, res) => {
  try {
    const { code, state } = req.query;
    const savedState = req.cookies.instagram_oauth_state;

    if (state !== savedState) {
      return res.status(400).json({ message: 'Invalid state parameter' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', {
      client_id: process.env.INSTAGRAM_CLIENT_ID,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: 'http://localhost:5000/api/auth/instagram/callback',
      code
    });

    const { access_token, user_id } = tokenResponse.data;

    // Save Instagram access token and user ID
    const user = await User.findById(req.user.id);
    if (!user.socialConnections) {
      user.socialConnections = {};
    }
    
    user.socialConnections.instagram = {
      ...user.socialConnections.instagram,
      accessToken: access_token,
      userId: user_id,
      connected: true
    };
    
    await user.save();

    // Redirect back to frontend
    res.redirect('http://localhost:3000/profile?instagram=connected');
  } catch (error) {
    console.error('Instagram OAuth error:', error);
    res.redirect('http://localhost:3000/profile?instagram=error');
  }
});

// Facebook OAuth routes
router.get('/facebook/connect', auth, (req, res) => {
  try {
    if (!process.env.FACEBOOK_CLIENT_ID || !process.env.FACEBOOK_CLIENT_SECRET) {
      return res.status(500).json({ 
        message: 'Facebook app credentials not configured. Please set up your Facebook Developer account and add credentials to .env file.' 
      });
    }

    const state = Math.random().toString(36).substring(7);
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/facebook/callback`;
    const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${redirectUri}&scope=pages_show_list,pages_read_engagement,pages_manage_posts&state=${state}`;
    
    // Store state in cookie
    res.cookie('facebook_oauth_state', state, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000 // 1 hour
    });
    
    res.json({ url, state });
  } catch (error) {
    console.error('Facebook connect error:', error);
    res.status(500).json({ message: 'Error initiating Facebook connection' });
  }
});

router.post('/facebook/save-username', auth, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.socialConnections) {
      user.socialConnections = {};
    }
    
    user.socialConnections.facebook = {
      ...user.socialConnections.facebook,
      username
    };
    
    await user.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving Facebook username:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/facebook/callback', auth, async (req, res) => {
  try {
    const { code, state, error: fbError } = req.query;
    const savedState = req.cookies.facebook_oauth_state;

    // Clear the state cookie
    res.clearCookie('facebook_oauth_state');

    if (fbError) {
      console.error('Facebook OAuth error:', fbError);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?facebook=error&message=${encodeURIComponent(fbError)}`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?facebook=error&message=${encodeURIComponent('No authorization code received')}`);
    }

    if (state !== savedState) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?facebook=error&message=${encodeURIComponent('Invalid state parameter')}`);
    }

    // Exchange code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_CLIENT_ID,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET,
        redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/facebook/callback`,
        code
      }
    });

    const { access_token } = tokenResponse.data;

    // Get user's pages
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token
      }
    });

    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?facebook=error&message=${encodeURIComponent('No Facebook pages found')}`);
    }

    // Save Facebook access token and page ID
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?facebook=error&message=${encodeURIComponent('User not found')}`);
    }

    if (!user.socialConnections) {
      user.socialConnections = {};
    }
    
    user.socialConnections.facebook = {
      ...user.socialConnections.facebook,
      accessToken: access_token,
      pageId: pagesResponse.data.data[0].id,
      connected: true
    };
    
    await user.save();

    // Redirect back to frontend
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?facebook=connected`);
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?facebook=error&message=${encodeURIComponent(errorMessage)}`);
  }
});

module.exports = router; 