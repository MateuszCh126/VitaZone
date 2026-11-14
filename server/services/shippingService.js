import { createFurgonetkaClient } from './shipping/furgonetkaClient.js';

export const LIVE_ANIMAL_CATEGORY_SLUGS = new Set(['gady', 'weze', 'zolwie', 'plazy', 'pajaki']);
export const STANDARD_PARCEL_CATEGORY_SLUGS = new Set(['akcesoria', 'ogrzewanie-i-oswietlenie', 'podloza-i-dekoracje']);
const SUPPORTED_CARRIERS = new Map([
    ['inpost', 'InPost'],
    ['dpd', 'DPD']
]);

const shippingError = (code, message, statusCode = 503) => Object.assign(new Error(message), { code, statusCode });

const validateParcels = (product, quantity) => {
    const parcels = product.specs?.shipping_parcels;
    if (!Array.isArray(parcels) || parcels.length === 0) {
        throw shippingError('SHIPPING_PROFILE_MISSING', 'Brak zweryfikowanych wymiarów i masy paczki dla produktu.', 422);
    }

    return parcels.map((parcel) => {
        const dimensions = ['width', 'depth', 'height', 'weight'];
        if (dimensions.some((key) => !Number.isFinite(parcel[key]) || parcel[key] <= 0)) {
            throw shippingError('SHIPPING_PROFILE_INVALID', 'Profil paczki produktu jest nieprawidłowy.', 422);
        }
        return {
            width: parcel.width,
            depth: parcel.depth,
            height: parcel.height,
            weight: parcel.weight,
            quantity: (Number.isInteger(parcel.quantity) && parcel.quantity > 0 ? parcel.quantity : 1) * quantity
        };
    });
};

const buildReceiver = (shipping) => ({
    name: shipping.fullName,
    email: shipping.email,
    phone: shipping.phone,
    street: [shipping.street, shipping.house_number, shipping.apartment_number].filter(Boolean).join(' '),
    city: shipping.city,
    country_code: shipping.country === 'PL' || shipping.country === 'Polska' ? 'PL' : shipping.country,
    postcode: shipping.postal_code,
    county: ''
});

export const getShippingQuotes = async ({ items, shipping, products, gateway }) => {
    const productById = new Map(products.map((product) => [product.id, product]));
    const parcels = [];

    for (const item of items) {
        const product = productById.get(item.productId);
        if (!product) {
            throw shippingError('SHIPPING_PRODUCT_UNAVAILABLE', 'Produkt nie jest dostępny do wysyłki.', 400);
        }
        if (LIVE_ANIMAL_CATEGORY_SLUGS.has(product.category_slug)) {
            throw shippingError('LIVE_ANIMAL_UNSUPPORTED', 'Wysyłka kurierska przez InPost/DPD nie jest dostępna dla żywych zwierząt.', 422);
        }
        if (!STANDARD_PARCEL_CATEGORY_SLUGS.has(product.category_slug)) {
            throw shippingError('UNSUPPORTED_SHIPPING_CATEGORY', 'Ta kategoria nie jest obsługiwana przez standardową wysyłkę InPost/DPD.', 422);
        }
        parcels.push(...validateParcels(product, item.quantity));
    }

    const carrierPrices = await gateway.quote({ receiver: buildReceiver(shipping), parcels });
    const cheapestByCarrier = new Map();

    for (const quote of carrierPrices) {
        const method = String(quote.service || '').toLowerCase();
        if (!SUPPORTED_CARRIERS.has(method) || !quote.available) continue;
        if (quote.provider !== 'furgonetka' || quote.serviceId == null) continue;
        if (!['number', 'string'].includes(typeof quote.priceGross) || String(quote.priceGross).trim() === '') continue;
        const numericGrossPrice = Number(quote.priceGross);
        if (!Number.isFinite(numericGrossPrice)) continue;
        const amountCents = Math.round(numericGrossPrice * 100);
        if (!Number.isSafeInteger(amountCents) || amountCents <= 0) continue;
        const existing = cheapestByCarrier.get(method);
        if (!existing || amountCents < existing.amountCents) {
            cheapestByCarrier.set(method, {
                method,
                label: SUPPORTED_CARRIERS.get(method),
                amountCents,
                currency: 'pln',
                provider: quote.provider,
                providerServiceId: quote.serviceId
            });
        }
    }

    return [...cheapestByCarrier.values()];
};

export const createFurgonetkaGateway = ({ env, fetchImpl = globalThis.fetch }) => {
    const accessToken = env.FURGONETKA_ACCESS_TOKEN;
    const pickup = {
        name: env.FURGONETKA_PICKUP_NAME,
        company: env.FURGONETKA_PICKUP_COMPANY,
        email: env.FURGONETKA_PICKUP_EMAIL,
        phone: env.FURGONETKA_PICKUP_PHONE,
        street: env.FURGONETKA_PICKUP_STREET,
        city: env.FURGONETKA_PICKUP_CITY,
        country_code: env.FURGONETKA_PICKUP_COUNTRY_CODE,
        postcode: env.FURGONETKA_PICKUP_POSTCODE,
        county: env.FURGONETKA_PICKUP_COUNTY || ''
    };
    if (Object.values(pickup).some((value, index) => index < 8 && !value)) {
        return {
            async quote() {
                throw shippingError('SHIPPING_NOT_CONFIGURED', 'Wysyłka InPost/DPD nie jest jeszcze skonfigurowana.');
            }
        };
    }

    return {
        async quote({ receiver, parcels }) {
            if (!accessToken) {
            throw shippingError('SHIPPING_NOT_CONFIGURED', 'Wysyłka InPost/DPD nie jest jeszcze skonfigurowana.');
            }
            const client = createFurgonetkaClient({
                accessToken,
                fetchImpl,
                timeoutMs: env.FURGONETKA_TIMEOUT_MS
            });
            const services = (await client.listServices())?.services || [];
            const quotes = [];

            for (const carrier of SUPPORTED_CARRIERS.keys()) {
                const carrierServices = services.filter((service) => (
                    String(service.service || '').toLowerCase() === carrier
                    && (service.owner ?? service.agreement_owner) === 'furgonetka'
                    && (service.id ?? service.service_id) != null
                ));
                const serviceIds = carrierServices.map((service) => service.id ?? service.service_id);
                if (serviceIds.length === 0) continue;
                const result = await client.calculatePrice({
                    carrier,
                    package: { pickup, receiver, service_id: serviceIds[0], parcels },
                    serviceIds
                });
                quotes.push(...(result?.services_prices || []).map((price) => ({
                    service: price.service,
                    serviceId: price.service_id,
                    provider: price.agreement_owner || 'furgonetka',
                    available: price.available === true,
                    priceGross: price.pricing?.price_gross
                })));
            }
            return quotes;
        }
    };
};

export const resolveReviewedShippingQuote = ({ quotes, method, expectedAmountCents }) => {
    const selected = quotes.find((quote) => quote.method === method);
    if (!selected || selected.amountCents !== expectedAmountCents) {
        return { changed: true, quote: null };
    }
    return { changed: false, quote: selected };
};
