// const multer = require('multer');
// const path = require('path');

// //Allowed file types
// const FILE_TYPE_MAP = {
//   'image/png': 'png',
//   'image/jpeg': 'jpeg',
//   'image/jpg': 'jpg',
//   'image/avif': 'avif',
// };

// Configure multer disk storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const isValid = FILE_TYPE_MAP[file.mimetype];
//     if (!isValid) {
//       return cb(new Error('Invalid image type')); // Reject invalid file types
//     }
//     cb(null, path.join(__dirname, '../public/images/products')); // Specify destination folder
//   },
//   filename: function (req, file, cb) {
//     const fileName = Date.now() + '_' + file.originalname;
//     cb(null, fileName); // Save the file with a unique name
//   },
// });

// const upload = multer({ storage: storage });

// module.exports = upload;


const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define allowed file types
const FILE_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',   // Recommended to add webp support
  'image/avif': 'avif',
};

// Correctly resolve the upload directory from project root
// This works even if this file is inside /middlewares or any subfolder
const uploadDir = path.join(__dirname, '..', '..', 'public', 'images', 'products');

// Ensure the directory exists (critical for production deployments like Render)
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created upload directory:', uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    if (!isValid) {
      return cb(new Error('Invalid image type. Only JPG, JPEG, PNG, WebP, and AVIF are allowed.'));
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp_originalname
    const uniqueName = Date.now() + '_' + file.originalname;
    cb(null, uniqueName);
  },
});

// Optional: Add file size limit (e.g., 5MB)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const isValid = !!FILE_TYPE_MAP[file.mimetype];
    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type! Only images (JPG, PNG, WebP, AVIF) are allowed.'));
    }
  },
});

module.exports = upload;