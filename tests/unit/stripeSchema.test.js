import { describe, expect, it } from 'vitest';
import { CreateCheckoutSessionSchema } from '../../schemas/stripeSchema.js';

const checkout = {
    items: [{ productId: '00000000-0000-4000-8000-000000000001', quantity: 1 }],
    shipping: {
        fullName: 'Jan Kowalski',
        email: 'jan@example.com',
        country: 'Polska',
        city: 'Jelenia Góra',
        postal_code: '58-500',
        street: 'Testowa',
        house_number: '1'
    }
};

describe('CreateCheckoutSessionSchema', () => {
    it('accepts a valid guest checkout without a browser-supplied user ID', () => {
        expect(CreateCheckoutSessionSchema.safeParse(checkout).success).toBe(true);
    });

    it('does not treat a browser-supplied user ID as checkout identity', () => {
        const parsed = CreateCheckoutSessionSchema.parse({
            ...checkout,
            userId: '00000000-0000-4000-8000-000000000002'
        });

        expect(parsed).not.toHaveProperty('userId');
    });

    it('keeps validating customer email and non-empty order items', () => {
        expect(CreateCheckoutSessionSchema.safeParse({
            ...checkout,
            shipping: { ...checkout.shipping, email: 'invalid' }
        }).success).toBe(false);
        expect(CreateCheckoutSessionSchema.safeParse({ ...checkout, items: [] }).success).toBe(false);
    });
});


describe('CheckoutSessionStatusSchema', () => {
    it('accepts Stripe session IDs and rejects arbitrary input', async () => {
        const { CheckoutSessionStatusSchema } = await import('../../schemas/stripeSchema.js');

        expect(CheckoutSessionStatusSchema.safeParse({ sessionId: 'cs_test_1234567890' }).success).toBe(true);
        expect(CheckoutSessionStatusSchema.safeParse({ sessionId: 'order-123' }).success).toBe(false);
        expect(CheckoutSessionStatusSchema.safeParse({}).success).toBe(false);
    });
});
