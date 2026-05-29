import { z } from 'zod';

export const CreateDiscountSchema = z.object({
    code: z.string().min(3).max(50).toUpperCase(),
    type: z.enum(['percent', 'fixed']),
    value: z.number().int().positive(),
    startsAt: z.string().datetime().optional(), // ISO String
    expiresAt: z.string().datetime().nullable().optional(), // ISO String
    usageLimit: z.number().int().positive().nullable().optional(),
    isActive: z.boolean().optional()
});

export const UpdateDiscountSchema = CreateDiscountSchema.partial();

export const ValidateDiscountSchema = z.object({
    code: z.string().min(3).max(50).toUpperCase(),
    cartTotal: z.number().nonnegative() // To check if fixed discount > total
});
