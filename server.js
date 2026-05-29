import env from './server/config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';

import authRoutes from './routes/authRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import createDiscountRoutes from './routes/discountRoutes.js';
import legalRoutes from './routes/legalRoutes.js';
import createOrderRoutes from './routes/orderRoutes.js';
import createStripeRoutes from './routes/stripeRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

import { handleStripeWebhook } from './server/controllers/stripeController.js';
import { errorHandler } from './server/middleware/errorHandler.js';
import { verifyAdmin, verifyToken } from './server/middleware/authMiddleware.js';
import { verifyCsrfOrigin } from './server/middleware/csrfMiddleware.js';
import logger from './server/config/logger.js';
import { contextStorage } from './server/config/requestContext.js';
import { allowedOrigins } from './server/config/http.js';
import {
    adminLimiter,
    authLimiter,
    chatLimiter,
    discountValidationLimiter,
    globalLimiter,
    orderLimiter,
    uploadLimiter
} from './server/config/rateLimiters.js';

const app = express();
const PORT = env.PORT;

app.set('trust proxy', env.TRUST_PROXY_HOPS);
app.disable('x-powered-by');

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }
        if (!allowedOrigins.includes(origin)) {
            return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

app.use(helmet());
app.use(cookieParser());
app.use('/api', verifyCsrfOrigin(allowedOrigins));

app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || uuidv4();
    req.id = requestId;
    res.setHeader('X-Request-ID', requestId);

    const store = new Map();
    store.set('requestId', requestId);
    store.set('ip', req.ip);

    contextStorage.run(store, next);
});

app.use('/api', globalLimiter);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/stripe', verifyToken, createStripeRoutes({ orderLimiter }));
app.use('/api/orders', verifyToken, createOrderRoutes({ orderLimiter }));
app.use('/api/admin', adminLimiter, verifyAdmin, adminRoutes);
app.use('/api/discounts', createDiscountRoutes({ discountValidationLimiter }));
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/upload', verifyAdmin, uploadLimiter, uploadRoutes);
app.use('/api', catalogRoutes);
app.use('/api', legalRoutes);

app.use(errorHandler);

if (env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        logger.info(`VitaZone API running on http://localhost:${PORT}`);
    });
}

export default app;
