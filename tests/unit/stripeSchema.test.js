import { describe, expect, it } from 'vitest';
import { CreateCheckoutSessionSchema } from '../../schemas/stripeSchema.js';

const checkout = {
    items: [{ productId: '00000000-0000-4000-8000-000000000001', quantity: 1 }],
    shipping: {
        fullName: 'Jan Kowalski',
        email: 'jan@example.com',
        phone: '500600700',
        country: 'Polska',
        city: 'Jelenia Góra',
        postal_code: '58-500',
        street: 'Testowa',
        house_number: '1'
    },
    deliveryMethod: 'inpost',
    expectedShippingAmountCents: 1234
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

    it('requires a server-requoted supported delivery method and strips browser quote fields', () => {
        expect(CreateCheckoutSessionSchema.safeParse({
            ...checkout,
            deliveryMethod: undefined
        }).success).toBe(false);

        const parsed = CreateCheckoutSessionSchema.parse({
            ...checkout,
            deliveryMethod: 'dpd',
            expectedShippingAmountCents: 1,
            shippingAmountCents: 1,
            serviceId: 'browser-controlled',
            deliveryProvider: 'browser-controlled'
        });
        expect(parsed.deliveryMethod).toBe('dpd');
        expect(parsed).not.toHaveProperty('shippingAmountCents');
        expect(parsed).not.toHaveProperty('serviceId');
        expect(parsed).not.toHaveProperty('deliveryProvider');
        expect(parsed.expectedShippingAmountCents).toBe(1);
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
