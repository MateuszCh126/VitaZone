import * as db from './db.js';

const migrate = async () => {
    try {
        console.log('📦 Starting V3 Migration (Address Fields)...');
        await db.query(`
            ALTER TABLE addresses 
            ADD COLUMN IF NOT EXISTS house_number VARCHAR(20),
            ADD COLUMN IF NOT EXISTS apartment_number VARCHAR(20);
        `);
        console.log('✅ Migration V3 completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration V3 failed:', error);
        process.exit(1);
    }
};

migrate();
