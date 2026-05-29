import { cleanEnv, str, port, url, num, bool } from 'envalid';
import dotenv from 'dotenv';
import { DEFAULT_SHIPPING_AMOUNT_CENTS } from '../../shared/commerce.js';

dotenv.config({ quiet: true });

const defaultNodeEnv = process.env.VERCEL ? 'production' : 'development';
const defaultTrustProxyHops = process.env.VERCEL ? 1 : 0;

const env = cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'test', 'production', 'provision'], default: defaultNodeEnv }),
    PORT: port({ default: 3001 }),
    TRUST_PROXY_HOPS: num({ default: defaultTrustProxyHops }),
    DATABASE_URL: url(),
    JWT_SECRET: str(),
    JWT_EXPIRES_IN: str({ default: '24h' }),
    VITE_API_URL: url({ default: 'http://localhost:3001' }),
    PUBLIC_APP_URL: url({ default: 'http://localhost:5173' }),
    CORS_ALLOWED_ORIGINS: str({ default: '' }),
    STRIPE_SECRET_KEY: str({ default: '' }),
    STRIPE_WEBHOOK_SECRET: str({ default: '' }),
    STRIPE_CURRENCY: str({ default: 'pln' }),
    STRIPE_CHECKOUT_EXPIRES_MINUTES: num({ default: 30 }),
    ORDER_SHIPPING_CENTS: num({ default: DEFAULT_SHIPPING_AMOUNT_CENTS }),
    ALLOW_MANUAL_ORDER_CREATION: bool({ default: false }),
    VITE_STRIPE_PUBLISHABLE_KEY: str({ default: '' }),
    GOOGLE_GENERATIVE_AI_API_KEY: str({ default: '' }),
    GEMINI_API_KEY: str({ default: '' }),
    GOOGLE_API_KEY: str({ default: '' }),
    GOOGLE_AI_API_KEY: str({ default: '' }),
    GOOGLE_GENERATIVE_AI_MODEL: str({ default: 'gemini-2.5-flash' }),
    AI_GATEWAY_API_KEY: str({ default: '' }),
    AI_TIMEOUT_MS: num({ default: 15000 }),
    AI_CIRCUIT_FAILURE_THRESHOLD: num({ default: 5 }),
    AI_CIRCUIT_RESET_MS: num({ default: 60000 }),
    RESEND_API_KEY: str({ default: '' }),
    RESEND_FROM_EMAIL: str({ default: '' }),
    RESEND_REPLY_TO_EMAIL: str({ default: '' }),
});

export default env;
