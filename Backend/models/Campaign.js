const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  platforms: [{
    type: String,
    required: true
  }],
  scheduledTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  publishedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'published', 'failed'],
    default: 'pending'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mediaFiles: [{
    type: String
  }],
  postStatus: {
    success: {
      type: Boolean,
      default: false
    },
    platforms: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    errors: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Campaign', campaignSchema); 