import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true;
if (nodeEnv === 'production' && !rejectUnauthorized) {
    throw new Error('Unsafe DB SSL config: DB_SSL_REJECT_UNAUTHORIZED=false is forbidden in production.');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // process.exit(-1); // Don't kill the process in serverless env
});

export const query = (text, params) => pool.query(text, params);
export const poolInstance = pool;
