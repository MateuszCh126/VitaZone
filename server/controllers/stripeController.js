import Stripe from 'stripe';
import env from '../config/env.js';
import logger from '../config/logger.js';
import { CheckoutSessionStatusSchema, CreateCheckoutSessionSchema } from '../../schemas/stripeSchema.js';
import * as orderRepo from '../../repositories/orderRepository.js';
import { ORDER_STATUS } from '../../shared/orderStatus.js';
import { sendOrderPaidEmail } from '../services/emailService.js';
import * as productRepo from '../../repositories/productRepository.js';
import { createFurgonetkaGateway, getShippingQuotes, resolveReviewedShippingQuote } from '../services/shippingService.js';
import * as terrariumRepo from '../../repositories/terrariumRepository.js';
import { TerrariumCheckoutSchema } from '../../schemas/terrariumSchema.js';
import { z } from 'zod';
import { isSuccessfulStripeCheckoutEvent } from '../services/stripePaymentEvents.js';

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

    const shippingAmountCents = order.shipping_address_json?.delivery?.amount_cents;
    if (Number.isSafeInteger(shippingAmountCents) && shippingAmountCents > 0) {
        lineItems.push({
            price_data: {
                currency: env.STRIPE_CURRENCY,
                product_data: {
                    name: order.shipping_address_json.delivery.method === 'inpost' ? 'Dostawa InPost' : 'Dostawa DPD'
                },
                unit_amount: shippingAmountCents
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
        await terrariumRepo.resetProjectCheckoutByOrder(orderId);
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
            await terrariumRepo.markProjectPaidByOrder(orderId);
        } catch (error) {
            logger.error('Failed to mark terrarium project paid', {
                orderId,
                errorMessage: error?.message || 'Unknown database error'
            });
        }
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

export const createTerrariumCheckoutSession = async (req, res) => {
    let project = null;
    let orderId = null;
    let session = null;
    let checkoutPersisted = false;

    try {
        ensureStripeClientConfigured();
        if (!z.uuid().safeParse(req.params.projectId).success) {
            return res.status(400).json({ error: 'Id projektu jest nieprawidłowe' });
        }
        const shipping = TerrariumCheckoutSchema.parse(req.body);
        const existing = await terrariumRepo.findProjectByUser(req.params.projectId, req.user.id);
        if (!existing) return res.status(404).json({ error: 'Nie znaleziono projektu terrarium' });

        if (existing.status === 'payment_pending' && existing.stripe_session_id) {
            const existingSession = await stripe.checkout.sessions.retrieve(existing.stripe_session_id);
            if (existingSession.status === 'open' && existingSession.url) {
                return res.json({ sessionId: existingSession.id, url: existingSession.url });
            }
            if (existingSession.payment_status === 'paid') {
                return res.status(409).json({ error: 'Ta konfiguracja została już opłacona' });
            }
            if (existingSession.status === 'expired') {
                await safelyReleasePendingOrder(existing.order_id, existingSession.id);
                await terrariumRepo.resetProjectCheckout(existing.id);
            } else {
                return res.status(409).json({ error: 'Sesja płatności jest już przetwarzana' });
            }
        }

        project = await terrariumRepo.claimProjectCheckout(req.params.projectId, req.user.id);
        if (!project) {
            return res.status(409).json({ error: 'Najpierw zaakceptuj ważną ofertę w panelu klienta' });
        }

        const quote = project.quote_json;
        if (!quote?.items?.length || !Number.isSafeInteger(quote.totalCents)) {
            await terrariumRepo.resetProjectCheckout(project.id);
            return res.status(409).json({ error: 'Oferta nie zawiera prawidłowego snapshotu cen' });
        }

        const checkoutIdempotencyKey = `terrarium:${project.id}:q${project.quote_version}:a${project.checkout_attempt}`;
        const createdOrder = await orderRepo.createOrder({
            userId: req.user.id,
            paymentMethod: 'stripe_checkout',
            paymentId: null,
            items: quote.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
            priceSnapshot: quote.items,
            fullName: shipping.fullName,
            email: shipping.email,
            country: shipping.country,
            city: shipping.city,
            postalCode: shipping.postal_code,
            street: shipping.street,
            houseNumber: shipping.house_number,
            apartmentNumber: shipping.apartment_number || null,
            idempotencyKey: checkoutIdempotencyKey,
            initialStatus: ORDER_STATUS.PAYMENT_PENDING,
            shippingAmountCents: env.ORDER_SHIPPING_CENTS
        });

        orderId = createdOrder.id;
        const hydratedOrder = await orderRepo.findById(orderId);
        if (!hydratedOrder) throw new Error('Nie udało się odczytać utworzonego zamówienia');

        if (hydratedOrder.status !== ORDER_STATUS.PAYMENT_PENDING) {
            if (hydratedOrder.status === ORDER_STATUS.PENDING) {
                await terrariumRepo.attachProjectCheckout({
                    projectId: project.id,
                    userId: req.user.id,
                    orderId,
                    sessionId: null
                });
                await terrariumRepo.markProjectPaidByOrder(orderId);
                return res.status(409).json({ error: 'Ta konfiguracja została już opłacona' });
            }
            return res.status(409).json({ error: 'To zamówienie nie oczekuje już na płatność' });
        }

        const orderCreatedAt = Date.parse(hydratedOrder.created_at);
        if (!Number.isFinite(orderCreatedAt)) throw new Error('Zamówienie nie ma prawidłowego czasu utworzenia');
        const sessionExpiresAt = Math.floor(orderCreatedAt / 1000)
            + (env.STRIPE_CHECKOUT_EXPIRES_MINUTES * 60);
        if (sessionExpiresAt <= Math.floor(Date.now() / 1000)) {
            return res.status(409).json({
                error: 'Nie można bezpiecznie wznowić wygasłej próby płatności. Skontaktuj się ze sklepem przed ponowieniem.'
            });
        }

        const appUrl = buildAppUrl(req);
        session = await stripe.checkout.sessions.create({
            mode: 'payment',
            locale: 'pl',
            client_reference_id: orderId,
            customer_email: hydratedOrder.shipping_address_json?.email || shipping.email,
            billing_address_collection: 'auto',
            phone_number_collection: { enabled: true },
            success_url: `${appUrl}/checkout?terrarium_session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/terrarium/checkout/${project.id}?checkout=cancelled`,
            expires_at: sessionExpiresAt,
            line_items: buildLineItems(hydratedOrder),
            metadata: {
                orderId,
                userId: req.user.id,
                terrariumProjectId: project.id
            },
            payment_intent_data: {
                metadata: {
                    orderId,
                    userId: req.user.id,
                    terrariumProjectId: project.id
                }
            }
        }, { idempotencyKey: checkoutIdempotencyKey });

        const attachedProject = await terrariumRepo.attachProjectCheckout({
            projectId: project.id,
            userId: req.user.id,
            orderId,
            sessionId: session.id
        });
        if (!attachedProject) throw new Error('Nie udało się powiązać płatności z projektem');
        checkoutPersisted = true;

        // Stripe may deliver a paid webhook after session creation but before the
        // project has an order_id. Reconcile after attaching to close that race.
        const currentOrder = await orderRepo.findById(orderId);
        if (currentOrder && currentOrder.status !== ORDER_STATUS.PAYMENT_PENDING) {
            await terrariumRepo.markProjectPaidByOrder(orderId);
        }

        try {
            await orderRepo.attachPaymentReference(orderId, session.id);
        } catch (attachError) {
            logger.error('Failed to persist terrarium Stripe session reference', {
                orderId,
                errorMessage: attachError?.message || 'Unknown database error'
            });
        }

        return res.status(201).json({ sessionId: session.id, url: session.url });
    } catch (error) {
        if (orderId && !checkoutPersisted) {
            if (session?.id) {
                try {
                    await stripe.checkout.sessions.expire(session.id);
                } catch (expireError) {
                    logger.warn('Could not expire an unattached terrarium checkout session', {
                        projectId: project?.id,
                        errorMessage: expireError?.message || 'Unknown Stripe error'
                    });
                }
            }
            await safelyReleasePendingOrder(orderId, session?.id || null);
        }
        if (project && !checkoutPersisted) await terrariumRepo.resetProjectCheckout(project.id);
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Adres dostawy jest nieprawidłowy', details: error.issues });
        }
        if (error.code === 'STRIPE_NOT_CONFIGURED') {
            return res.status(503).json({ error: 'Płatności Stripe Checkout nie są skonfigurowane' });
        }
        logger.error('Terrarium checkout session creation failed', {
            projectId: req.params.projectId,
            errorMessage: error?.message || 'Unknown error'
        });
        return res.status(400).json({ error: error.message || 'Nie udało się utworzyć płatności' });
    }
};

export const createCheckoutSession = async (req, res) => {
    let orderId = null;
    let session = null;

    try {
        ensureStripeClientConfigured();

        const validatedData = CreateCheckoutSessionSchema.parse(req.body);
        const userId = req.user?.id || null;
        const productIds = [...new Set(validatedData.items.map((item) => item.productId))];
        const shippingProducts = await productRepo.getShippingProductsByIds(productIds);
        const deliveryQuotes = await getShippingQuotes({
            items: validatedData.items,
            shipping: validatedData.shipping,
            products: shippingProducts,
            gateway: createFurgonetkaGateway({ env })
        });
        const deliveryReview = resolveReviewedShippingQuote({
            quotes: deliveryQuotes,
            method: validatedData.deliveryMethod,
            expectedAmountCents: validatedData.expectedShippingAmountCents
        });
        if (deliveryReview.changed) {
            res.set('Cache-Control', 'no-store');
            return res.status(409).json({
                error: 'Koszt dostawy się zmienił. Sprawdź aktualną cenę i ponownie ją zatwierdź.',
                code: 'SHIPPING_QUOTE_CHANGED',
                quotes: deliveryQuotes.map(({ method, label, amountCents, currency }) => ({ method, label, amountCents, currency }))
            });
        }
        const selectedDelivery = deliveryReview.quote;

        const createdOrder = await orderRepo.createOrder({
            userId,
            paymentMethod: 'stripe_checkout',
            paymentId: null,
            items: validatedData.items,
            fullName: validatedData.shipping.fullName,
            email: validatedData.shipping.email,
            phone: validatedData.shipping.phone,
            country: validatedData.shipping.country,
            city: validatedData.shipping.city,
            postalCode: validatedData.shipping.postal_code,
            street: validatedData.shipping.street,
            houseNumber: validatedData.shipping.house_number,
            apartmentNumber: validatedData.shipping.apartment_number || null,
            deliveryMethod: selectedDelivery.method,
            deliveryProvider: selectedDelivery.provider,
            deliveryServiceId: selectedDelivery.providerServiceId,
            discountCode: validatedData.discountCode,
            initialStatus: ORDER_STATUS.PAYMENT_PENDING,
            shippingAmountCents: selectedDelivery.amountCents
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
                ...(userId ? { userId } : {})
            },
            payment_intent_data: {
                metadata: {
                    orderId,
                    ...(userId ? { userId } : {})
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
        if (error.statusCode && String(error.code || '').startsWith('SHIPPING_')) {
            return res.status(error.statusCode).json({ error: error.message, code: error.code });
        }

        const badRequestPatterns = [
            'Nie znaleziono',
            'niedostępny',
            'Brak wystarczającej ilości',
            'Invalid or inactive discount code',
            'Discount code not yet active',
            'Discount code expired',
            'Discount usage limit reached',
            'Żywe zwierzęta nie są obsługiwane',
            'Ta kategoria nie jest obsługiwana przez standardową wysyłkę InPost/DPD.',
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
        const parsed = CheckoutSessionStatusSchema.safeParse(req.body || {});
        if (!parsed.success) {
            return res.status(400).json({ error: 'Nieprawidłowy identyfikator sesji checkout' });
        }

        const { sessionId } = parsed.data;
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const orderId = session.metadata?.orderId || session.client_reference_id;
        const sessionUserId = session.metadata?.userId;

        // The checkout-session ID is the bearer proof for guest polling. Keep
        // signed-out sessions usable, but reject an authenticated different owner.
        if (sessionUserId && req.user?.id && sessionUserId !== req.user.id) {
            return res.status(403).json({ error: 'Brak dostępu' });
        }

        if (session.status === 'expired' && orderId) {
            await safelyReleasePendingOrder(orderId, session.id);
        }

        if (session.payment_status === 'paid' && orderId) {
            await markOrderPaidFromStripe(orderId, typeof session.payment_intent === 'string' ? session.payment_intent : session.id);
        }

        const order = orderId ? await orderRepo.findById(orderId) : null;
        const response = {
            checkoutStatus: session.status,
            paymentStatus: session.payment_status
        };

        if (Number.isInteger(session.amount_total) && typeof session.currency === 'string') {
            response.amountTotalCents = session.amount_total;
            response.currency = session.currency.toUpperCase();
        }

        if (sessionUserId && req.user?.id === sessionUserId) {
            response.orderId = orderId || null;
            response.orderStatus = order?.status || null;
        }

        res.set('Cache-Control', 'no-store');
        res.json(response);
    } catch (error) {
        if (error.code === 'STRIPE_NOT_CONFIGURED') {
            return res.status(503).json({ error: 'Płatności Stripe nie są skonfigurowane' });
        }

        logger.error('Stripe checkout status error', {
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
            case 'checkout.session.completed':
            case 'checkout.session.async_payment_succeeded': {
                const session = event.data.object;
                const orderId = session.metadata?.orderId || session.client_reference_id;
                if (isSuccessfulStripeCheckoutEvent(event) && orderId) {
                    await markOrderPaidFromStripe(orderId, typeof session.payment_intent === 'string' ? session.payment_intent : session.id);
                }
                break;
            }

            case 'checkout.session.expired': {
                const session = event.data.object;
                const orderId = session.metadata?.orderId || session.client_reference_id;
                if (orderId) {
                    await safelyReleasePendingOrder(orderId, session.id);
                }
                break;
            }

            case 'checkout.session.async_payment_failed': {
                const session = event.data.object;
                const orderId = session.metadata?.orderId || session.client_reference_id;
                if (orderId) {
                    await safelyReleasePendingOrder(orderId, session.id);
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
                // Checkout can keep the session open for another payment attempt.
                // Keep the reservation; release it on terminal cancellation or expiry.
                break;

            case 'payment_intent.canceled': {
                const paymentIntent = event.data.object;
                const orderId = paymentIntent.metadata?.orderId;
                if (orderId) {
                    await safelyReleasePendingOrder(orderId, paymentIntent.id);
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
