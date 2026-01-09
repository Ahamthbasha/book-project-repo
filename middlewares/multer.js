const multer = require('multer');
const path = require('path');

//Allowed file types
const FILE_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/avif': 'avif',
};

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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    if (!isValid) {
      return cb(new Error('Invalid image type'));
    }
    // Correct path: inside public/images/products
    cb(null, path.join(__dirname, 'public', 'images', 'products'));
  },
  filename: function (req, file, cb) {
    const fileName = Date.now() + '_' + file.originalname;
    cb(null, fileName);
  },
});


const upload = multer({ storage: storage });

module.exports = upload;


