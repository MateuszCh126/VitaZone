import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import logger from '../config/logger.js';
import * as userRepo from '../../repositories/userRepository.js';

const JWT_SECRET = env.JWT_SECRET;

const getTokenFromRequest = (req) => req.cookies?.token
    || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

const hydrateUserFromToken = async (token) => {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userRepo.findById(decoded.id);

    if (!user) {
        return null;
    }

    return {
        id: user.id,
        email: user.email,
        role: user.role
    };
};

export const verifyToken = async (req, res, next) => {
    const token = getTokenFromRequest(req);

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const user = await hydrateUserFromToken(token);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized: User not found' });
        }

        req.user = user;

        // Track last active timestamp (fire and forget)
        userRepo.updateLastActive(user.id).catch(err => logger.warn('Failed to update activity:', err));

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

export const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        next();
    });
};

export const optionalAuth = async (req, res, next) => {
    const token = getTokenFromRequest(req);

    if (!token) {
        return next();
    }

    try {
        const user = await hydrateUserFromToken(token);
        if (user) {
            req.user = user;
        }
    } catch (error) {
        logger.warn('Optional auth token ignored:', error?.message || error);
    }

    next();
};
