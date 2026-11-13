import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Buffer } from 'node:buffer';

const mocks = vi.hoisted(() => ({
    stripeCreate: vi.fn(),
    stripeRetrieve: vi.fn(),
    stripeConstructEvent: vi.fn(),
    createOrder: vi.fn(),
    findById: vi.fn(),
    attachPaymentReference: vi.fn(),
    releasePendingOrder: vi.fn(),
    markOrderPaidWithTransition: vi.fn(),
    sendOrderPaidEmail: vi.fn(),
    loggerError: vi.fn()
}));

vi.mock('stripe', () => ({
    default: class StripeMock {
        checkout = { sessions: { create: mocks.stripeCreate, retrieve: mocks.stripeRetrieve } };
        webhooks = { constructEvent: mocks.stripeConstructEvent };
    }
}));
vi.mock('../../server/config/env.js', () => ({
    default: {
        STRIPE_SECRET_KEY: 'sk_test_local_only',
        STRIPE_WEBHOOK_SECRET: 'whsec_local_only',
        STRIPE_CURRENCY: 'pln',
        STRIPE_CHECKOUT_EXPIRES_MINUTES: 30,
        ORDER_SHIPPING_CENTS: 1500,
        CORS_ALLOWED_ORIGINS: '',
        PUBLIC_APP_URL: 'http://localhost:5173'
    }
}));
vi.mock('../../server/config/logger.js', () => ({ default: { error: mocks.loggerError } }));
vi.mock('../../repositories/orderRepository.js', () => ({
    createOrder: mocks.createOrder,
    findById: mocks.findById,
    attachPaymentReference: mocks.attachPaymentReference,
    releasePendingOrder: mocks.releasePendingOrder,
    markOrderPaidWithTransition: mocks.markOrderPaidWithTransition
}));
vi.mock('../../server/services/emailService.js', () => ({ sendOrderPaidEmail: mocks.sendOrderPaidEmail }));

const { createCheckoutSession, getCheckoutSessionStatus, handleStripeWebhook } = await import('../../server/controllers/stripeController.js');

const shipping = {
    fullName: 'Jan Kowalski',
    email: 'jan@example.com',
    country: 'Polska',
    city: 'Jelenia Góra',
    postal_code: '58-500',
    street: 'Testowa',
    house_number: '1'
};

