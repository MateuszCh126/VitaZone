import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFurgonetkaClient } from '../../server/services/shipping/furgonetkaClient.js';

describe('Furgonetka client request deadline', () => {
    afterEach(() => vi.useRealTimers());

    it('aborts and rejects a request that exceeds the configured deadline', async () => {
        vi.useFakeTimers();
        const fetchImpl = vi.fn((_url, options = {}) => new Promise((resolve, reject) => {
            options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
        }));
        const client = createFurgonetkaClient({ accessToken: 'demo-token', fetchImpl, timeoutMs: 25 });
        let result;
        client.listServices().then(
            () => { result = { resolved: true }; },
            (error) => { result = { error }; }
        );

        await vi.advanceTimersByTimeAsync(25);

        expect(result.error).toMatchObject({
            name: 'FurgonetkaTimeoutError',
            code: 'SHIPPING_PROVIDER_TIMEOUT',
            statusCode: 504
        });
        expect(fetchImpl.mock.calls[0][1].signal.aborted).toBe(true);
    });

    it('rejects at the deadline even if an injected fetch implementation ignores AbortSignal', async () => {
        vi.useFakeTimers();
        const fetchImpl = vi.fn(() => new Promise(() => {}));
        const client = createFurgonetkaClient({ accessToken: 'demo-token', fetchImpl, timeoutMs: 25 });
        let result;
        client.listServices().catch((error) => { result = error; });

        await vi.advanceTimersByTimeAsync(25);

        expect(result).toMatchObject({
            name: 'FurgonetkaTimeoutError',
            code: 'SHIPPING_PROVIDER_TIMEOUT',
            statusCode: 504
        });
    });
});
