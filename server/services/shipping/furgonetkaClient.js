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

        calculatePrice: ({ carrier, package: packageData, serviceIds }) => {
            assertSupportedCarrier(carrier);
            return request('/packages/calculate-price', {
                method: 'POST',
                version: API_VERSIONS.package,
                body: {
                    package: packageData,
                    services: { service_id: serviceIds }
                }
            });
        },

        createAccessoryPackage: ({ carrier, items, package: packageData }) => {
            assertSupportedCarrier(carrier);
            assertAccessoriesOnly(items);
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
