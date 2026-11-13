const DEFAULT_SANDBOX_URL = 'https://api.sandbox.furgonetka.pl';
const API_VERSIONS = Object.freeze({ account: 'v1', package: 'v2' });
const SUPPORTED_CARRIERS = new Set(['inpost', 'dpd']);

export const ACCESSORY_CATEGORY_SLUGS = new Set([
    'akcesoria',
    'ogrzewanie-i-oswietlenie',
    'podloza-i-dekoracje'
]);

export class ShippingConfigurationError extends Error {
    constructor(message = 'Furgonetka API is not configured') {
        super(message);
        this.name = 'ShippingConfigurationError';
        this.code = 'SHIPPING_NOT_CONFIGURED';
    }
}

export class ShippingRequestError extends Error {
    constructor(status) {
        super(`Furgonetka API request failed (HTTP ${status})`);
        this.name = 'ShippingRequestError';
        this.status = status;
    }
}

const assertAccessoriesOnly = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new TypeError('Shipping requires at least one classified accessory item');
    }

    for (const item of items) {
        if (!ACCESSORY_CATEGORY_SLUGS.has(item?.categorySlug)) {
            throw new TypeError('Standard InPost/DPD shipping is restricted to known accessory categories');
        }
    }
};

const assertSupportedCarrier = (carrier) => {
    if (!SUPPORTED_CARRIERS.has(carrier)) {
        throw new TypeError('Only InPost and DPD are supported by this adapter');
    }
};

const assertBrokerService = (services, carrier, serviceId) => {
    const matches = Array.isArray(services)
        && services.some((service) => (
            String(service?.id) === String(serviceId)
            && service?.service?.toLowerCase() === carrier
            && service?.owner === 'furgonetka'
        ));

    if (!matches) {
        throw new TypeError('Selected service is not an active Furgonetka service for the requested carrier');
    }
};

export const createFurgonetkaClient = ({
    accessToken,
    baseUrl = DEFAULT_SANDBOX_URL,
    fetchImpl = globalThis.fetch
} = {}) => {
    if (!accessToken || typeof fetchImpl !== 'function') {
        throw new ShippingConfigurationError();
    }

    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
    if (!['https://api.sandbox.furgonetka.pl', 'https://api.furgonetka.pl'].includes(normalizedBaseUrl)) {
        throw new TypeError('Furgonetka base URL must use the official production or sandbox host');
    }

    const request = async (path, { method = 'GET', body, version = API_VERSIONS.account } = {}) => {
        const response = await fetchImpl(`${normalizedBaseUrl}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: `application/vnd.furgonetka.${version}+json`,
                ...(body ? { 'Content-Type': `application/vnd.furgonetka.${version}+json` } : {})
            },
            ...(body ? { body: JSON.stringify(body) } : {})
        });

        if (!response.ok) throw new ShippingRequestError(response.status);
        if (response.status === 204) return null;
        return response.json();
    };

    return Object.freeze({
        listServices: () => request('/account/services'),

        calculatePrice: async ({ carrier, package: packageData, serviceIds }) => {
            assertSupportedCarrier(carrier);
            if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
                throw new TypeError('At least one carrier service is required to calculate a price');
            }
            const { services = [] } = await request('/account/services');
            for (const serviceId of serviceIds) assertBrokerService(services, carrier, serviceId);
            assertBrokerService(services, carrier, packageData?.service_id);

            return request('/packages/calculate-price', {
                method: 'POST',
                version: API_VERSIONS.package,
                body: {
                    package: packageData,
                    services: { service_id: serviceIds }
                }
            });
        },

        createAccessoryPackage: async ({ carrier, items, package: packageData }) => {
            assertSupportedCarrier(carrier);
            assertAccessoriesOnly(items);
            const { services = [] } = await request('/account/services');
            assertBrokerService(services, carrier, packageData?.service_id);
            await request('/packages/validate', {
                method: 'POST',
                version: API_VERSIONS.package,
                body: packageData
            });
            return request('/packages', {
                method: 'POST',
                version: API_VERSIONS.package,
                body: packageData
            });
        }
    });
};

export const createFurgonetkaClientFromEnv = (env = process.env, options = {}) => {
    if (!env.FURGONETKA_ACCESS_TOKEN) return null;
    return createFurgonetkaClient({
        accessToken: env.FURGONETKA_ACCESS_TOKEN,
        baseUrl: env.FURGONETKA_API_BASE_URL || DEFAULT_SANDBOX_URL,
        ...options
    });
};
