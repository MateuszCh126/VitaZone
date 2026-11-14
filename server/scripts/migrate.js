import fs from 'fs';
import * as db from './db.js';
import { assertDestructiveSchemaResetAccess } from './demoDataSafety.js';

const migrate = async () => {
    try {
        assertDestructiveSchemaResetAccess();
        console.log('🔄 Running migrations...');
        const schema = fs.readFileSync('./schema.sql', 'utf8');
        await db.query(schema);
        console.log('✅ Schema applied successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exitCode = 1;
    } finally {
        await db.poolInstance.end();
    }
};

await migrate();
