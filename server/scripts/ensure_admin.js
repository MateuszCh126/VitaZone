import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../../');
dotenv.config({ path: join(rootDir, '.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true;
if (nodeEnv === 'production' && !rejectUnauthorized) {
    throw new Error('Unsafe DB SSL config: DB_SSL_REJECT_UNAUTHORIZED=false is forbidden in production.');
}

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized }
});

const ensureAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
        const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;

        if (!adminEmail || !adminPassword || adminPassword.length < 12) {
            throw new Error('Missing ADMIN_BOOTSTRAP_EMAIL or weak/missing ADMIN_BOOTSTRAP_PASSWORD (min 12 chars).');
        }

        const res = await pool.query("SELECT email FROM users WHERE role = 'admin' LIMIT 1");
        if (res.rows.length > 0) {
            console.log(`Admin already exists (${res.rows[0].email}). No password reset performed.`);
            return;
        }

        const hash = await bcrypt.hash(adminPassword, 12);
        await pool.query(
            `
                INSERT INTO users (full_name, email, password_hash, role, is_verified, created_at)
                VALUES ('Admin Bootstrap', $1, $2, 'admin', true, NOW())
            `,
            [adminEmail, hash]
        );

        console.log(`Admin created for ${adminEmail}.`);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
};

ensureAdmin();
