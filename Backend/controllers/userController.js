// @desc    Get user's connected platforms
// @route   GET /api/user/connected-platforms
// @access  Private
exports.getConnectedPlatforms = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Debug: Log the entire user object
    console.log('User object:', JSON.stringify(user, null, 2));
    
    // Debug: Log the entire socialConnections object
    console.log('Full socialConnections:', JSON.stringify(user.socialConnections, null, 2));
    
    // Debug: Log Twitter connection details
    const twitterDetails = user.socialConnections?.twitter || {};
    console.log('Twitter connection details:', {
      connected: twitterDetails.connected,
      hasApiKey: Boolean(twitterDetails.apiKey),
      hasApiSecret: Boolean(twitterDetails.apiSecret),
      hasAccessToken: Boolean(twitterDetails.accessToken),
      hasAccessTokenSecret: Boolean(twitterDetails.accessTokenSecret)
    });
    
    // Check if Twitter is connected by verifying all required credentials are present
    const isTwitterConnected = Boolean(
      twitterDetails.connected &&
      twitterDetails.apiKey &&
      twitterDetails.apiSecret &&
      twitterDetails.accessToken &&
      twitterDetails.accessTokenSecret
    );
    
    const connectedPlatforms = {
      instagram: Boolean(user.socialConnections?.instagram?.connected),
      facebook: Boolean(user.socialConnections?.facebook?.connected)
      // Twitter is intentionally excluded
    };
    
    // Debug: Log the final connection status
    console.log('Final connection status:', connectedPlatforms);
    
    return res.status(200).json({
      success: true,   
      connectedPlatforms
    });
  } catch (error) {
    console.error('Error getting connected platforms:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 