
import * as db from '../server/scripts/db.js';

const buildCartValidationError = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

const getActiveProductForCart = async (clientOrDb, productId) => {
    const result = await clientOrDb.query(
        `SELECT id, name, stock
         FROM products
         WHERE id = $1 AND is_active = true`,
        [productId]
    );

    if (result.rows.length === 0) {
        throw buildCartValidationError('Wybrany produkt jest niedostępny.');
    }

    return result.rows[0];
};

const ensureStockLimit = ({ productName, stock, requestedQuantity }) => {
    if (stock <= 0) {
        throw buildCartValidationError(`Produkt ${productName} jest chwilowo niedostępny.`);
    }

    if (requestedQuantity > stock) {
        throw buildCartValidationError(
            `Nie możesz dodać więcej niż ${stock} szt. produktu ${productName}.`
        );
    }
};

const purgeUnavailableCartItems = async (cartId) => {
    await db.query(
        `DELETE FROM cart_items ci
         WHERE ci.cart_id = $1
           AND NOT EXISTS (
               SELECT 1
               FROM products p
               WHERE p.id = ci.product_id
                 AND p.is_active = true
           )`,
        [cartId]
    );
};

// Get or Create Cart for User
export const getCartByUserId = async (userId) => {
    let result = await db.query(
        `SELECT * FROM carts WHERE user_id = $1`,
        [userId]
    );

    if (result.rows.length === 0) {
        result = await db.query(
            `INSERT INTO carts (user_id) VALUES ($1) RETURNING *`,
            [userId]
        );
    }
    return result.rows[0];
};

export const getCartItems = async (cartId) => {
    await purgeUnavailableCartItems(cartId);

    const result = await db.query(
        `SELECT ci.*, p.name, p.price_cents, p.image_urls 
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.cart_id = $1
           AND p.is_active = true`,
        [cartId]
    );
    return result.rows;
};

export const addItemToCart = async (cartId, productId, quantity) => {
    const product = await getActiveProductForCart(db, productId);
    const currentItemRes = await db.query(
        `SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
        [cartId, productId]
    );
    const currentQuantity = currentItemRes.rows[0]?.quantity || 0;
    const requestedQuantity = currentQuantity + quantity;
    ensureStockLimit({
        productName: product.name,
        stock: product.stock,
        requestedQuantity
    });

    // Upsert logic
    const result = await db.query(
        `INSERT INTO cart_items (cart_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (cart_id, product_id) 
         DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
         RETURNING *`,
        [cartId, productId, quantity]
    );
    return result.rows[0];
};

export const updateItemQuantity = async (cartId, productId, quantity) => {
    if (quantity <= 0) {
        return deleteItemFromCart(cartId, productId);
    }
    const product = await getActiveProductForCart(db, productId);
    ensureStockLimit({
        productName: product.name,
        stock: product.stock,
        requestedQuantity: quantity
    });

    const result = await db.query(
        `UPDATE cart_items SET quantity = $3
         WHERE cart_id = $1 AND product_id = $2
         RETURNING *`,
        [cartId, productId, quantity]
    );
    return result.rows[0];
};

export const deleteItemFromCart = async (cartId, productId) => {
    await db.query(
        `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
        [cartId, productId]
    );
    return { success: true };
};

export const mergeGuestCart = async (userId, guestItems) => {
    const cart = await getCartByUserId(userId);
    const client = await db.poolInstance.connect();

    try {
        await client.query('BEGIN');
        
        for (const item of guestItems) {
            const product = await getActiveProductForCart(client, item.productId);
            const existingRes = await client.query(
                `SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
                [cart.id, item.productId]
            );
            const existingQuantity = existingRes.rows[0]?.quantity || 0;
            const requestedQuantity = existingQuantity + item.quantity;
            ensureStockLimit({
                productName: product.name,
                stock: product.stock,
                requestedQuantity
            });
            await client.query(
                `INSERT INTO cart_items (cart_id, product_id, quantity)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (cart_id, product_id)
                 DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
                `,
                [cart.id, item.productId, item.quantity]
            );
        }
        
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error merging guest cart:', e);
        throw e;
    } finally {
        client.release();
    }
    
    return getCartItems(cart.id);
};

export const clearCart = async (cartId) => {
    await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
};
