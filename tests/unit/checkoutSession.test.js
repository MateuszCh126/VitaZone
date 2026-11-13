import { describe, expect, it } from 'vitest';
import { readCheckoutReturn } from '../../src/utils/checkoutSession.js';

describe('checkout return parameters', () => {
  it('recognizes a terrarium Stripe return without treating it like a cart checkout', () => {
    expect(readCheckoutReturn(new URLSearchParams('terrarium_session_id=cs_test_123'))).toEqual({
      sessionId: 'cs_test_123',
      isTerrarium: true,
      wasCancelled: false
    });
  });

  it('keeps the existing cart checkout return behavior', () => {
    expect(readCheckoutReturn(new URLSearchParams('session_id=cs_test_456'))).toEqual({
      sessionId: 'cs_test_456',
      isTerrarium: false,
      wasCancelled: false
    });
  });

  it('identifies a cancelled ordinary cart checkout', () => {
    expect(readCheckoutReturn(new URLSearchParams('checkout=cancelled'))).toEqual({
      sessionId: null,
      isTerrarium: false,
      wasCancelled: true
    });
  });
});
