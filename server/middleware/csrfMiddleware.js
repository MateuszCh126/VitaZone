const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const normalizeOrigin = (value) => {
    if (!value) return null;
    return value.endsWith('/') ? value.slice(0, -1) : value;
};

const extractOrigin = (req) => {
    const origin = req.get('origin');
    if (origin) return normalizeOrigin(origin);

    const referer = req.get('referer');
    if (!referer) return null;

    try {
        const url = new URL(referer);
        return normalizeOrigin(url.origin);
    } catch {
        return null;
    }
};

export const verifyCsrfOrigin = (allowedOrigins = []) => {
    const normalizedAllowed = new Set(allowedOrigins.map(normalizeOrigin).filter(Boolean));

    return (req, res, next) => {
        if (!MUTATING_METHODS.has(req.method)) return next();
        if (!req.cookies?.token) return next();

        const requestOrigin = extractOrigin(req);
        if (!requestOrigin || !normalizedAllowed.has(requestOrigin)) {
            return res.status(403).json({ error: 'CSRF protection: invalid request origin' });
        }

        next();
    };
};

