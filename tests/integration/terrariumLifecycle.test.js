/* global process, Buffer */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = `${'postgres://'}localhost/terrarium_test`;
  process.env.JWT_SECRET = ['terrarium', 'integration', 'test', 'secret'].join('-');
  process.env.STRIPE_SECRET_KEY = 'sk_test_configurator_only';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_configurator_only';
  process.env.PUBLIC_APP_URL = 'http://localhost:5173';
  process.env.RESEND_API_KEY = '';
  process.env.RESEND_FROM_EMAIL = '';

  return {
    terrariumRepo: {
      getProductsByIds: vi.fn(),
      createProject: vi.fn(),
      findProjectByUser: vi.fn(),
      acceptProjectQuote: vi.fn(),
      findProjectDetailByUser: vi.fn(),
      findAdminProject: vi.fn(),
      updateAdminQuote: vi.fn(),
      claimProjectCheckout: vi.fn(),
      attachProjectCheckout: vi.fn(),
      resetProjectCheckout: vi.fn(),
      markProjectPaidByOrder: vi.fn()
    },
    orderRepo: {
      createOrder: vi.fn(),
      findById: vi.fn(),
      attachPaymentReference: vi.fn(),
      markOrderPaidWithTransition: vi.fn(),
      releasePendingOrder: vi.fn()
    },
    emailService: {
      sendTerrariumProjectSubmittedEmail: vi.fn(),
      sendTerrariumQuoteAvailableEmail: vi.fn(),
      sendOrderPaidEmail: vi.fn()
    },
    userRepo: {
      findById: vi.fn(),
      updateLastActive: vi.fn()
    },
    stripe: {
      checkout: {
        sessions: {
          create: vi.fn(),
          retrieve: vi.fn(),
          expire: vi.fn()
        }
      },
      webhooks: { constructEvent: vi.fn() }
    }
  };
});

vi.mock('../../repositories/terrariumRepository.js', () => mocks.terrariumRepo);
vi.mock('../../repositories/orderRepository.js', () => mocks.orderRepo);
vi.mock('../../server/services/emailService.js', () => mocks.emailService);
vi.mock('../../repositories/userRepository.js', () => mocks.userRepo);
vi.mock('stripe', () => ({ default: class StripeMock { constructor() { return mocks.stripe; } } }));

import jwt from 'jsonwebtoken';
import env from '../../server/config/env.js';
import { verifyAdmin, verifyToken } from '../../server/middleware/authMiddleware.js';
import {
  acceptMyProjectQuote,
  createAdminQuote,
  createProject,
  getMyProject
} from '../../server/controllers/terrariumController.js';
import {
  createTerrariumCheckoutSession,
  handleStripeWebhook
} from '../../server/controllers/stripeController.js';

const enclosureId = '00000000-0000-4000-8000-000000000001';
const fernId = '00000000-0000-4000-8000-000000000002';
const projectId = '00000000-0000-4000-8000-000000000003';
const orderId = '00000000-0000-4000-8000-000000000004';

const products = [
  {
    id: enclosureId,
    name: 'Terrarium testowe',
    price_cents: 12000,
    stock: 4,
    is_active: true,
    specs: { terrariumDesigner: {
      role: 'enclosure', shape: 'cube',
      dimensionsMm: { width: 400, height: 400, depth: 400 },
      innerDimensionsMm: { width: 380, height: 380, depth: 380 },
      allowedMountSurfaces: [], model: { url: '/models/terrarium/test.glb', version: '1' }
    } }
  },
  {
    id: fernId,
    name: 'Paproć testowa',
    price_cents: 1500,
    stock: 10,
    is_active: true,
    specs: { terrariumDesigner: {
      role: 'element', dimensionsMm: { width: 100, height: 120, depth: 100 },
      allowedMountSurfaces: ['floor'], model: { url: '/models/terrarium/fern.glb', version: '3' }
    } }
  }
];

