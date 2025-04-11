const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
  // Get token from header
  let token = req.header('x-auth-token');
  
  // Check for Bearer token format
  const bearerHeader = req.header('Authorization');
  if (!token && bearerHeader && bearerHeader.startsWith('Bearer ')) {
    token = bearerHeader.split(' ')[1];
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID from token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Set user in request
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name
    };
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 