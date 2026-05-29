import express from 'express';
import logger from '../server/config/logger.js';
import * as discountRepo from '../repositories/discountRepository.js';
import { ValidateDiscountSchema } from '../schemas/discountSchema.js';

const createDiscountRoutes = ({ discountValidationLimiter }) => {
    const router = express.Router();

    router.post('/validate', discountValidationLimiter, async (req, res) => {
        try {
            const { code, cartTotal } = ValidateDiscountSchema.parse(req.body);
            const result = await discountRepo.validateDiscountClientSide(code, cartTotal);

            if (!result.valid) {
                return res.status(400).json({ error: 'Kod rabatowy jest niedostępny lub nieprawidłowy.' });
            }
            res.json(result.discount);
        } catch (error) {
            if (error.name === 'ZodError') {
                return res.status(400).json({ error: 'Dane formularza są nieprawidłowe', details: error.errors });
            }
            logger.error('Discount validation error:', error);
            res.status(500).json({ error: 'Nie udało się zweryfikować kodu rabatowego' });
        }
    });

    return router;
};

export default createDiscountRoutes;
