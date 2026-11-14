import express from 'express';
import env from '../server/config/env.js';
import { optionalAuth, verifyToken } from '../server/middleware/authMiddleware.js';
import {
    createCheckoutSession,
    createTerrariumCheckoutSession,
    getCheckoutSessionStatus
} from '../server/controllers/stripeController.js';

const createStripeRoutes = ({ orderLimiter }) => {
    const router = express.Router();

    router.get('/config', (_req, res) => {
        res.set('Cache-Control', 'no-store');
        res.json({ shippingAmountCents: env.ORDER_SHIPPING_CENTS });
    });
    router.post('/create-checkout-session', orderLimiter, optionalAuth, createCheckoutSession);
    router.post('/terrarium/projects/:projectId/checkout', orderLimiter, verifyToken, createTerrariumCheckoutSession);
    router.post('/checkout-session/status', optionalAuth, getCheckoutSessionStatus);

    return router;
};

export default createStripeRoutes;
