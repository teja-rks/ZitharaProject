const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const {
  createCampaign,
  getCampaigns,
  getCampaignAnalytics,
  updateCampaign,
  deleteCampaign,
  scheduleCampaign
} = require('../controllers/campaignController');

// Campaign routes
router.route('/')
    .post(auth, upload.single('image'), createCampaign)
    .get(auth, getCampaigns);

router.route('/:id')
    .put(auth, upload.single('image'), updateCampaign)
    .delete(auth, deleteCampaign);

router.route('/:id/analytics')
    .get(auth, getCampaignAnalytics);

router.route('/:id/schedule')
    .post(auth, scheduleCampaign);

module.exports = router; 