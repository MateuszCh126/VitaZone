import { describe, expect, it, vi } from 'vitest';
import {
    createFurgonetkaClient,
    createFurgonetkaClientFromEnv,
    ShippingConfigurationError
} from '../../server/services/shipping/furgonetkaClient.js';

const jsonResponse = (body, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body)
});

describe('Furgonetka adapter', () => {
    it('is disabled until an access token is configured', () => {
        expect(createFurgonetkaClientFromEnv({})).toBeNull();
        expect(() => createFurgonetkaClient({})).toThrow(ShippingConfigurationError);
    });

    it('discovers services using the documented authenticated endpoint', async () => {
        const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ services: [] }));
        const client = createFurgonetkaClient({ accessToken: 'mock-token', fetchImpl });

        await client.listServices();

        expect(fetchImpl).toHaveBeenCalledWith('https://api.sandbox.furgonetka.pl/account/services', expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer mock-token', Accept: 'application/vnd.furgonetka.v1+json' })
        }));
    });

    it('calculates a quote against selected carrier service IDs', async () => {
        const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ services_prices: [] }));
        const client = createFurgonetkaClient({ accessToken: 'mock-token', fetchImpl });
        const packageData = { service_id: 7, parcels: [] };

        await client.calculatePrice({ carrier: 'dpd', package: packageData, serviceIds: [7] });

        expect(fetchImpl).toHaveBeenCalledWith('https://api.sandbox.furgonetka.pl/packages/calculate-price', expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({ 'Content-Type': 'application/vnd.furgonetka.v2+json' }),
            body: JSON.stringify({ package: packageData, services: { service_id: [7] } })
        }));
    });

    it('allows creating a package draft for accessory category slugs', async () => {
        const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ package_id: 'mock-id', state: 'waiting' }));
        const client = createFurgonetkaClient({ accessToken: 'mock-token', fetchImpl });
        const packageData = { receiver: {}, pickup: {}, service_id: 7, parcels: [] };

        await client.createAccessoryPackage({ carrier: 'inpost', items: [{ categorySlug: 'akcesoria' }], package: packageData });

        expect(fetchImpl).toHaveBeenCalledWith('https://api.sandbox.furgonetka.pl/packages', expect.objectContaining({
            method: 'POST', body: JSON.stringify(packageData)
        }));
    });

    it.each([undefined, 'gady', 'pajaki', 'pokarm-i-suplementy', 'unknown'])('blocks unclassified or non-accessory category %s before HTTP', async (categorySlug) => {
        const fetchImpl = vi.fn();
        const client = createFurgonetkaClient({ accessToken: 'mock-token', fetchImpl });

        expect(() => client.createAccessoryPackage({ carrier: 'dpd', items: [{ categorySlug }], package: {} })).toThrow(/restricted to known accessory/);
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it('rejects other carriers before HTTP', () => {
        const fetchImpl = vi.fn();
        const client = createFurgonetkaClient({ accessToken: 'mock-token', fetchImpl });
        expect(() => client.createAccessoryPackage({ carrier: 'ups', items: [{ categorySlug: 'akcesoria' }], package: {} })).toThrow(/Only InPost and DPD/);
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it('rejects non-official API hosts', () => {
        expect(() => createFurgonetkaClient({ accessToken: 'mock-token', baseUrl: 'https://attacker.example' })).toThrow(/official production or sandbox/);
    });
});
