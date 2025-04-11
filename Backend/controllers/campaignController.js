const Campaign = require('../models/Campaign');
const User = require('../models/User');
const SocialMediaService = require('../services/socialMedia');
const { OpenAI } = require('openai');

// Initialize OpenAI
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY
// });

// @desc    Create a new campaign
// @route   POST /api/campaigns
// @access  Private
exports.createCampaign = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    console.log('Received files:', req.file);
    console.log('User from token:', req.user);

    // Validate required fields
    if (!req.body.name || !req.body.content || !req.body.platforms) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Parse platforms if it's a string
    const parsedPlatforms = typeof req.body.platforms === 'string' ? JSON.parse(req.body.platforms) : req.body.platforms;

    // Set current time for immediate posting
    const currentTime = new Date();
    
    // Handle scheduling
    let scheduledTime;
    let initialStatus;
    
    // Check if this is a scheduled post
    const isScheduled = req.body.schedule && req.body.schedule.type === 'later';
    
    if (isScheduled) {
      // If schedule is provided, parse it
      const schedule = typeof req.body.schedule === 'string' ? JSON.parse(req.body.schedule) : req.body.schedule;
      const [hours, minutes] = schedule.postTime.split(':');
      scheduledTime = new Date(schedule.startDate);
      scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      initialStatus = 'scheduled';
    } else {
      // If no schedule or immediate post, set for immediate posting
      scheduledTime = currentTime;
      initialStatus = 'pending';
    }

    // Ensure scheduledTime is a valid date
    if (isNaN(scheduledTime.getTime())) {
      return res.status(400).json({ error: 'Invalid scheduled time' });
    }

    // Create new campaign
    const campaign = new Campaign({
      name: req.body.name,
      content: req.body.content,
      platforms: parsedPlatforms,
      scheduledTime: scheduledTime.toISOString(),
      status: initialStatus,
      user: req.user.id,
      mediaFiles: req.file ? [req.file.filename] : [],
      postStatus: {
        success: false,
        platforms: {}
      }
    });

    // Save campaign first
    await campaign.save();

    // For immediate posting (not scheduled), post right away
    if (!isScheduled) {
      try {
        // Get user for social media service
        const user = await User.findById(req.user.id);
        if (!user) {
          throw new Error('User not found');
        }

        const socialMediaService = new SocialMediaService(user);
        const postingResults = await socialMediaService.postContent(campaign);
        
        // Update campaign status based on posting results
        campaign.status = postingResults.success ? 'published' : 'failed';
        campaign.postStatus = {
          success: postingResults.success,
          platforms: postingResults.results || {},
          errors: postingResults.errors || {}
        };

        // If posting was successful, update publishedAt
        if (postingResults.success) {
          campaign.publishedAt = currentTime;
        }

        await campaign.save();
        
        return res.status(201).json({
          success: true,
          message: postingResults.success ? 'Campaign created and posted successfully' : 'Campaign created but posting failed',
          campaign,
          postingResults
        });
      } catch (postingError) {
        console.error('Error posting campaign:', postingError);
        campaign.status = 'failed';
        campaign.postStatus = {
          success: false,
          platforms: {},
          errors: [postingError.message]
        };
        await campaign.save();
        
        return res.status(201).json({
          success: true,
          message: 'Campaign created but posting failed',
          campaign,
          error: postingError.message
        });
      }
    }

    // For scheduled campaigns, return success
    return res.status(201).json({
      success: true,
      message: isScheduled ? 'Campaign scheduled successfully' : 'Campaign created successfully',
      campaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create campaign',
      error: error.message
    });
  }
};

// @desc    Get all campaigns for a user
// @route   GET /api/campaigns
// @access  Private
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: campaigns });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get single campaign
// @route   GET /api/campaigns/:id
// @access  Private
exports.getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get campaign analytics
// @route   GET /api/campaigns/:id/analytics
// @access  Private
exports.getCampaignAnalytics = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ 
      _id: req.params.id,
      user: req.user.id 
    });

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    // Get analytics for each platform
    const analytics = {};
    for (const platform of campaign.platforms) {
      if (campaign.socialMediaIds[platform]) {
        try {
          analytics[platform] = await socialMediaService.getAnalytics(
            platform,
            campaign.socialMediaIds[platform]
          );
        } catch (error) {
          console.error(`Error getting ${platform} analytics:`, error);
          analytics[platform] = { error: 'Failed to fetch analytics' };
        }
      }
    }

    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
// @access  Private
exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Schedule a campaign
// @route   POST /api/campaigns/:id/schedule
// @access  Private
exports.scheduleCampaign = async (req, res) => {
  try {
    const { scheduledTime } = req.body;
    
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { 
        scheduledTime,
        status: 'scheduled'
      },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    // Post to social media platforms
    const user = await User.findById(req.user.id);
    const results = await socialMediaService.postContent(user, campaign);

    // Update campaign with social media post IDs
    const socialMediaIds = {};
    for (const platform of campaign.platforms) {
      if (results[platform]?.success) {
        socialMediaIds[platform] = results[platform].postId;
      }
    }

    await Campaign.findByIdAndUpdate(
      campaign._id,
      { 
        socialMediaIds,
        status: 'published',
        publishedAt: new Date()
      }
    );

    res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Generate content using ChatGPT
// @route   POST /api/campaigns/generate-content
// @access  Private
// exports.generateContent = async (req, res) => {
//   try {
//     const { prompt, platform } = req.body;

//     const completion = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: [
//         {
//           role: "system",
//           content: "You are a social media content creator for a retail business. Create engaging and professional content."
//         },
//         {
//           role: "user",
//           content: `Create a ${platform} post about: ${prompt}`
//         }
//       ],
//       max_tokens: 150
//     });

//     const generatedContent = completion.choices[0].message.content;
//     res.status(200).json({ success: true, data: generatedContent });
//   } catch (error) {
//     console.error('Error generating content:', error);
//     res.status(400).json({ success: false, error: error.message });
//   }
// };
