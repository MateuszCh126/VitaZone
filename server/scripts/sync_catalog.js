import * as db from './db.js';
import { catalogCategories, catalogProducts } from './catalogData.js';

const syncCatalog = async () => {
    console.log('Starting catalog sync...');
    const client = await db.poolInstance.connect();

    try {
        await client.query('BEGIN');

        const categoryIdsBySlug = new Map();

        for (const category of catalogCategories) {
            const existingCategory = await client.query(
                'SELECT id FROM categories WHERE slug = $1',
                [category.slug]
            );

            if (existingCategory.rowCount > 0) {
                const categoryId = existingCategory.rows[0].id;
                await client.query(
                    'UPDATE categories SET name = $1, description = $2 WHERE id = $3',
                    [category.name, category.description, categoryId]
                );
                categoryIdsBySlug.set(category.slug, categoryId);
            } else {
                const insertedCategory = await client.query(
                    'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING id',
                    [category.name, category.slug, category.description]
                );
                categoryIdsBySlug.set(category.slug, insertedCategory.rows[0].id);
            }
        }

        const existingProducts = await client.query(
            'SELECT id, name FROM products ORDER BY created_at ASC'
        );
        const existingProductsByName = new Map();
        for (const row of existingProducts.rows) {
            if (!existingProductsByName.has(row.name)) {
                existingProductsByName.set(row.name, row.id);
            }
        }

        let insertedCount = 0;
        let updatedCount = 0;

        for (const product of catalogProducts) {
            const categoryId = categoryIdsBySlug.get(product.categorySlug);
            if (!categoryId) {
                throw new Error(`Missing category id for slug ${product.categorySlug}`);
            }

            const existingProductId = existingProductsByName.get(product.name);
            const params = [
                product.name,
                product.species,
                product.description,
                product.priceCents,
                product.stock,
                categoryId,
                product.imageUrls,
                product.taxRate
            ];

            if (existingProductId) {
                await client.query(
                    `UPDATE products
                     SET name = $1,
                         species = $2,
                         description = $3,
                         price_cents = $4,
                         stock = $5,
                         category_id = $6,
                         image_urls = $7,
                         tax_rate = $8,
                         is_active = true,
                         updated_at = NOW()
                     WHERE id = $9`,
                    [...params, existingProductId]
                );
                updatedCount += 1;
            } else {
                await client.query(
                    `INSERT INTO products (name, species, description, price_cents, stock, category_id, image_urls, tax_rate, is_active)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
                    params
                );
                insertedCount += 1;
            }
        }

        const catalogNames = catalogProducts.map((product) => product.name);
        const archivedProducts = await client.query(
            `UPDATE products
             SET is_active = false,
                 updated_at = NOW()
             WHERE name <> ALL($1::text[])
               AND is_active = true
             RETURNING id`,
            [catalogNames]
        );

        await client.query('COMMIT');
        console.log(`Catalog sync completed. Inserted: ${insertedCount}, updated: ${updatedCount}, archived: ${archivedProducts.rowCount}.`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Catalog sync failed:', error);
        process.exitCode = 1;
    } finally {
        client.release();
        await db.poolInstance.end();
    }
};

syncCatalog();
