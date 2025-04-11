const axios = require('axios');
const crypto = require('crypto');
const OAuth = require('oauth-1.0a');

class SocialMediaService {
  constructor(user) {
    this.user = user;
    this.platforms = {
      instagram: null,
      facebook: null,
      twitter: null
    };
    this.initializeClients();
  }

  initializeClients() {
    // Initialize Instagram client if connected
    if (this.user.socialConnections?.instagram?.connected) {
      this.platforms.instagram = {
        accessToken: this.user.socialConnections.instagram.accessToken,
        userId: this.user.socialConnections.instagram.userId
      };
    }
  
    // Initialize Facebook client if connected
    if (this.user.socialConnections?.facebook?.connected) {
      this.platforms.facebook = {
        accessToken: this.user.socialConnections.facebook.accessToken,
        pageId: this.user.socialConnections.facebook.pageId
      };
    }
  
    // Initialize Twitter client if connected
    if (this.user.socialConnections?.twitter?.connected && 
        this.user.socialConnections?.twitter?.apiKey && 
        this.user.socialConnections?.twitter?.apiSecret && 
        this.user.socialConnections?.twitter?.accessToken && 
        this.user.socialConnections?.twitter?.accessTokenSecret) {
      this.platforms.twitter = {
        apiKey: this.user.socialConnections.twitter.apiKey,
        apiSecret: this.user.socialConnections.twitter.apiSecret,
        accessToken: this.user.socialConnections.twitter.accessToken,
        accessTokenSecret: this.user.socialConnections.twitter.accessTokenSecret
      };
      console.log('Twitter client initialized with keys:', 
                  this.user.socialConnections.twitter.apiKey ? 'API Key present' : 'API Key missing',
                  this.user.socialConnections.twitter.apiSecret ? 'API Secret present' : 'API Secret missing',
                  this.user.socialConnections.twitter.accessToken ? 'Access Token present' : 'Access Token missing',
                  this.user.socialConnections.twitter.accessTokenSecret ? 'Access Token Secret present' : 'Access Token Secret missing');
    } else {
      console.log('Twitter client not initialized. Missing credentials:', {
        connected: this.user.socialConnections?.twitter?.connected,
        hasApiKey: Boolean(this.user.socialConnections?.twitter?.apiKey),
        hasApiSecret: Boolean(this.user.socialConnections?.twitter?.apiSecret),
        hasAccessToken: Boolean(this.user.socialConnections?.twitter?.accessToken),
        hasAccessTokenSecret: Boolean(this.user.socialConnections?.twitter?.accessTokenSecret)
      });
    }
  }

  async postContent(campaign) {
    const results = {};
    const errors = [];
  
    // Post to each selected platform
    for (const platform of campaign.platforms) {
      try {
        if (!this.platforms[platform]) {
          console.warn(`${platform} client not available. User may not have connected their ${platform} account.`);
          errors.push({
            platform,
            error: `${platform} client not initialized. Please connect your ${platform} account in settings.`,
            details: { connectRequired: true }
          });
          continue; // Skip to next platform instead of throwing error
        }
  
        let result = null;
        switch (platform) {
          case 'instagram':
            result = await this.postToInstagram(campaign);
            break;
          case 'facebook':
            result = await this.postToFacebook(campaign);
            break;
          case 'twitter':
            result = await this.postToTwitter(campaign);
            break;
        }
        
        if (result) {
          results[platform] = result;
        }
      } catch (error) {
        console.error(`Error posting to ${platform}:`, error);
        errors.push({
          platform,
          error: error.message,
          details: error.response?.data || error
        });
      }
    }
  
    // Even if some platforms failed, we still return the successful ones
    return {
      success: errors.length === 0,
      results,
      errors: errors.length > 0 ? errors : null
    };
  }

