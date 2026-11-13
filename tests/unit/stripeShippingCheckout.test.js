import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    createOrder: vi.fn(),
    findById: vi.fn(),
    attachPaymentReference: vi.fn(),
    sendOrderPaidEmail: vi.fn(),
    getShippingProductsByIds: vi.fn(),
    createFurgonetkaGateway: vi.fn(),
    getShippingQuotes: vi.fn(),
    createStripeSession: vi.fn(),
    loggerError: vi.fn()
}));

vi.mock('stripe', () => ({
    default: class StripeMock {
        checkout = { sessions: { create: mocks.createStripeSession, retrieve: vi.fn() } };
        webhooks = { constructEvent: vi.fn() };
    }
}));
vi.mock('../../server/config/env.js', () => ({
    default: {
        STRIPE_SECRET_KEY: 'sk_test_local_only',
        STRIPE_WEBHOOK_SECRET: 'whsec_local_only',
        STRIPE_CURRENCY: 'pln',
        STRIPE_CHECKOUT_EXPIRES_MINUTES: 30,
        CORS_ALLOWED_ORIGINS: '',
        PUBLIC_APP_URL: 'http://localhost:5173'
    }
}));
vi.mock('../../server/config/logger.js', () => ({ default: { error: mocks.loggerError } }));
vi.mock('../../repositories/orderRepository.js', () => ({
    createOrder: mocks.createOrder,
    findById: mocks.findById,
    attachPaymentReference: mocks.attachPaymentReference,
    releasePendingOrder: vi.fn(),
    markOrderPaidWithTransition: vi.fn(),
    markOrderRefundedByPaymentId: vi.fn()
}));
vi.mock('../../repositories/productRepository.js', () => ({
    getShippingProductsByIds: mocks.getShippingProductsByIds
}));
vi.mock('../../server/services/shippingService.js', () => ({
    createFurgonetkaGateway: mocks.createFurgonetkaGateway,
    getShippingQuotes: mocks.getShippingQuotes,
    resolveReviewedShippingQuote: ({ quotes, method, expectedAmountCents }) => {
        const quote = quotes.find((item) => item.method === method);
        return quote?.amountCents === expectedAmountCents
            ? { changed: false, quote }
            : { changed: true, quote: null };
    }
}));
vi.mock('../../server/services/emailService.js', () => ({ sendOrderPaidEmail: mocks.sendOrderPaidEmail }));

const { createCheckoutSession } = await import('../../server/controllers/stripeController.js');

const makeResponse = () => ({
    statusCode: 200,
    headers: {},
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    set(name, value) { this.headers[name] = value; return this; },
    json(body) { this.body = body; return this; }
});

const checkoutBody = {
    items: [{ productId: '00000000-0000-4000-8000-000000000001', quantity: 1 }],
    shipping: {
        fullName: 'Jan Kowalski',
        email: 'jan@example.com',
        phone: '500600700',
        country: 'PL',
        city: 'Warszawa',
        postal_code: '00-001',
        street: 'Testowa',
        house_number: '1'
    },
    deliveryMethod: 'dpd',
    expectedShippingAmountCents: 1500,
    deliveryServiceId: 'browser-service-id',
    deliveryProvider: 'browser-provider'
};

describe('Stripe checkout delivery quote review', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.createFurgonetkaGateway.mockReturnValue({ quote: vi.fn() });
        mocks.getShippingProductsByIds.mockResolvedValue([{ id: checkoutBody.items[0].productId }]);
    });

    it('returns fresh quotes and creates no order or Stripe session when shipping price changed', async () => {
        mocks.getShippingQuotes.mockResolvedValue([
            { method: 'dpd', label: 'DPD', amountCents: 1700, currency: 'pln', provider: 'furgonetka', providerServiceId: 72 }
        ]);
        const res = makeResponse();

        await createCheckoutSession({ body: checkoutBody, headers: { origin: 'http://localhost:5173' } }, res);

        expect(res.statusCode).toBe(409);
        expect(res.body).toMatchObject({
            code: 'SHIPPING_QUOTE_CHANGED',
            quotes: [{ method: 'dpd', amountCents: 1700 }]
        });
        expect(res.body.quotes[0]).not.toHaveProperty('providerServiceId');
        expect(mocks.createOrder).not.toHaveBeenCalled();
        expect(mocks.createStripeSession).not.toHaveBeenCalled();
    });

    it('uses the fresh server service ID and reviewed amount for the saved order and Stripe', async () => {
        mocks.getShippingQuotes.mockResolvedValue([
            { method: 'dpd', label: 'DPD', amountCents: 1500, currency: 'pln', provider: 'furgonetka', providerServiceId: 72 }
        ]);
        mocks.createOrder.mockResolvedValue({ id: 'order-demo-1' });
        mocks.findById.mockResolvedValue({
            id: 'order-demo-1',
            items: [{ name: 'Terrarium', price_cents: 10000, quantity: 1 }],
            discount_amount_cents: 0,
            shipping_address_json: { delivery: { method: 'dpd', amount_cents: 1500 } }
        });
        mocks.createStripeSession.mockResolvedValue({ id: 'cs_test_demo123', url: 'https://checkout.stripe.test/demo' });
        const res = makeResponse();

        await createCheckoutSession({ body: checkoutBody, headers: { origin: 'http://localhost:5173' } }, res);

        expect(res.statusCode).toBe(201);
        expect(mocks.createOrder).toHaveBeenCalledWith(expect.objectContaining({
            deliveryMethod: 'dpd',
            deliveryProvider: 'furgonetka',
            deliveryServiceId: 72,
            shippingAmountCents: 1500
        }));
        expect(mocks.createStripeSession).toHaveBeenCalledWith(expect.objectContaining({
            line_items: expect.arrayContaining([
                expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 1500 }) })
            ])
        }));
    });
});
