import multer from 'multer';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif'
]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
        } else {
            const error = new Error('Only JPG, PNG, WEBP and AVIF images are allowed.');
            error.statusCode = 400;
            cb(error, false);
        }
    }
});

export default upload;
