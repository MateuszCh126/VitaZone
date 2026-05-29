import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigration = async () => {
    try {
        const sqlPath = path.join(__dirname, 'migrations', '004_add_tax_snapshot.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running migration: 004_add_tax_snapshot.sql');
        await db.query(sql);
        console.log('Migration successful');
    } catch (error) {
        console.error('Migration failed:', error);
    }
};

runMigration();
