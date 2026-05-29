import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import env from '../server/config/env.js';
import logger from '../server/config/logger.js';
import * as userRepo from '../repositories/userRepository.js';
import { authCookieOptions } from '../server/config/http.js';
import { RegisterSchema, LoginSchema } from '../schemas/userSchema.js';
import { verifyToken } from '../server/middleware/authMiddleware.js';

const router = express.Router();
const JWT_SECRET = env.JWT_SECRET;

router.post('/register', async (req, res) => {
    try {
        const validatedData = RegisterSchema.parse(req.body);
        const passwordHash = await bcrypt.hash(validatedData.password, 12);

        const newUser = await userRepo.create({
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            passwordHash,
            role: 'user'
        });

        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const { passwordHash: _, ...safeUser } = newUser;
        res.cookie('token', token, authCookieOptions);
        res.status(201).json({ user: safeUser });
    } catch (error) {
        if (error.message === 'EMAIL_EXISTS' || error.detail?.includes('already exists')) {
            return res.status(409).json({ error: 'Ten adres e-mail jest już zarejestrowany' });
        }
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Dane formularza są nieprawidłowe', details: error.errors });
        }
        logger.error('Register error:', error);
        res.status(500).json({ error: 'Wystąpił błąd serwera podczas rejestracji' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const validatedData = LoginSchema.parse(req.body);
        const user = await userRepo.findByEmail(validatedData.email);

        if (!user || !(await bcrypt.compare(validatedData.password, user.passwordHash))) {
            return res.status(401).json({ error: 'Nieprawidłowy e-mail lub hasło' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const { passwordHash: _, ...safeUser } = user;
        res.cookie('token', token, authCookieOptions);
        res.json({ user: safeUser });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Dane formularza są nieprawidłowe', details: error.errors });
        }
        logger.error('Login error:', error);
        res.status(500).json({ error: 'Wystąpił błąd serwera podczas logowania' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: authCookieOptions.httpOnly,
        secure: authCookieOptions.secure,
        sameSite: authCookieOptions.sameSite
    });
    res.json({ message: 'Wylogowano pomyślnie' });
});

router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await userRepo.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Nie znaleziono użytkownika' });
        }

        const { passwordHash: _, ...safeUser } = user;
        res.json(safeUser);
    } catch (error) {
        logger.error('Fetch current user error:', error);
        res.status(500).json({ error: 'Wystąpił błąd serwera' });
    }
});

export default router;
