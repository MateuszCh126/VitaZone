import express from 'express';
import {
    createCheckoutSession,
    getCheckoutSessionStatus
} from '../server/controllers/stripeController.js';

const createStripeRoutes = ({ orderLimiter }) => {
    const router = express.Router();

    router.post('/create-checkout-session', orderLimiter, createCheckoutSession);
    router.get('/checkout-session/:sessionId/status', getCheckoutSessionStatus);

    return router;
};

export default createStripeRoutes;
