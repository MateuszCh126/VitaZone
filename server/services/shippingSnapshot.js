export const buildDeliverySnapshot = ({ method, amountCents, provider, serviceId }) => ({
    method,
    amount_cents: amountCents,
    provider,
    service_id: serviceId
});
