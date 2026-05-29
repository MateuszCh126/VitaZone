import * as db from './db.js';
import logger from '../config/logger.js';

const migrate = async () => {
    const client = await db.poolInstance.connect();
    try {
        await client.query('BEGIN');

        // 1. Add new columns
        logger.info('Adding first_name and last_name columns...');
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
            ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
        `);

        // 2. Fetch all users
        const res = await client.query('SELECT id, full_name FROM users');
        const users = res.rows;

        logger.info(`Migrating ${users.length} users...`);

        // 3. Update each user
        for (const user of users) {
            if (user.full_name) {
                const parts = user.full_name.trim().split(/\s+/);
                const firstName = parts[0];
                const lastName = parts.slice(1).join(' ') || ''; // Handle single names

                await client.query(
                    'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3',
                    [firstName, lastName, user.id]
                );
            }
        }

        // 4. (Optional) We keep full_name for now to avoid breaking things immediately,
        // but we could drop it later.

        await client.query('COMMIT');
        logger.info('Migration completed successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
};

migrate();
