import winston from 'winston';
import env from './env.js';
import { contextStorage } from './requestContext.js';

const logger = winston.createLogger({
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const store = contextStorage.getStore();
            const requestId = store ? store.get('requestId') : 'SYSTEM';
            return JSON.stringify({
                timestamp,
                level,
                message,
                requestId,
                ...meta
            });
        })
    ),
    transports: [
        new winston.transports.Console({
            format: env.NODE_ENV === 'production'
                ? winston.format.json()
                : winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
        })
    ]
});

export default logger;
