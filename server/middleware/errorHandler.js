import env from '../config/env.js';
import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
    logger.error(err.stack || err.message || err); // Log for server side

    if (err?.type === 'entity.parse.failed' || (err instanceof SyntaxError && err?.status === 400 && 'body' in err)) {
        return res.status(400).json({
            error: 'Malformed JSON payload',
            requestId: req.id
        });
    }

    if (err?.name === 'MulterError') {
        const message = err.code === 'LIMIT_FILE_SIZE'
            ? 'Uploaded image is too large'
            : 'Upload failed';

        return res.status(400).json({
            error: message,
            requestId: req.id
        });
    }

    const statusCode = err.statusCode || 500;
    const message = statusCode >= 500 ? 'Internal Server Error' : (err.message || 'Request failed');

    res.status(statusCode).json({
        error: message,
        requestId: req.id,
        stack: env.NODE_ENV === 'production' ? null : err.stack
    });
};
