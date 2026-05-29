import { exec } from 'child_process';
import env from '../config/env.js';
import fs from 'fs';
import path from 'path';

const backupDir = path.join(process.cwd(), 'backups');

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = path.join(backupDir, `backup-${timestamp}.sql`);

// Construct pg_dump command
// Ensure DATABASE_URL is set in env
const dbUrl = env.DATABASE_URL;

if (!dbUrl) {
    console.error('❌ DATABASE_URL is not defined in environment variables.');
    process.exit(1);
}

const command = `pg_dump "${dbUrl}" -F c -b -v -f "${filename}"`;

console.log(`📦 Starting database backup to ${filename}...`);

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Backup failed: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`ℹ️ pg_dump output: ${stderr}`);
    }
    console.log(`✅ Backup completed successfully!`);
});
