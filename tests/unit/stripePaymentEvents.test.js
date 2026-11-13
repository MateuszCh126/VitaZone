import { describe, expect, it } from 'vitest';
import { isSuccessfulStripeCheckoutEvent } from '../../server/services/stripePaymentEvents.js';

describe('isSuccessfulStripeCheckoutEvent', () => {
  it.each([
    ['checkout.session.completed', 'paid', true],
    ['checkout.session.completed', 'unpaid', false],
    ['checkout.session.async_payment_succeeded', 'paid', true],
    ['checkout.session.async_payment_succeeded', 'unpaid', false],
    ['checkout.session.async_payment_failed', 'unpaid', false],
    ['checkout.session.expired', 'unpaid', false]
  ])('classifies %s with payment status %s as %s', (type, paymentStatus, expected) => {
    expect(isSuccessfulStripeCheckoutEvent({
      type,
      data: { object: { payment_status: paymentStatus } }
    })).toBe(expected);
  });

  it('returns false for incomplete webhook payloads', () => {
    expect(isSuccessfulStripeCheckoutEvent(null)).toBe(false);
    expect(isSuccessfulStripeCheckoutEvent({ type: 'checkout.session.completed' })).toBe(false);
  });
});
