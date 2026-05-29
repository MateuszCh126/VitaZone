import express from 'express';
import logger from '../server/config/logger.js';
import * as userRepo from '../repositories/userRepository.js';
import { ProfileUpdateSchema } from '../schemas/userSchema.js';

const router = express.Router();

router.get('/:id', async (req, res) => {
    try {
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const user = await userRepo.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { passwordHash: _, ...safeUser } = user;
        res.json(safeUser);
    } catch (error) {
        logger.error('Fetch user profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/:id', async (req, res) => {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const validatedData = ProfileUpdateSchema.parse(req.body);
        const parsedNameParts = validatedData.name
            ? validatedData.name.trim().split(/\s+/)
            : [];
        const firstName = validatedData.firstName || parsedNameParts[0];
        const lastName = validatedData.lastName || (parsedNameParts.length > 1 ? parsedNameParts.slice(1).join(' ') : undefined);

        const updatePayload = {
            firstName,
            lastName,
            country: validatedData.country,
            city: validatedData.city,
            postalCode: validatedData.postal_code,
            street: validatedData.street,
            houseNumber: validatedData.house_number,
            apartmentNumber: validatedData.apartment_number,
            phone: validatedData.phone
        };

        Object.keys(updatePayload).forEach((key) => updatePayload[key] === undefined && delete updatePayload[key]);

        const updated = await userRepo.updateById(req.params.id, updatePayload);
        if (!updated) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { passwordHash: _, ...safeUser } = updated;
        res.json(safeUser);
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        logger.error('Update user profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
