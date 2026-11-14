import express from 'express';
import { optionalAuth } from '../server/middleware/authMiddleware.js';
import {
    createCheckoutSession,
    getCheckoutSessionStatus
} from '../server/controllers/stripeController.js';

const createStripeRoutes = ({ orderLimiter }) => {
    const router = express.Router();

    router.post('/create-checkout-session', orderLimiter, optionalAuth, createCheckoutSession);
    router.post('/checkout-session/status', optionalAuth, getCheckoutSessionStatus);

    return router;
};

export default createStripeRoutes;
