
import * as db from './db.js';

const migrate = async () => {
    console.log('🚀 Starting V2 Migration (Legal & Carts)...');

    const client = await db.poolInstance.connect();

    try {
        await client.query('BEGIN');

        // 1. Legal Consents
        console.log('  Creating legal_consents table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS legal_consents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id),
                ip_address VARCHAR(45),
                consent_type VARCHAR(50) NOT NULL,
                status BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Carts
        console.log('  Creating carts table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS carts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Trigger for carts
        // Check if trigger exists first? Or just CREATE OR REPLACE function then DROP/CREATE trigger.
        // Simplified: IF NOT EXISTS logic for trigger is tricky in standard SQL without DO block.
        // We'll trust it doesn't fail if we just run SQL command that checks or fails gracefully.
        // Actually, let's use a safe block.
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_carts_modtime') THEN
                    CREATE TRIGGER update_carts_modtime BEFORE UPDATE ON carts 
                    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
                END IF;
            END
            $$;
        `);

        // 3. Cart Items
        console.log('  Creating cart_items table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS cart_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
                product_id UUID REFERENCES products(id),
                quantity INT NOT NULL CHECK (quantity > 0),
                UNIQUE(cart_id, product_id)
            );
        `);

        await client.query('COMMIT');
        console.log('✅ Migration V2 completed successfully!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
    } finally {
        client.release();
        process.exit();
    }
};

migrate();
