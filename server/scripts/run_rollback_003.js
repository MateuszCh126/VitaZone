import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runRollback = async () => {
    try {
        const sqlPath = path.join(__dirname, 'migrations', 'rollback', '003_rollback_snapshots.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running ROLLBACK: 003_rollback_snapshots.sql');
        await db.query(sql);
        console.log('Rollback successful');
    } catch (error) {
        console.error('Rollback failed:', error);
    }
};

runRollback();
