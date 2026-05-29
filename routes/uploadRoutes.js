import express from 'express';
import logger from '../server/config/logger.js';
import upload from '../server/services/storageService.js';
import { processImage } from '../server/services/imageService.js';

const router = express.Router();

router.post('/', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const optimizedUrl = await processImage(req.file.buffer, req.file.originalname);
        res.json({ url: optimizedUrl });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        logger.error(error);
        res.status(500).json({ error: 'Image processing failed' });
    }
});

export default router;