const config = {
  version: 1,
  enclosureProductId: enclosureId,
  objects: [{
    instanceId: '00000000-0000-4000-8000-000000000005',
    productId: fernId,
    quantity: 2,
    positionMm: { x: 0, y: -130, z: 0 },
    rotationDeg: { x: 0, y: 0, z: 0 },
    surface: 'floor'
  }]
};

const projectRecord = {
  id: projectId,
  configuration: config,
  estimate: {
    currency: 'pln',
    items: [
      { productId: enclosureId, name: 'Terrarium testowe', quantity: 1, unitPriceCents: 12000, lineTotalCents: 12000 },
      { productId: fernId, name: 'Paproć testowa', quantity: 2, unitPriceCents: 1500, lineTotalCents: 3000 }
    ],
    totalCents: 15000
  },
  products,
  status: 'submitted',
  customer_email: 'klient@example.test'
};

const response = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
  send(body) { this.body = body; return this; }
});

const runMiddleware = (middleware, req, res, next) => new Promise((resolve) => {
  const originalStatus = res.status.bind(res);
  res.status = (code) => { originalStatus(code); resolve(); return res; };
  const trackedNext = (...args) => { next(...args); resolve(); };
  const result = middleware(req, res, trackedNext);
  if (result?.then) result.then(resolve);
});

