const PAID_CHECKOUT_EVENT_TYPES = new Set([
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded'
]);

export const isSuccessfulStripeCheckoutEvent = (event) => (
    PAID_CHECKOUT_EVENT_TYPES.has(event?.type)
    && event?.data?.object?.payment_status === 'paid'
);
