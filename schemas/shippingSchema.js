import { z } from 'zod';

const ShippingItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99)
});

const ShippingAddressSchema = z.object({
    fullName: z.string().min(2).max(120),
    email: z.string().email().max(254),
    phone: z.string().min(6).max(30),
    country: z.string().min(2).max(80),
    city: z.string().min(2).max(100),
    postal_code: z.string().regex(/^\d{2}-\d{3}$/),
    street: z.string().min(2).max(120),
    house_number: z.string().min(1).max(20),
    apartment_number: z.string().max(20).optional().or(z.literal(''))
});

export const ShippingQuoteSchema = z.object({
    items: z.array(ShippingItemSchema).min(1).max(50),
    shipping: ShippingAddressSchema
});
