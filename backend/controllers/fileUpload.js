// middleware/upload.js

const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure all directories in the path exist
const createUploadDir = () => {
  const uploadPath = path.join(__dirname, '../public');
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
  }
  
  const uploadsPath = path.join(uploadPath, 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath);
  }
  
  const profileImagesPath = path.join(uploadsPath, 'profile-images');
  if (!fs.existsSync(profileImagesPath)) {
    fs.mkdirSync(profileImagesPath);
  }
  
  return profileImagesPath;
};

// Create directories
const uploadDir = createUploadDir();

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename with POC ID and timestamp
        const uniqueSuffix = `${req.body.pocId}-${Date.now()}`;
        const extension = path.extname(file.originalname);
        cb(null, `profile-${uniqueSuffix}${extension}`);
    }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Export multer middleware
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = upload;