describe('terrarium customer/admin/payment lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a customer project and returns only a server-calculated catalog estimate', async () => {
    mocks.terrariumRepo.getProductsByIds.mockResolvedValue(products);
    mocks.terrariumRepo.createProject.mockImplementation(async ({ userId, configuration, estimate }) => ({
      ...projectRecord, user_id: userId, configuration, estimate
    }));
    const res = response();

    await createProject({ user: { id: 'customer-user-id' }, body: config }, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.estimate.totalCents).toBe(15000);
    expect(mocks.terrariumRepo.createProject).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'customer-user-id', estimate: expect.objectContaining({ totalCents: 15000 })
    }));
  });

  it('enforces customer authentication and administrator role checks', async () => {
    const missingTokenRes = response();
    const missingTokenNext = vi.fn();
    await runMiddleware(verifyToken, { cookies: {}, headers: {} }, missingTokenRes, missingTokenNext);
    expect(missingTokenRes.statusCode).toBe(401);
    expect(missingTokenNext).not.toHaveBeenCalled();

    mocks.userRepo.findById.mockResolvedValue({ id: 'customer-user-id', role: 'customer' });
    mocks.userRepo.updateLastActive.mockResolvedValue(undefined);
    const customerRes = response();
    const customerNext = vi.fn();
    await runMiddleware(verifyAdmin, {
      cookies: { token: jwt.sign({ id: 'customer-user-id' }, env.JWT_SECRET) },
      headers: {}
    }, customerRes, customerNext);
    expect(mocks.userRepo.findById).toHaveBeenCalled();
    expect(mocks.userRepo.findById).toHaveBeenCalledWith('customer-user-id');
    expect(await mocks.userRepo.findById.mock.results.at(-1).value).toMatchObject({ role: 'customer' });
    expect(customerRes.statusCode).toBe(403);
    expect(customerNext).not.toHaveBeenCalled();

    mocks.userRepo.findById.mockResolvedValue({ id: 'admin-user-id', role: 'admin' });
    const adminRes = response();
    const adminNext = vi.fn();
    await runMiddleware(verifyAdmin, {
      cookies: { token: jwt.sign({ id: 'admin-user-id' }, env.JWT_SECRET) },
      headers: {}
    }, adminRes, adminNext);
    expect(adminRes.statusCode).toBe(200);
    expect(adminNext).toHaveBeenCalledOnce();
  });

  it('lets the admin set per-SKU final prices and snapshots the computed total', async () => {
    mocks.terrariumRepo.findAdminProject.mockResolvedValue(projectRecord);
    mocks.terrariumRepo.updateAdminQuote.mockImplementation(async ({ quote }) => ({
      ...projectRecord, status: 'quoted', quote_json: quote, quote_total_cents: quote.totalCents
    }));
    const res = response();

    await createAdminQuote({
      user: { id: 'admin-user-id' },
      params: { projectId },
      body: { items: [
        { productId: enclosureId, unitPriceCents: 12500 },
        { productId: fernId, unitPriceCents: 1800 }
      ], validForDays: 7, message: 'Gotowe do odbioru.' }
    }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.quote_json.totalCents).toBe(16100);
    expect(mocks.terrariumRepo.updateAdminQuote).toHaveBeenCalledWith(expect.objectContaining({
      adminUserId: 'admin-user-id', quote: expect.objectContaining({ totalCents: 16100 })
    }));
  });

  it('does not expose a project when the authenticated customer is not its owner', async () => {
    mocks.terrariumRepo.findProjectDetailByUser.mockResolvedValue(null);
    const res = response();

    await getMyProject({ user: { id: 'different-customer-id' }, params: { projectId } }, res);

    expect(res.statusCode).toBe(404);
    expect(mocks.terrariumRepo.findProjectDetailByUser).toHaveBeenCalledWith(projectId, 'different-customer-id');
  });

  it('accepts only an active customer quote through the owner-scoped repository operation', async () => {
    mocks.terrariumRepo.findProjectByUser.mockResolvedValue({
      ...projectRecord, status: 'quoted', quote_expires_at: new Date(Date.now() + 86400000)
    });
    mocks.terrariumRepo.acceptProjectQuote.mockResolvedValue({ ...projectRecord, status: 'accepted' });
    const res = response();

    await acceptMyProjectQuote({ user: { id: 'customer-user-id' }, params: { projectId } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('accepted');
    expect(mocks.terrariumRepo.acceptProjectQuote).toHaveBeenCalledWith(projectId, 'customer-user-id');
  });

  it('uses the saved quote prices in Stripe and reconciles a webhook that raced project attachment', async () => {
    const quoteSnapshot = [
      { productId: enclosureId, name: 'Terrarium testowe', quantity: 1, unitPriceCents: 12500, lineTotalCents: 12500 },
      { productId: fernId, name: 'Paproć testowa', quantity: 2, unitPriceCents: 1800, lineTotalCents: 3600 }
    ];
    mocks.terrariumRepo.findProjectByUser.mockResolvedValue({
      ...projectRecord, status: 'accepted', quote_version: 2, quote_json: { items: quoteSnapshot, totalCents: 16100 }
    });
    mocks.terrariumRepo.claimProjectCheckout.mockResolvedValue({
      ...projectRecord, status: 'payment_pending', checkout_attempt: 1,
      quote_version: 2, quote_json: { items: quoteSnapshot, totalCents: 16100 }
    });
    mocks.orderRepo.createOrder.mockResolvedValue({ id: orderId });
    mocks.orderRepo.findById
      .mockResolvedValueOnce({
        id: orderId, status: 'payment_pending', discount_amount_cents: 0,
        created_at: '2026-11-14T12:00:00.000Z',
        items: quoteSnapshot.map((item) => ({ ...item, price_cents: item.unitPriceCents }))
      })
      .mockResolvedValueOnce({ id: orderId, status: 'pending' });
    mocks.stripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_test_terrarium', url: 'https://checkout.stripe.test/session' });
    mocks.terrariumRepo.attachProjectCheckout.mockResolvedValue({ id: projectId });
    const res = response();

    await createTerrariumCheckoutSession({
      user: { id: 'customer-user-id' }, params: { projectId },
      body: {
        fullName: 'Jan Kowalski', email: 'jan@example.test', country: 'Polska',
        city: 'Jelenia Góra', postal_code: '58-500', street: 'Kolejowa', house_number: '12'
      }, headers: { origin: 'http://localhost:5173' }
    }, res);

    expect(res.statusCode).toBe(201);
    expect(mocks.orderRepo.createOrder).toHaveBeenCalledWith(expect.objectContaining({
      priceSnapshot: quoteSnapshot,
      items: quoteSnapshot.map(({ productId, quantity }) => ({ productId, quantity }))
    }));
    expect(mocks.stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      expires_at: Math.floor(Date.parse('2026-11-14T12:00:00.000Z') / 1000) + 30 * 60,
      line_items: expect.arrayContaining([expect.objectContaining({
        price_data: expect.objectContaining({ unit_amount: 16100 })
      })])
    }), { idempotencyKey: `terrarium:${projectId}:q2:a1` });
    expect(mocks.terrariumRepo.markProjectPaidByOrder).toHaveBeenCalledWith(orderId);
  });

  it('recovers a stale pending project without creating a second order or Stripe session', async () => {
    const quoteSnapshot = [
      { productId: enclosureId, name: 'Terrarium testowe', quantity: 1, unitPriceCents: 12500, lineTotalCents: 12500 }
    ];
    mocks.terrariumRepo.findProjectByUser.mockResolvedValue({
      ...projectRecord,
      status: 'payment_pending',
      quote_version: 2,
      checkout_attempt: 7,
      stripe_session_id: null,
      order_id: null,
      quote_json: { items: quoteSnapshot, totalCents: 12500 }
    });
    mocks.terrariumRepo.claimProjectCheckout.mockResolvedValue({
      ...projectRecord,
      status: 'payment_pending',
      quote_version: 2,
      checkout_attempt: 7,
      quote_json: { items: quoteSnapshot, totalCents: 12500 }
    });
    mocks.orderRepo.createOrder.mockResolvedValue({ id: orderId });
    mocks.orderRepo.findById
      .mockResolvedValueOnce({
        id: orderId,
        status: 'payment_pending',
        discount_amount_cents: 0,
        created_at: '2026-11-14T12:00:00.000Z',
        shipping_address_json: { email: 'jan@example.test' },
        items: quoteSnapshot.map((item) => ({ ...item, price_cents: item.unitPriceCents }))
      })
      .mockResolvedValueOnce({ id: orderId, status: 'payment_pending' });
    mocks.stripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_test_recovered', url: 'https://checkout.stripe.test/session' });
    mocks.terrariumRepo.attachProjectCheckout.mockResolvedValue({ id: projectId });
    const res = response();

    await createTerrariumCheckoutSession({
      user: { id: 'customer-user-id' },
      params: { projectId },
      body: {
        fullName: 'Jan Kowalski', email: 'jan@example.test', country: 'Polska',
        city: 'Jelenia Góra', postal_code: '58-500', street: 'Kolejowa', house_number: '12'
      },
      headers: { origin: 'http://localhost:5173' }
    }, res);

    expect(res.statusCode).toBe(201);
    expect(mocks.terrariumRepo.claimProjectCheckout).toHaveBeenCalledWith(projectId, 'customer-user-id');
    expect(mocks.orderRepo.createOrder).toHaveBeenCalledWith(expect.objectContaining({
      idempotencyKey: `terrarium:${projectId}:q2:a7`
    }));
    expect(mocks.stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer_email: 'jan@example.test' }),
      { idempotencyKey: `terrarium:${projectId}:q2:a7` }
    );
  });

  it('marks a project paid when Stripe reports delayed payment success', async () => {
    mocks.stripe.webhooks.constructEvent.mockReturnValue({
      type: 'checkout.session.async_payment_succeeded',
      data: { object: {
        id: 'cs_test_delayed', payment_status: 'paid',
        payment_intent: 'pi_test_delayed', metadata: { orderId }
      } }
    });
    mocks.orderRepo.markOrderPaidWithTransition.mockResolvedValue({
      transitioned: true,
      order: { id: orderId, items: [], shipping_address_json: { email: 'jan@example.test' } }
    });
    const res = response();

    await handleStripeWebhook({
      headers: { 'stripe-signature': 'test-signature' }, body: Buffer.from('{}')
    }, res);

    expect(res.statusCode).toBe(200);
    expect(mocks.orderRepo.markOrderPaidWithTransition).toHaveBeenCalledWith(orderId, 'pi_test_delayed');
    expect(mocks.terrariumRepo.markProjectPaidByOrder).toHaveBeenCalledWith(orderId);
  });
});