const makeResponse = () => ({
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    send(body) { this.body = body; return this; },
    set(name, value) { this.headers[name] = value; return this; }
});
describe('Stripe checkout controller contract', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.createOrder.mockResolvedValue({ id: 'order-demo-1' });
        mocks.findById.mockResolvedValue({
            id: 'order-demo-1',
            status: 'payment_pending',
            discount_amount_cents: 0,
            items: [{ name: 'Terrarium testowe', quantity: 1, price_cents: 10000 }]
        });
        mocks.stripeCreate.mockResolvedValue({ id: 'cs_test_demo1234567890', url: 'https://checkout.stripe.test/demo' });
        mocks.stripeConstructEvent.mockReturnValue({ type: 'unhandled.test', data: { object: {} } });
        mocks.attachPaymentReference.mockResolvedValue(undefined);
    });

    it('creates a guest order without accepting browser-supplied identity', async () => {
        const req = {
            body: { items: [{ productId: '00000000-0000-4000-8000-000000000001', quantity: 1 }], shipping,
                userId: '00000000-0000-4000-8000-000000000099' },
            headers: { origin: 'http://localhost:5173' }
        };
        const res = makeResponse();

        await createCheckoutSession(req, res);

        expect(mocks.createOrder).toHaveBeenCalledWith(expect.objectContaining({ userId: null }));
        expect(mocks.stripeCreate).toHaveBeenCalledWith(expect.objectContaining({
            customer_email: shipping.email,
            metadata: { orderId: 'order-demo-1' },
            payment_intent_data: { metadata: { orderId: 'order-demo-1' } }
        }));
        expect(mocks.stripeCreate.mock.calls[0][0]).not.toHaveProperty('payment_method_types');
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({ sessionId: 'cs_test_demo1234567890', url: 'https://checkout.stripe.test/demo' });
    });

    it('binds a signed-in order to server-authenticated identity', async () => {
        const res = makeResponse();
        await createCheckoutSession({
            user: { id: 'user-authenticated-1' },
            body: { items: [{ productId: '00000000-0000-4000-8000-000000000001', quantity: 1 }], shipping },
            headers: {}
        }, res);

        expect(mocks.createOrder).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-authenticated-1' }));
        expect(mocks.stripeCreate).toHaveBeenCalledWith(expect.objectContaining({
            metadata: { orderId: 'order-demo-1', userId: 'user-authenticated-1' }
        }));
        expect(res.statusCode).toBe(201);
    });

    it('releases reserved stock when Stripe cannot create the session', async () => {
        mocks.stripeCreate.mockRejectedValueOnce(new Error('Stripe unavailable'));
        const res = makeResponse();

        await createCheckoutSession({
            body: { items: [{ productId: '00000000-0000-4000-8000-000000000001', quantity: 1 }], shipping },
            headers: {}
        }, res);

        expect(mocks.releasePendingOrder).toHaveBeenCalledWith('order-demo-1', null);
        expect(res.statusCode).toBe(500);
        expect(res.body).not.toHaveProperty('stack');
    });

    it('returns minimal status to a guest and reconciles only Stripe-reported paid status', async () => {
        mocks.stripeRetrieve.mockResolvedValue({
            id: 'cs_test_demo1234567890', status: 'complete', payment_status: 'paid',
            amount_total: 11500, currency: 'pln',
            metadata: { orderId: 'order-demo-1' }, payment_intent: 'pi_demo_1'
        });
        mocks.markOrderPaidWithTransition.mockResolvedValue({ transitioned: false, order: { id: 'order-demo-1' } });
        const res = makeResponse();

        await getCheckoutSessionStatus({ body: { sessionId: 'cs_test_demo1234567890' } }, res);

        expect(mocks.markOrderPaidWithTransition).toHaveBeenCalledWith('order-demo-1', 'pi_demo_1');
        expect(res.body).toEqual({
            checkoutStatus: 'complete',
            paymentStatus: 'paid',
            amountTotalCents: 11500,
            currency: 'PLN'
        });
        expect(res.body).not.toHaveProperty('orderId');
        expect(res.headers['Cache-Control']).toBe('no-store');
    });

    it('does not reveal a signed-in order status to a different account', async () => {
        mocks.stripeRetrieve.mockResolvedValue({
            id: 'cs_test_demo1234567890', status: 'open', payment_status: 'unpaid',
            metadata: { orderId: 'order-demo-1', userId: 'user-owner' }
        });
        const res = makeResponse();

        await getCheckoutSessionStatus({ body: { sessionId: 'cs_test_demo1234567890' }, user: { id: 'other-user' } }, res);

        expect(res.statusCode).toBe(403);
        expect(res.body).toEqual({ error: 'Brak dostępu' });
        expect(mocks.findById).not.toHaveBeenCalled();
    });

    it('lets a signed-out customer check payment status without exposing account order details', async () => {
        mocks.stripeRetrieve.mockResolvedValue({
            id: 'cs_test_demo1234567890', status: 'complete', payment_status: 'paid',
            metadata: { orderId: 'order-demo-1', userId: 'user-owner' }, payment_intent: 'pi_demo_1'
        });
        mocks.markOrderPaidWithTransition.mockResolvedValue({ transitioned: false, order: { id: 'order-demo-1' } });
        const res = makeResponse();

        await getCheckoutSessionStatus({ body: { sessionId: 'cs_test_demo1234567890' } }, res);

        expect(res.body).toEqual({ checkoutStatus: 'complete', paymentStatus: 'paid' });
        expect(res.body).not.toHaveProperty('orderId');
        expect(res.body).not.toHaveProperty('orderStatus');
    });

    it('rejects malformed session identifiers before calling Stripe', async () => {
        const res = makeResponse();
        await getCheckoutSessionStatus({ body: { sessionId: 'order-demo-1' } }, res);

        expect(res.statusCode).toBe(400);
        expect(mocks.stripeRetrieve).not.toHaveBeenCalled();
    });

    it('fulfills a delayed Checkout payment only after Stripe confirms success', async () => {
        mocks.stripeConstructEvent.mockReturnValue({
            type: 'checkout.session.async_payment_succeeded',
            data: { object: { id: 'cs_test_delayed123456', metadata: { orderId: 'order-demo-1' }, payment_intent: 'pi_delayed_1' } }
        });
        const res = makeResponse();

        await handleStripeWebhook({ headers: { 'stripe-signature': 'sig_demo' }, body: Buffer.from('event') }, res);

        expect(mocks.markOrderPaidWithTransition).toHaveBeenCalledWith('order-demo-1', 'pi_delayed_1');
        expect(res.body).toEqual({ received: true });
    });

    it('releases a delayed Checkout reservation when Stripe reports payment failure', async () => {
        mocks.stripeConstructEvent.mockReturnValue({
            type: 'checkout.session.async_payment_failed',
            data: { object: { id: 'cs_test_delayed123456', metadata: { orderId: 'order-demo-1' } } }
        });
        const res = makeResponse();

        await handleStripeWebhook({ headers: { 'stripe-signature': 'sig_demo' }, body: Buffer.from('event') }, res);

        expect(mocks.releasePendingOrder).toHaveBeenCalledWith('order-demo-1', 'cs_test_delayed123456');
        expect(res.body).toEqual({ received: true });
    });
});
