import env from './env.js';

export const isProduction = env.NODE_ENV === 'production';

const configuredAppOrigin = (() => {
    try {
        return new URL(env.PUBLIC_APP_URL).origin;
    } catch {
        return null;
    }
})();

const vercelRuntimeOrigins = [
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null
].filter(Boolean);

const defaultAllowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://animalsshop.vercel.app',
    'https://animalsshop-git-main-exotic-pets.vercel.app',
    'https://vitazone.vercel.app',
    configuredAppOrigin,
    ...vercelRuntimeOrigins
];

const envAllowedOrigins = env.CORS_ALLOWED_ORIGINS
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

export const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

export const authCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
};
