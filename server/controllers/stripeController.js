import Stripe from 'stripe';
import env from '../config/env.js';
import logger from '../config/logger.js';
import { CreateCheckoutSessionSchema } from '../../schemas/stripeSchema.js';
import * as orderRepo from '../../repositories/orderRepository.js';
import { ORDER_STATUS } from '../../shared/orderStatus.js';
import { sendOrderPaidEmail } from '../services/emailService.js';

const stripe = env.STRIPE_SECRET_KEY
    ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' })
    : null;

const ensureStripeClientConfigured = () => {
    if (!stripe) {
        const error = new Error('Płatności Stripe nie są skonfigurowane');
        error.code = 'STRIPE_NOT_CONFIGURED';
        throw error;
    }
};

const ensureStripeWebhookConfigured = () => {
    ensureStripeClientConfigured();

    if (!env.STRIPE_WEBHOOK_SECRET) {
        const error = new Error('Webhook Stripe nie jest skonfigurowany');
        error.code = 'STRIPE_WEBHOOK_NOT_CONFIGURED';
        throw error;
    }
};

const normalizeOrigin = (value) => {
    if (!value) return null;

    try {
        return new URL(value).origin;
    } catch {
        return null;
    }
};

const buildAllowedCheckoutOrigins = () => {
    const configuredOrigins = env.CORS_ALLOWED_ORIGINS
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    return new Set([
        normalizeOrigin(env.PUBLIC_APP_URL),
        ...configuredOrigins.map(normalizeOrigin),
        normalizeOrigin(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null),
        normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
    ].filter(Boolean));
};

const allowedCheckoutOrigins = buildAllowedCheckoutOrigins();
const STRIPE_CHECKOUT_SESSION_ID_PATTERN = /^cs(?:_test|_live)?_[A-Za-z0-9]+$/;

const buildAppUrl = (req) => {
    const requestOrigin = normalizeOrigin(req.headers.origin);
    if (requestOrigin && allowedCheckoutOrigins.has(requestOrigin)) {
        return requestOrigin;
    }

    return env.PUBLIC_APP_URL.replace(/\/$/, '');
};

const buildProductsDescription = (items) => {
    const names = items.slice(0, 3).map(item => item.name).filter(Boolean);
    if (items.length === 1) {
        return names[0] || '1 pozycja w koszyku';
    }

    const suffix = items.length > 3 ? ` +${items.length - 3} więcej` : '';
    return `${items.length} pozycje: ${names.join(', ')}${suffix}`;
};

const resolveProductsAmountCents = (order) => {
    const itemsSubtotalCents = (order.items || []).reduce(
        (sum, item) => sum + ((item.price_cents || 0) * item.quantity),
        0
    );

    return Math.max(itemsSubtotalCents - (order.discount_amount_cents || 0), 0);
};

const buildLineItems = (order) => {
    const productsAmountCents = resolveProductsAmountCents(order);
    const lineItems = [];

    if (productsAmountCents > 0) {
        lineItems.push({
            price_data: {
                currency: env.STRIPE_CURRENCY,
                product_data: {
                    name: 'Zakup w VitaZone',
                    description: buildProductsDescription(order.items || [])
                },
                unit_amount: productsAmountCents
            },
            quantity: 1
        });
    }

    if (env.ORDER_SHIPPING_CENTS > 0) {
        lineItems.push({
            price_data: {
                currency: env.STRIPE_CURRENCY,
                product_data: {
                    name: 'Dostawa kurierska'
                },
                unit_amount: env.ORDER_SHIPPING_CENTS
            },
            quantity: 1
        });
    }

    if (lineItems.length === 0) {
        throw new Error('Kwota zamówienia musi być większa niż zero');
    }

    return lineItems;
};

const safelyReleasePendingOrder = async (orderId, paymentId = null) => {
    try {
        await orderRepo.releasePendingOrder(orderId, paymentId);
    } catch (releaseError) {
        logger.error('Failed to release pending order after Stripe error', {
            orderId,
            paymentId,
            errorMessage: releaseError?.message || 'Unknown release error',
            errorName: releaseError?.name || 'Error'
        });
    }
};

