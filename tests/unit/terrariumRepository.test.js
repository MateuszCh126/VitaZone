import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('../../server/scripts/db.js', () => ({ query: mocks.query }));

import { claimProjectCheckout } from '../../repositories/terrariumRepository.js';

describe('terrarium checkout claim recovery', () => {
  it('reclaims only stale pending projects without a Stripe session and keeps the attempt key stable', async () => {
    const project = {
      id: '00000000-0000-4000-8000-000000000003',
      status: 'payment_pending',
      checkout_attempt: 7,
      stripe_session_id: null,
      configuration_json: {},
      estimate_json: {},
      quote_json: { items: [], totalCents: 0 }
    };
    mocks.query.mockResolvedValue({ rows: [project] });

    const result = await claimProjectCheckout(project.id, 'customer-user-id');

    expect(result.checkout_attempt).toBe(7);
    const [sql, params] = mocks.query.mock.calls[0];
    expect(params).toEqual([project.id, 'customer-user-id']);
    expect(sql).toMatch(/status\s*=\s*'accepted'[\s\S]*?OR[\s\S]*?status\s*=\s*'payment_pending'/i);
    expect(sql).toMatch(/stripe_session_id\s+IS\s+NULL/i);
    expect(sql).toMatch(/updated_at\s*<\s*NOW\(\)\s*-\s*INTERVAL\s+'5 minutes'/i);
    expect(sql).toMatch(/CASE\s+WHEN\s+status\s*=\s*'accepted'\s+THEN\s+checkout_attempt\s*\+\s*1\s+ELSE\s+checkout_attempt\s+END/i);
  });
});
