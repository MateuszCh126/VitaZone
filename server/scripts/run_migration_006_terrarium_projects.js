import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as db from './db.js';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const migrationFile = path.join(scriptDirectory, 'migrations', '006_create_terrarium_projects.sql');

try {
    await db.query(await fs.readFile(migrationFile, 'utf8'));
    console.info('Terrarium projects migration 006 applied (or already present).');
} catch (error) {
    console.error('Terrarium projects migration 006 failed:', error.message);
    process.exitCode = 1;
} finally {
    await db.poolInstance.end();
}
