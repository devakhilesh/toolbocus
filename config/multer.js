const multer = require('multer');
const path = require('path');

// Storage configuration for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'public', 'images', 'city')); // Destination folder
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Unique filename
    }
});

// File upload limits (adjust as needed)
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // Max file size (10MB)
    },
    fileFilter: function (req, file, cb) {
        // Add file type validation if needed
        cb(null, true);
    }
});

module.exports = upload;
