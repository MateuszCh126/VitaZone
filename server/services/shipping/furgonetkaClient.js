const SANDBOX_URL = 'https://api.sandbox.furgonetka.pl';
const DEFAULT_TIMEOUT_MS = 10000;

export class FurgonetkaTimeoutError extends Error {
    constructor() {
        super('Furgonetka sandbox request timed out.');
        this.name = 'FurgonetkaTimeoutError';
        this.code = 'SHIPPING_PROVIDER_TIMEOUT';
        this.statusCode = 504;
    }
}

export class FurgonetkaRequestError extends Error {
    constructor(status) {
        super(`Furgonetka sandbox request failed (HTTP ${status})`);
        this.name = 'FurgonetkaRequestError';
        this.status = status;
        this.code = 'SHIPPING_PROVIDER_ERROR';
        this.statusCode = 503;
    }
}

const assertBrokerService = (services, carrier, serviceId) => {
    const matches = Array.isArray(services)
        && services.some((service) => (
            String(service?.id ?? service?.service_id) === String(serviceId)
            && String(service?.service || '').toLowerCase() === carrier
            && (service?.owner ?? service?.agreement_owner) === 'furgonetka'
        ));
    if (!matches) throw new TypeError('Service is not configured for the requested carrier through Furgonetka.');
};

export const createFurgonetkaClient = ({ accessToken, fetchImpl = globalThis.fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) => {
    if (!accessToken || typeof fetchImpl !== 'function') {
        const error = new Error('Furgonetka sandbox is not configured.');
        error.code = 'SHIPPING_NOT_CONFIGURED';
        error.statusCode = 503;
        throw error;
    }

    const request = async (path, { method = 'GET', body, version = 'v1' } = {}) => {
        const controller = new AbortController();
        const deadlineMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS;
        let timeoutId;
        const deadline = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                controller.abort();
                reject(new FurgonetkaTimeoutError());
            }, deadlineMs);
        });
        const operation = (async () => {
            const response = await fetchImpl(`${SANDBOX_URL}${path}`, {
                method,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: `application/vnd.furgonetka.${version}+json`,
                    ...(body ? { 'Content-Type': `application/vnd.furgonetka.${version}+json` } : {})
                },
                ...(body ? { body: JSON.stringify(body) } : {}),
                signal: controller.signal
            });
            if (!response.ok) throw new FurgonetkaRequestError(response.status);
            if (response.status === 204) return null;
            return response.json();
        })();

        try {
            return await Promise.race([operation, deadline]);
        } catch (error) {
            if (controller.signal.aborted && error?.name === 'AbortError') {
                throw new FurgonetkaTimeoutError();
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    };

    return Object.freeze({
        listServices: () => request('/account/services'),
        async calculatePrice({ carrier, package: packageData, serviceIds }) {
            if (!['inpost', 'dpd'].includes(carrier)) throw new TypeError('Only InPost and DPD are supported.');
            if (!Array.isArray(serviceIds) || serviceIds.length === 0) return { services_prices: [] };
            const { services = [] } = await request('/account/services');
            for (const serviceId of serviceIds) assertBrokerService(services, carrier, serviceId);
            assertBrokerService(services, carrier, packageData?.service_id);
            return request('/packages/calculate-price', {
                method: 'POST',
                version: 'v2',
                body: { package: packageData, services: { service_id: serviceIds } }
            });
        }
    });
};
