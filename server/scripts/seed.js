import * as db from './db.js';
import { createRequire } from 'module';
import { catalogCategories, catalogProducts } from './catalogData.js';

const require = createRequire(import.meta.url);
const bcrypt = require('bcrypt');

const seed = async () => {
    console.log('Starting database seeding...');

    try {
        await db.query('DELETE FROM order_items');
        await db.query('DELETE FROM orders');
        await db.query('DELETE FROM products');
        await db.query('DELETE FROM categories');
        await db.query('DELETE FROM users');
        await db.query('DELETE FROM addresses');

        console.log('  Adding categories...');
        const categoryMap = new Map();

        for (const category of catalogCategories) {
            const result = await db.query(
                'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING id, slug',
                [category.name, category.slug, category.description]
            );
            categoryMap.set(result.rows[0].slug, result.rows[0].id);
        }

        console.log(`  Adding ${catalogProducts.length} products...`);
        for (const product of catalogProducts) {
            await db.query(
                `INSERT INTO products (name, species, category_id, price_cents, description, stock, image_urls, tax_rate)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    product.name,
                    product.species,
                    categoryMap.get(product.categorySlug),
                    product.priceCents,
                    product.description,
                    product.stock,
                    product.imageUrls,
                    product.taxRate
                ]
            );
        }

        const seedAdminEmail = process.env.SEED_ADMIN_EMAIL;
        const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;
        if (seedAdminEmail && seedAdminPassword && seedAdminPassword.length >= 12) {
            console.log('  Adding admin user from secure env vars...');
            const hashedPassword = await bcrypt.hash(seedAdminPassword, 12);
            await db.query(
                'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4)',
                [seedAdminEmail, hashedPassword, 'Admin User', 'admin']
            );
        } else {
            console.log('  Skipping admin seed (set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD >= 12 chars to enable).');
        }

        console.log('Seeding completed successfully.');
    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        process.exit();
    }
};

seed();
