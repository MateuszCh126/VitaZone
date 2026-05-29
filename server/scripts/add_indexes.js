import * as db from './db.js';

const addIndexes = async () => {
    try {
        console.log('🔄 Adding performance indexes...');

        const queries = [
            'CREATE INDEX IF NOT EXISTS idx_products_specs ON products USING gin (specs)',
            'CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)',
            'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
            'CREATE INDEX IF NOT EXISTS idx_carts_user ON carts(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_consents_user ON legal_consents(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_consents_ip ON legal_consents(ip_address)'
        ];

        for (const query of queries) {
            await db.query(query);
            console.log(`✅ Executed: ${query}`);
        }

        console.log('🎉 All indexes applied successfully!');
    } catch (error) {
        console.error('❌ Failed to add indexes:', error);
    } finally {
        // process.exit() might kill the pool unexpectedly in some envs, 
        // but for a script it is usually fine.
        process.exit();
    }
};

addIndexes();
