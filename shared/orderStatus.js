export const ORDER_STATUS = Object.freeze({
    PAYMENT_PENDING: 'payment_pending',
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    PROCESSING: 'processing',
    READY: 'ready',
    SHIPPED: 'shipped',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
});

export const ORDER_STATUS_VALUES = Object.freeze([
    ORDER_STATUS.PAYMENT_PENDING,
    ORDER_STATUS.PENDING,
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.READY,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REFUNDED
]);

export const PROCESSING_ORDER_STATUSES = Object.freeze([
    ORDER_STATUS.PENDING,
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.READY
]);
