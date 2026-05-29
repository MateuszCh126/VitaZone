import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const resolveRateLimitKey = (req) => ipKeyGenerator(req.ip || req.socket?.remoteAddress || '127.0.0.1');

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    keyGenerator: (req) => resolveRateLimitKey(req),
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const orderLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.user?.id || resolveRateLimitKey(req),
    message: { error: 'Too many orders created, please wait a while.' }
});

export const chatLimiter = rateLimit({
    windowMs: 120 * 60 * 1000,
    max: 30,
    keyGenerator: (req) => resolveRateLimitKey(req),
    message: { error: 'Chat limit reached, please try again later.' }
});

export const discountValidationLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 25,
    keyGenerator: (req) => resolveRateLimitKey(req),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many discount validation attempts, please try again later.' }
});

export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    keyGenerator: (req) => req.user?.id || resolveRateLimitKey(req),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many admin requests, please slow down.' }
});

export const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => req.user?.id || resolveRateLimitKey(req),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many upload attempts, please try again later.' }
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => resolveRateLimitKey(req),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later.' }
});
