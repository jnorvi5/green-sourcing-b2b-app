const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile } = require('../services/s3');
const { authenticateToken } = require('../middleware/auth');

// Configure Multer for memory storage
const storage = multer.memoryStorage();

// File filter for security
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Upload endpoint
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const folder = req.body.folder || 'uploads';
    const fileUrl = await uploadFile(req.file, folder);

    res.status(201).json({
      message: 'File uploaded successfully',
      url: fileUrl,
      key: fileUrl.split('.com/')[1] // Extract key for reference
    });
  } catch (error) {
    console.error('Upload Route Error:', error);
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
});

module.exports = router;
