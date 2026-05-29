import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'migrations', '005_add_product_tax.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        
        console.log('Running migration 005 (Add tax_rate to products)...');
        await db.query(sql);
        console.log('Migration 005 completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit(0);
    }
}

runMigration();
