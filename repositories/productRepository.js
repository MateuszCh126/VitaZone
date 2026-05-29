import * as db from '../server/scripts/db.js';

export const getAllProducts = async (page = 1, limit = 50) => {
    const offset = (page - 1) * limit;
    const query = `
        SELECT p.id, p.name, p.species, p.description, p.image_urls, p.stock, p.category_id, p.specs, p.is_active,
               p.price_cents,
               CAST(p.price_cents AS FLOAT) / 100 as price, 
               CAST(p.tax_rate AS FLOAT) as tax_rate,
               c.name as category_name 
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = true
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2
    `;
    const result = await db.query(query, [limit, offset]);
    return result.rows;
};

export const getAllAdminProducts = async () => {
    const query = `
        SELECT p.id, p.name, p.species, p.description, p.image_urls, p.stock, p.category_id, p.specs, p.is_active,
               p.price_cents,
               CAST(p.price_cents AS FLOAT) / 100 as price, 
               CAST(p.tax_rate AS FLOAT) as tax_rate,
               c.name as category_name 
        FROM products p
        JOIN categories c ON p.category_id = c.id
        ORDER BY p.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
};

export const getProductsByCategory = async (categorySlug) => {
    const query = `
        SELECT p.id, p.name, p.species, p.description, p.image_urls, p.stock, p.category_id, p.specs, p.is_active,
               p.price_cents,
               CAST(p.price_cents AS FLOAT) / 100 as price,
               CAST(p.tax_rate AS FLOAT) as tax_rate,
               c.name as category_name 
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE c.slug = $1 AND p.is_active = true
    `;
    const result = await db.query(query, [categorySlug]);
    return result.rows;
};

export const getProductById = async (id) => {
    const query = `
        SELECT p.id, p.name, p.species, p.description, p.image_urls, p.stock, p.category_id, p.specs, p.is_active,
               p.price_cents, 
               CAST(p.price_cents AS FLOAT) / 100 as price,
               CAST(p.tax_rate AS FLOAT) as tax_rate,
               c.name as category_name 
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
};

export const getPublicProductById = async (id) => {
    const query = `
        SELECT p.id, p.name, p.species, p.description, p.image_urls, p.stock, p.category_id, p.specs, p.is_active,
               p.price_cents,
               CAST(p.price_cents AS FLOAT) / 100 as price,
               CAST(p.tax_rate AS FLOAT) as tax_rate,
               c.name as category_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = $1 AND p.is_active = true
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
};

export const createProduct = async (productData) => {
    const { name, species, description, price, stock, categoryId, imageUrls, specs, taxRate } = productData;
    const priceCents = Math.round(price * 100);
    const taxRateValue = taxRate !== undefined ? taxRate : 23.00;

    // Ensure image_urls is an array
    const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];

    const query = `
        INSERT INTO products (name, species, description, price_cents, stock, category_id, image_urls, specs, tax_rate)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *, CAST(price_cents AS FLOAT) / 100 as price, CAST(tax_rate AS FLOAT) as tax_rate
    `;
    const values = [name, species, description, priceCents, stock, categoryId, urls, specs, taxRateValue];
    const result = await db.query(query, values);
    return result.rows[0];
};

export const updateProduct = async (id, productData) => {
    const { name, species, description, price, stock, categoryId, imageUrls, specs, taxRate } = productData;
    const priceCents = Math.round(price * 100);
    const taxRateValue = taxRate !== undefined ? taxRate : 23.00;

    // Ensure image_urls is an array
    const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];

    const query = `
        UPDATE products 
        SET name = $1, species = $2, description = $3, price_cents = $4, 
            stock = $5, category_id = $6, image_urls = $7, specs = $8, tax_rate = $9, updated_at = NOW()
        WHERE id = $10
        RETURNING *, CAST(price_cents AS FLOAT) / 100 as price, CAST(tax_rate AS FLOAT) as tax_rate
    `;
    const values = [name, species, description, priceCents, stock, categoryId, urls, specs, taxRateValue, id];
    const result = await db.query(query, values);
    return result.rows[0];
};

export const deleteProduct = async (id) => {
    const query = 'DELETE FROM products WHERE id = $1 RETURNING id';
    try {
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    } catch (e) {
        console.warn('Hard delete failed, fallback to soft delete.');
        const softQuery = 'UPDATE products SET is_active = false WHERE id = $1 RETURNING id';
        const softResult = await db.query(softQuery, [id]);
        return (softResult.rowCount || 0) > 0;
    }
};

export const toggleProductActive = async (id, isActive) => {
    const query = 'UPDATE products SET is_active = $2 WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id, isActive]);
    return result.rows[0];
};

export const getAllCategories = async () => {
    const query = 'SELECT * FROM categories ORDER BY name ASC';
    const result = await db.query(query);
    return result.rows;
};

export const searchSpecies = async (queryTerm) => {
    const query = `
        SELECT DISTINCT species 
        FROM products 
        WHERE species ILIKE $1 AND is_active = true 
        LIMIT 5
    `;
    const result = await db.query(query, [`%${queryTerm}%`]);
    return result.rows.map(row => row.species).filter(Boolean);
};
