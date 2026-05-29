import * as db from './db.js';
import logger from '../config/logger.js';

const migrate = async () => {
    const client = await db.poolInstance.connect();
    try {
        await client.query('BEGIN');

        logger.info('Dropping full_name and phone columns from users table...');
        await client.query(`
            ALTER TABLE users 
            DROP COLUMN IF EXISTS full_name,
            DROP COLUMN IF EXISTS phone;
        `);

        await client.query('COMMIT');
        logger.info('Columns dropped successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Drop columns failed:', error);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
};

migrate();
