import * as db from './db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigrations = async () => {
    try {
        console.log('🔄 Checking database connection...');

        // 1. Ensure Migrations Table Exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // 2. Get Applied Migrations
        const appliedResult = await db.query('SELECT filename FROM _migrations');
        const appliedFiles = new Set(appliedResult.rows.map(r => r.filename));

        // 3. List Migration Files
        const files = await fs.readdir(__dirname);
        const migrationFiles = files
            .filter(f => (f.startsWith('migrate_') || f.startsWith('run_migration_')) && f.endsWith('.js'))
            .sort((a, b) => a.localeCompare(b));

        console.log(`📂 Found ${migrationFiles.length} migration files.`);

        // 4. Run Pending Migrations
        for (const file of migrationFiles) {
            if (!appliedFiles.has(file)) {
                console.log(`🚀 Running migration: ${file}...`);

                // Execute the migration script content
                // Note: Ideally we import run it, but since they are standalone scripts with process.exit, 
                // we should refactor them to export a function or execute via child_process.
                // For this Audit Fix, we will assume they export a 'migrate' function or we wrap them.
                // Given step 12.3 in report mentions they rely on raw SQL, let's use child_process to be safe with existing scripts.

                const { execSync } = await import('child_process');
                try {
                    execSync(`node ${path.join(__dirname, file)}`, { stdio: 'inherit' });

                    // Mark as applied
                    await db.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
                    console.log(`✅ Applied: ${file}`);
                } catch (e) {
                    console.error(`❌ Failed to apply ${file}:`, e);
                    process.exit(1);
                }
            } else {
                console.log(`⏭️  Skipping: ${file} (Already Applied)`);
            }
        }

        console.log('✨ All migrations are up to date!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration Runner failed:', error);
        process.exit(1);
    }
};

runMigrations();
