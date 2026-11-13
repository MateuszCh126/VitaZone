import express from 'express';
import { ShippingQuoteSchema } from '../schemas/shippingSchema.js';
import * as productRepo from '../repositories/productRepository.js';
import env from '../server/config/env.js';
import { createFurgonetkaGateway, getShippingQuotes } from '../server/services/shippingService.js';

const router = express.Router();
const gateway = createFurgonetkaGateway({ env });

router.post('/quotes', async (req, res) => {
    const parsed = ShippingQuoteSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Uzupełnij poprawne dane dostawy.', code: 'INVALID_SHIPPING_REQUEST' });
    }

    try {
        const ids = [...new Set(parsed.data.items.map((item) => item.productId))];
        const products = await productRepo.getShippingProductsByIds(ids);
        const quotes = await getShippingQuotes({ ...parsed.data, products, gateway });
        res.set('Cache-Control', 'no-store');
        return res.json({ quotes: quotes.map(({ method, label, amountCents, currency }) => ({ method, label, amountCents, currency })) });
    } catch (error) {
        const statusCode = error.statusCode || 503;
        return res.status(statusCode).json({
            error: error.message || 'Nie udało się obliczyć dostawy.',
            code: error.code || 'SHIPPING_UNAVAILABLE'
        });
    }
});

export default router;
