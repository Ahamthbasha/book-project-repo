const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define allowed file types
const FILE_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce/products', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    transformation: [{ 
      width: 1000, 
      height: 1000, 
      crop: 'limit', // Maintains aspect ratio
      quality: 'auto' // Automatic quality optimization
    }],
    public_id: (req, file) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
      return `product_${filename}_${uniqueSuffix}`;
    },
  },
});

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const isValid = !!FILE_TYPE_MAP[file.mimetype];
    if (isValid) {
      cb(null, true);
    } else {
      req.fileValidationError = 'Invalid file type! Only images (JPG, PNG, WebP, AVIF) are allowed.';
      cb(new Error('Invalid file type! Only images (JPG, PNG, WebP, AVIF) are allowed.'), false);
    }
  },
});

// Export both upload and cloudinary for use in controllers
module.exports = { upload, cloudinary };