  // Post to Instagram using Graph API
  async postToInstagram(campaign) {
    try {
      const { accessToken } = this.platforms.instagram;
      
      // First, upload the media
      const mediaResponse = await axios.post(
        `https://graph.instagram.com/me/media?access_token=${accessToken}`,
        {
          image_url: campaign.content.image,
          caption: campaign.content.text
        }
      );

      // Then publish the media
      const publishResponse = await axios.post(
        `https://graph.instagram.com/me/media_publish?access_token=${accessToken}`,
        {
          creation_id: mediaResponse.data.id
        }
      );

      return {
        success: true,
        postId: publishResponse.data.id,
        url: `https://instagram.com/p/${publishResponse.data.id}`
      };
    } catch (error) {
      console.error('Instagram posting error:', error);
      return { success: false, error: error.message };
    }
  }

  // Post to Facebook using Graph API
  async postToFacebook(campaign) {
    try {
      const { accessToken, pageId } = this.platforms.facebook;
      
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${pageId}/photos`,
        {
          url: campaign.content.image,
          message: campaign.content.text,
          access_token: accessToken
        }
      );

      return {
        success: true,
        postId: response.data.id,
        url: `https://facebook.com/${response.data.id}`
      };
    } catch (error) {
      console.error('Facebook posting error:', error);
      return { success: false, error: error.message };
    }
  }

  // Post to Twitter using Twitter API v2
  async postToTwitter(campaign) {
    try {
      const { accessToken, accessTokenSecret, apiKey, apiSecret } = this.platforms.twitter;
      
      // Create OAuth 1.0a instance
      const oauth = new OAuth({
        consumer: { key: apiKey, secret: apiSecret },
        signature_method: 'HMAC-SHA1',
        hash_function(base_string, key) {
          return crypto
            .createHmac('sha1', key)
            .update(base_string)
            .digest('base64');
        },
      });
  
      // Get the text content, ensuring it's a string and properly formatted
      const tweetText = typeof campaign.content === 'string' 
        ? campaign.content 
        : campaign.content.text || campaign.content.toString();
  
      // Format the data according to Twitter API v2 requirements
      const tweetData = { text: tweetText };
      
      // Define the API endpoint
      const requestData = {
        url: 'https://api.twitter.com/2/tweets',
        method: 'POST'
      };
  
      // Generate authorization header
      const authHeader = oauth.toHeader(oauth.authorize(requestData, {
        key: accessToken,
        secret: accessTokenSecret
      }));
  
      console.log('Preparing to send tweet with data:', {
        text: tweetText.substring(0, 20) + '...',
        auth: 'Bearer tokens present',
        endpoint: requestData.url
      });
  
      // Make the API call
      const response = await axios({
        url: requestData.url,
        method: requestData.method,
        headers: {
          ...authHeader,
          'Content-Type': 'application/json'
        },
        data: tweetData
      });
  
      console.log('Twitter API response:', {
        status: response.status,
        data: response.data
      });
  
      if (response.data && response.data.data && response.data.data.id) {
        return {
          success: true,
          postId: response.data.data.id,
          url: `https://twitter.com/i/web/status/${response.data.data.id}`
        };
      } else {
        throw new Error('Invalid response structure from Twitter API');
      }
    } catch (error) {
      console.error('Twitter posting error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Return a more descriptive error
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message,
        errorCode: error.response?.status,
        details: error.response?.data
      };
    }
  }

  // Get Instagram analytics
  async getInstagramAnalytics(postId) {
    const { accessToken } = this.platforms.instagram;
    const response = await axios.get(
      `https://graph.instagram.com/${postId}/insights?metric=impressions,reach,engagement&access_token=${accessToken}`
    );
    return response.data;
  }

  // Get Facebook analytics
  async getFacebookAnalytics(postId) {
    const { accessToken } = this.platforms.facebook;
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${postId}/insights?metric=post_impressions,post_engaged_users,post_reactions_by_type&access_token=${accessToken}`
    );
    return response.data;
  }

  // Get Twitter analytics
  async getTwitterAnalytics(postId) {
    const { accessToken } = this.platforms.twitter;
    const response = await axios.get(
      `https://api.twitter.com/2/tweets/${postId}?tweet.fields=public_metrics`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    return response.data;
  }
}

// Export the class
module.exports = SocialMediaService;