const markOrderPaidFromStripe = async (orderId, paymentId) => {
    if (!orderId) return null;
    const result = await orderRepo.markOrderPaidWithTransition(orderId, paymentId);

    if (result?.transitioned && result.order) {
        try {
            await sendOrderPaidEmail(result.order);
        } catch (emailError) {
            logger.error('Failed to send paid order email', {
                orderId,
                paymentId,
                errorMessage: emailError?.message || 'Unknown email error'
            });
        }
    }

    return result?.order || null;
};

export const createCheckoutSession = async (req, res) => {
    let orderId = null;
    let session = null;

    try {
        ensureStripeClientConfigured();

        const validatedData = CreateCheckoutSessionSchema.parse(req.body);
        if (req.user.id !== validatedData.userId) {
            return res.status(403).json({ error: 'Brak dostępu: nie możesz utworzyć checkoutu dla innego użytkownika' });
        }

        const createdOrder = await orderRepo.createOrder({
            userId: validatedData.userId,
            paymentMethod: 'stripe_checkout',
            paymentId: null,
            items: validatedData.items,
            fullName: validatedData.shipping.fullName,
            email: validatedData.shipping.email,
            country: validatedData.shipping.country,
            city: validatedData.shipping.city,
            postalCode: validatedData.shipping.postal_code,
            street: validatedData.shipping.street,
            houseNumber: validatedData.shipping.house_number,
            apartmentNumber: validatedData.shipping.apartment_number || null,
            discountCode: validatedData.discountCode,
            initialStatus: ORDER_STATUS.PAYMENT_PENDING,
            shippingAmountCents: env.ORDER_SHIPPING_CENTS
        });

        orderId = createdOrder.id;
        const hydratedOrder = await orderRepo.findById(orderId);
        if (!hydratedOrder) {
            throw new Error('Zamówienie zostało utworzone, ale nie udało się go odczytać');
        }

        const appUrl = buildAppUrl(req);
        session = await stripe.checkout.sessions.create({
            mode: 'payment',
            locale: 'pl',
            client_reference_id: orderId,
            customer_email: validatedData.shipping.email,
            billing_address_collection: 'auto',
            phone_number_collection: { enabled: true },
            success_url: `${appUrl}/checkout?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/checkout?checkout=cancelled`,
            expires_at: Math.floor(Date.now() / 1000) + (env.STRIPE_CHECKOUT_EXPIRES_MINUTES * 60),
            line_items: buildLineItems(hydratedOrder),
            metadata: {
                orderId,
                userId: req.user.id
            },
            payment_intent_data: {
                metadata: {
                    orderId,
                    userId: req.user.id
                }
            }
        });

        try {
            await orderRepo.attachPaymentReference(orderId, session.id);
        } catch (attachError) {
            logger.error('Failed to persist Stripe session reference on order', attachError);
        }

        res.status(201).json({
            sessionId: session.id,
            url: session.url
        });
    } catch (error) {
        if (orderId && !session) {
            await safelyReleasePendingOrder(orderId);
        }

        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Dane formularza są nieprawidłowe', details: error.errors });
        }

        if (error.code === 'STRIPE_NOT_CONFIGURED') {
            return res.status(503).json({ error: 'Płatności Stripe Checkout nie są skonfigurowane' });
        }

        const badRequestPatterns = [
            'Nie znaleziono',
            'niedostępny',
            'Brak wystarczającej ilości',
            'Invalid or inactive discount code',
            'Discount code not yet active',
            'Discount code expired',
            'Discount usage limit reached',
            'Kwota zamówienia musi być większa niż zero',
            'Zamówienie zostało utworzone, ale nie udało się go odczytać'
        ];
        if (badRequestPatterns.some(pattern => error.message.includes(pattern))) {
            return res.status(400).json({ error: error.message });
        }

        logger.error('Stripe checkout creation error', {
            orderId,
            errorMessage: error?.message || 'Unknown Stripe error',
            errorName: error?.name || 'Error',
            errorCode: error?.code || null,
            errorType: error?.type || null
        });
        res.status(500).json({ error: 'Nie udało się uruchomić płatności Stripe Checkout' });
    }
};

