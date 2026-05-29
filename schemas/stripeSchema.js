import { z } from 'zod';

const CheckoutItemSchema = z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().positive('Quantity must be at least 1')
});

const CheckoutShippingSchema = z.object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Valid email is required'),
    country: z.string().min(2, 'Country is required'),
    city: z.string().min(2, 'City is required'),
    postal_code: z.string().regex(/^\d{2}-\d{3}$/, 'Postal code must use the format 00-000'),
    street: z.string().min(2, 'Street is required'),
    house_number: z.string().min(1, 'House number is required'),
    apartment_number: z.string().max(20).optional().or(z.literal(''))
});

export const CreateCheckoutSessionSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    items: z.array(CheckoutItemSchema).min(1, 'Checkout must include at least one item'),
    shipping: CheckoutShippingSchema,
    discountCode: z.string().min(3).max(50).optional().nullable()
});
