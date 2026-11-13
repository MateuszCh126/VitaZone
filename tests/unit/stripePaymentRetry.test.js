import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Buffer } from 'node:buffer';

const mocks = vi.hoisted(() => ({
    constructEvent: vi.fn(),
    releasePendingOrder: vi.fn(),
    markOrderPaidWithTransition: vi.fn(),
    loggerError: vi.fn()
}));

vi.mock('stripe', () => ({
    default: class StripeMock {
        checkout = { sessions: { create: vi.fn(), retrieve: vi.fn() } };
        webhooks = { constructEvent: mocks.constructEvent };
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
    createOrder: vi.fn(),
    findById: vi.fn(),
    attachPaymentReference: vi.fn(),
    releasePendingOrder: mocks.releasePendingOrder,
    markOrderPaidWithTransition: mocks.markOrderPaidWithTransition,
    markOrderRefundedByPaymentId: vi.fn()
}));
vi.mock('../../server/services/emailService.js', () => ({ sendOrderPaidEmail: vi.fn() }));

const { handleStripeWebhook } = await import('../../server/controllers/stripeController.js');

const makeResponse = () => ({
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    send(body) { this.body = body; return this; }
});

describe('Stripe payment retry webhook handling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('keeps the order reservation after a failed payment attempt while Checkout can be retried', async () => {
        mocks.constructEvent.mockReturnValue({
            type: 'payment_intent.payment_failed',
            data: { object: { id: 'pi_demo_retry', metadata: { orderId: 'order-demo-1' } } }
        });
        const res = makeResponse();

        await handleStripeWebhook({
            headers: { 'stripe-signature': 'sig_demo' },
            body: Buffer.from('event')
        }, res);

        expect(mocks.releasePendingOrder).not.toHaveBeenCalled();
        expect(res.body).toEqual({ received: true });
    });

    it('releases the reservation after Stripe confirms that the Checkout Session expired', async () => {
        mocks.constructEvent.mockReturnValue({
            type: 'checkout.session.expired',
            data: { object: { id: 'cs_test_expired123456', metadata: { orderId: 'order-demo-1' } } }
        });
        const res = makeResponse();

        await handleStripeWebhook({
            headers: { 'stripe-signature': 'sig_demo' },
            body: Buffer.from('event')
        }, res);

        expect(mocks.releasePendingOrder).toHaveBeenCalledWith('order-demo-1', 'cs_test_expired123456');
        expect(res.body).toEqual({ received: true });
    });
});