export const getCheckoutSessionStatus = async (req, res) => {
    try {
        ensureStripeClientConfigured();
        const sessionId = req.params.sessionId;

        if (!sessionId || typeof sessionId !== 'string') {
            return res.status(400).json({ error: 'Brak identyfikatora sesji checkout' });
        }

        if (!STRIPE_CHECKOUT_SESSION_ID_PATTERN.test(sessionId)) {
            return res.status(400).json({ error: 'Nieprawidłowy identyfikator sesji checkout' });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const orderId = session.metadata?.orderId || session.client_reference_id;
        const sessionUserId = session.metadata?.userId;

        if (sessionUserId && sessionUserId !== req.user.id) {
            return res.status(403).json({ error: 'Brak dostępu' });
        }

        if (session.status === 'expired' && orderId) {
            await orderRepo.releasePendingOrder(orderId, session.id);
        }

        if (session.payment_status === 'paid' && orderId) {
            await markOrderPaidFromStripe(orderId, typeof session.payment_intent === 'string' ? session.payment_intent : session.id);
        }

        const order = orderId ? await orderRepo.findById(orderId) : null;

        res.json({
            sessionId: session.id,
            checkoutStatus: session.status,
            paymentStatus: session.payment_status,
            orderId,
            orderStatus: order?.status || null
        });
    } catch (error) {
        if (error.code === 'STRIPE_NOT_CONFIGURED') {
            return res.status(503).json({ error: 'Płatności Stripe Checkout nie są skonfigurowane' });
        }

        logger.error('Stripe checkout status error', {
            sessionId: req.params.sessionId,
            errorMessage: error?.message || 'Unknown Stripe status error',
            errorName: error?.name || 'Error',
            errorCode: error?.code || null
        });
        res.status(500).json({ error: 'Nie udało się zweryfikować statusu płatności' });
    }
};

export const handleStripeWebhook = async (req, res) => {
    try {
        ensureStripeWebhookConfigured();
        const signature = req.headers['stripe-signature'];

        if (!signature) {
            return res.status(400).send('Brak sygnatury Stripe');
        }

        const event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const orderId = session.metadata?.orderId || session.client_reference_id;
                if (session.payment_status === 'paid' && orderId) {
                    await markOrderPaidFromStripe(orderId, typeof session.payment_intent === 'string' ? session.payment_intent : session.id);
                }
                break;
            }

            case 'checkout.session.expired': {
                const session = event.data.object;
                const orderId = session.metadata?.orderId || session.client_reference_id;
                if (orderId) {
                    await orderRepo.releasePendingOrder(orderId, session.id);
                }
                break;
            }

            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                const orderId = paymentIntent.metadata?.orderId;
                if (orderId) {
                    await markOrderPaidFromStripe(orderId, paymentIntent.id);
                }
                break;
            }

            case 'payment_intent.payment_failed':
            case 'payment_intent.canceled': {
                const paymentIntent = event.data.object;
                const orderId = paymentIntent.metadata?.orderId;
                if (orderId) {
                    await orderRepo.releasePendingOrder(orderId, paymentIntent.id);
                }
                break;
            }

            case 'charge.refunded': {
                const charge = event.data.object;
                if (typeof charge.payment_intent === 'string') {
                    await orderRepo.markOrderRefundedByPaymentId(charge.payment_intent);
                }
                break;
            }

            default:
                break;
        }

        res.json({ received: true });
    } catch (error) {
        if (error.code === 'STRIPE_NOT_CONFIGURED' || error.code === 'STRIPE_WEBHOOK_NOT_CONFIGURED') {
            return res.status(503).send('Webhook Stripe nie jest skonfigurowany');
        }

        logger.error('Stripe webhook error', {
            eventType: error?.raw?.type || null,
            errorMessage: error?.message || 'Unknown Stripe webhook error',
            errorName: error?.name || 'Error',
            errorCode: error?.code || null
        });
        res.status(400).send(`Błąd webhooka: ${error.message}`);
    }
};
