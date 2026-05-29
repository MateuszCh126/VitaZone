import fs from 'fs';
import * as db from './db.js';

const migrate = async () => {
    try {
        console.log('🔄 Running migrations...');
        const schema = fs.readFileSync('./schema.sql', 'utf8');
        await db.query(schema);
        console.log('✅ Schema applied successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        process.exit();
    }
};

migrate();
