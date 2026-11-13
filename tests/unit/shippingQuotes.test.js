import { describe, expect, it, vi } from 'vitest';
import { createFurgonetkaGateway, getShippingQuotes, resolveReviewedShippingQuote } from '../../server/services/shippingService.js';
import { buildDeliverySnapshot } from '../../server/services/shippingSnapshot.js';

const address = {
    fullName: 'Jan Kowalski',
    email: 'jan@example.com',
    phone: '500600700',
    country: 'PL',
    city: 'Warszawa',
    postal_code: '00-001',
    street: 'Testowa',
    house_number: '1'
};

const product = {
    id: '00000000-0000-4000-8000-000000000001',
    category_slug: 'akcesoria',
    specs: {
        shipping_parcels: [{ width: 30, depth: 20, height: 10, weight: 2 }]
    }
};

describe('server calculated shipping quotes', () => {
    it('uses only server product package data and exposes carrier keys with gross cents', async () => {
        const gateway = { quote: vi.fn().mockResolvedValue([
            { service: 'inpost', serviceId: 101, provider: 'furgonetka', available: true, priceGross: 12.34 },
            { service: 'dpd', serviceId: 202, provider: 'furgonetka', available: true, priceGross: 15.01 }
        ]) };

        const quotes = await getShippingQuotes({
            items: [{ productId: product.id, quantity: 2, price: 0.01, serviceId: 999 }],
            shipping: address,
            products: [product],
            gateway
        });

        expect(gateway.quote).toHaveBeenCalledWith(expect.objectContaining({
            receiver: expect.objectContaining({ postcode: '00-001' }),
            parcels: [{ width: 30, depth: 20, height: 10, weight: 2, quantity: 2 }]
        }));
        expect(quotes).toEqual([
            { method: 'inpost', label: 'InPost', amountCents: 1234, currency: 'pln', provider: 'furgonetka', providerServiceId: 101 },
            { method: 'dpd', label: 'DPD', amountCents: 1501, currency: 'pln', provider: 'furgonetka', providerServiceId: 202 }
        ]);
    });

    it('rejects live animals before calling the carrier gateway', async () => {
        const gateway = { quote: vi.fn() };

        await expect(getShippingQuotes({
            items: [{ productId: product.id, quantity: 1 }],
            shipping: address,
            products: [{ ...product, category_slug: 'gady' }],
            gateway
        })).rejects.toMatchObject({ code: 'LIVE_ANIMAL_UNSUPPORTED' });

        expect(gateway.quote).not.toHaveBeenCalled();
    });

    it('does not quote products without a measured server package profile', async () => {
        const gateway = { quote: vi.fn() };

        await expect(getShippingQuotes({
            items: [{ productId: product.id, quantity: 1 }],
            shipping: address,
            products: [{ id: product.id, category_slug: 'akcesoria', specs: {} }],
            gateway
        })).rejects.toMatchObject({ code: 'SHIPPING_PROFILE_MISSING' });

        expect(gateway.quote).not.toHaveBeenCalled();
    });

    it('rejects categories without confirmed standard-parcel eligibility', async () => {
        const gateway = { quote: vi.fn() };

        await expect(getShippingQuotes({
            items: [{ productId: product.id, quantity: 1 }],
            shipping: address,
            products: [{ ...product, category_slug: 'pokarm-i-suplementy' }],
            gateway
        })).rejects.toMatchObject({ code: 'UNSUPPORTED_SHIPPING_CATEGORY' });

        expect(gateway.quote).not.toHaveBeenCalled();
    });

    it('rejects missing, zero, and negative carrier prices instead of treating them as free', async () => {
        const gateway = { quote: vi.fn().mockResolvedValue([
            { service: 'inpost', available: true, priceGross: null },
            { service: 'dpd', available: true, priceGross: 0 },
            { service: 'dpd', available: true, priceGross: -1 }
        ]) };

        const quotes = await getShippingQuotes({
            items: [{ productId: product.id, quantity: 1 }],
            shipping: address,
            products: [product],
            gateway
        });

        expect(quotes).toEqual([]);
    });

    it('refuses quotes when the sandbox gateway is not configured', async () => {
        const gateway = { quote: vi.fn().mockRejectedValue(Object.assign(new Error('not configured'), { code: 'SHIPPING_NOT_CONFIGURED' })) };

        await expect(getShippingQuotes({
            items: [{ productId: product.id, quantity: 1 }],
            shipping: address,
            products: [product],
            gateway
        })).rejects.toMatchObject({ code: 'SHIPPING_NOT_CONFIGURED' });
    });

    it('uses only the official sandbox host and account-owned carrier service IDs', async () => {
        const calls = [];
        const fetchImpl = vi.fn(async (url, options) => {
            calls.push({ url, options });
            if (url.endsWith('/account/services')) return { ok: true, json: async () => ({ services: [
                { service: 'inpost', id: 111, owner: 'furgonetka' },
                { service: 'dpd', id: 222, owner: 'furgonetka' },
                { service: 'ups', id: 333, owner: 'furgonetka' }
            ] }) };
            const carrier = JSON.parse(options.body).package.service_id === 111 ? 'inpost' : 'dpd';
            const serviceId = carrier === 'inpost' ? 111 : 222;
            return { ok: true, json: async () => ({ services_prices: [
                { service: carrier, service_id: serviceId, available: carrier === 'inpost', pricing: { price_gross: carrier === 'inpost' ? 12.34 : null } }
            ] }) };
        });
        const gateway = createFurgonetkaGateway({
            env: {
                FURGONETKA_ACCESS_TOKEN: 'sandbox-token',
                FURGONETKA_PICKUP_NAME: 'Sender',
                FURGONETKA_PICKUP_COMPANY: 'Example',
                FURGONETKA_PICKUP_EMAIL: 'sender@example.com',
                FURGONETKA_PICKUP_PHONE: '500600700',
                FURGONETKA_PICKUP_STREET: 'Testowa 1',
                FURGONETKA_PICKUP_CITY: 'Warszawa',
                FURGONETKA_PICKUP_COUNTRY_CODE: 'PL',
                FURGONETKA_PICKUP_POSTCODE: '00-001',
                FURGONETKA_PICKUP_COUNTY: ''
            },
            fetchImpl
        });

        const quotes = await gateway.quote({ receiver: { name: 'Recipient' }, parcels: [{ width: 1 }] });

        expect(calls.map(({ url }) => url)).toEqual([
            'https://api.sandbox.furgonetka.pl/account/services',
            'https://api.sandbox.furgonetka.pl/account/services',
            'https://api.sandbox.furgonetka.pl/packages/calculate-price',
            'https://api.sandbox.furgonetka.pl/account/services',
            'https://api.sandbox.furgonetka.pl/packages/calculate-price'
        ]);
        expect(JSON.parse(calls[2].options.body).services.service_id).toEqual([111]);
        expect(JSON.parse(calls[4].options.body).services.service_id).toEqual([222]);
        expect(calls[0].options.headers.Authorization).toBe('Bearer sandbox-token');
        expect(calls[2].options.headers['Content-Type']).toBe('application/vnd.furgonetka.v2+json');
        expect(quotes).toEqual([
            { service: 'inpost', serviceId: 111, provider: 'furgonetka', available: true, priceGross: 12.34 },
            { service: 'dpd', serviceId: 222, provider: 'furgonetka', available: false, priceGross: null }
        ]);
    });

    it('fails closed without a delegated account token and when the provider rejects an expired token', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 401 });
        const sender = {
            FURGONETKA_PICKUP_NAME: 'Sender',
            FURGONETKA_PICKUP_COMPANY: 'Example',
            FURGONETKA_PICKUP_EMAIL: 'sender@example.com',
            FURGONETKA_PICKUP_PHONE: '500600700',
            FURGONETKA_PICKUP_STREET: 'Testowa 1',
            FURGONETKA_PICKUP_CITY: 'Warszawa',
            FURGONETKA_PICKUP_COUNTRY_CODE: 'PL',
            FURGONETKA_PICKUP_POSTCODE: '00-001'
        };
        const unconfigured = createFurgonetkaGateway({ env: sender, fetchImpl });
        await expect(unconfigured.quote({ receiver: {}, parcels: [] }))
            .rejects.toMatchObject({ code: 'SHIPPING_NOT_CONFIGURED' });
        expect(fetchImpl).not.toHaveBeenCalled();

        const expired = createFurgonetkaGateway({ env: { ...sender, FURGONETKA_ACCESS_TOKEN: 'expired-token' }, fetchImpl });
        await expect(expired.quote({ receiver: {}, parcels: [] }))
            .rejects.toMatchObject({ code: 'SHIPPING_PROVIDER_ERROR', statusCode: 503 });
        expect(fetchImpl).toHaveBeenCalledTimes(1);
        expect(fetchImpl.mock.calls[0][0]).toBe('https://api.sandbox.furgonetka.pl/account/services');
    });

    it('compares the reviewed price with the latest quote before allowing checkout', () => {
        const fresh = [{ method: 'dpd', amountCents: 1550, provider: 'furgonetka', providerServiceId: 222 }];

        expect(resolveReviewedShippingQuote({ quotes: fresh, method: 'dpd', expectedAmountCents: 1550 })).toEqual({
            changed: false,
            quote: fresh[0]
        });
        expect(resolveReviewedShippingQuote({ quotes: fresh, method: 'dpd', expectedAmountCents: 1500 })).toEqual({
            changed: true,
            quote: null
        });
    });

    it('persists the provider and exact service ID from the fresh server quote', async () => {
        const quotes = await getShippingQuotes({
            items: [{ productId: product.id, quantity: 1, serviceId: 'browser-value' }],
            shipping: address,
            products: [product],
            gateway: { quote: vi.fn().mockResolvedValue([
                { service: 'dpd', serviceId: 7824, provider: 'furgonetka', available: true, priceGross: 14.5 }
            ]) }
        });
        const selected = resolveReviewedShippingQuote({ quotes, method: 'dpd', expectedAmountCents: 1450 }).quote;

        expect(buildDeliverySnapshot({
            method: selected.method,
            amountCents: selected.amountCents,
            provider: selected.provider,
            serviceId: selected.providerServiceId
        })).toEqual({ method: 'dpd', amount_cents: 1450, provider: 'furgonetka', service_id: 7824 });
    });
});
