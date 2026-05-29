import * as db from './db.js';

const migrate = async () => {
    try {
        console.log('📦 Starting V4 Migration (User Soft Delete)...');
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
        `);
        console.log('✅ Migration V4 completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration V4 failed:', error);
        process.exit(1);
    }
};

migrate();
