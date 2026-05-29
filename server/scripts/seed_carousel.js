import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../../');
dotenv.config({ path: join(rootDir, '.env') });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const seedCarousel = async () => {
    try {
        console.log('Seeding Carousel Test Product...');

        // Ensure a category exists
        let catRes = await pool.query('SELECT id FROM categories LIMIT 1');
        let catId;
        if (catRes.rows.length === 0) {
            console.log('No categories found, creating one...');
            const newCat = await pool.query("INSERT INTO categories (name, slug, image, description) VALUES ('Gadulce', 'gady', 'http://placehold.it/300', 'Test Category') RETURNING id");
            catId = newCat.rows[0].id;
        } else {
            catId = catRes.rows[0].id;
        }

        const images = [
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1200',
            'https://images.unsplash.com/photo-1579619634567-5d517173a116?q=80&w=1200',
            'https://images.unsplash.com/photo-1558564070-e14b030ee23d?q=80&w=1200'
        ];

        // Use price_cents (999.00 -> 99900)
        const q = `
            INSERT INTO products (name, species, description, price_cents, stock, category_id, image_urls, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, true)
            RETURNING id;
        `;
        const res = await pool.query(q, [
            'Test Karuzeli (Chameleon)',
            'Chamaeleo calyptratus',
            'Testowy produkt do weryfikacji karuzeli zdjęć. Posiada 3 zdjęcia.',
            99900,
            5,
            catId,
            images
        ]);
        console.log(`Created product with ID: ${res.rows[0].id}`);
        pool.end();
    } catch (e) {
        console.error('Error seeding:', e);
        pool.end();
    }
};

seedCarousel();
