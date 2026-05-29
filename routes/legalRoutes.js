import express from 'express';
import logger from '../server/config/logger.js';
import * as legalRepo from '../repositories/legalRepository.js';
import { ConsentBatchSchema, ConsentSchema } from '../schemas/legalSchema.js';
import { optionalAuth } from '../server/middleware/authMiddleware.js';

const router = express.Router();

router.post('/consent', optionalAuth, async (req, res) => {
    try {
        let consentItems = [];

        const singleParsed = ConsentSchema.safeParse(req.body);
        if (singleParsed.success) {
            consentItems = [singleParsed.data];
        } else {
            const batchParsed = ConsentBatchSchema.safeParse(req.body);
            if (!batchParsed.success) {
                return res.status(400).json({ error: 'Validation failed' });
            }
            consentItems = Object.entries(batchParsed.data).map(([consentType, status]) => ({ consentType, status }));
        }

        const userId = req.user?.id || null;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        for (const entry of consentItems) {
            await legalRepo.createConsent({
                userId,
                ipAddress: typeof ipAddress === 'string' ? ipAddress : JSON.stringify(ipAddress),
                consentType: entry.consentType,
                status: Boolean(entry.status)
            });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        logger.error('Consent Log Error:', error);
        res.status(500).json({ error: 'Failed to log consent' });
    }
});

export default router;
