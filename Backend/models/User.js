const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  company: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: 'user'
  },
  location: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String,
    default: ''
  },
  socialConnections: {
    instagram: {
      connected: {
        type: Boolean,
        default: false
      },
      username: {
        type: String,
        default: ''
      },
      accessToken: {
        type: String,
        default: ''
      },
      userId: {
        type: String,
        default: ''
      }
    },
    facebook: {
      connected: {
        type: Boolean,
        default: false
      },
      pageId: {
        type: String,
        default: ''
      },
      accessToken: {
        type: String,
        default: ''
      }
    },
    twitter: {
      connected: {
        type: Boolean,
        default: false
      },
      username: {
        type: String,
        default: ''
      },
      apiKey: {
        type: String,
        default: ''
      },
      apiSecret: {
        type: String,
        default: ''
      },
      accessToken: {
        type: String,
        default: ''
      },
      accessTokenSecret: {
        type: String,
        default: ''
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 