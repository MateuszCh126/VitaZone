import * as db from '../server/scripts/db.js';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_SHIPPING_AMOUNT_CENTS } from '../shared/commerce.js';
import { ORDER_STATUS } from '../shared/orderStatus.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
let orderSchemaSupportPromise = null;

const loadOrderSchemaSupport = async () => {
    const result = await db.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'order_items'
    `);

    const columns = new Set(result.rows.map((row) => row.column_name));

    return {
        hasProductNameSnapshot: columns.has('product_name_snapshot'),
        hasTaxRateSnapshot: columns.has('tax_rate_snapshot')
    };
};

const getOrderSchemaSupport = async () => {
    if (!orderSchemaSupportPromise) {
        orderSchemaSupportPromise = loadOrderSchemaSupport().catch((error) => {
            orderSchemaSupportPromise = null;
            throw error;
        });
    }

    return orderSchemaSupportPromise;
};

const calculateDiscountAmountCents = (discount, subtotalCents) => {
    if (!discount) return 0;

    const rawAmount = discount.type === 'fixed'
        ? discount.value
        : Math.round(subtotalCents * (discount.value / 100));

    return Math.min(rawAmount, subtotalCents);
};

const buildAddressSnapshot = ({
    fullName,
    email,
    country,
    city,
    postalCode,
    street,
    houseNumber,
    apartmentNumber
}) => ({
    full_name: fullName || null,
    email: email || null,
    country,
    city,
    postal_code: postalCode,
    street,
    house_number: houseNumber,
    apartment_number: apartmentNumber || null
});

const buildOrderItemsAggregate = (schemaSupport) => {
    const productNameExpression = schemaSupport.hasProductNameSnapshot
        ? "COALESCE(oi.product_name_snapshot, p.name, 'Produkt usuniety')"
        : "COALESCE(p.name, 'Produkt usuniety')";

    return `
        COALESCE(
            json_agg(
                json_build_object(
                    'id', oi.id,
                    'quantity', oi.quantity,
                    'price', CAST(oi.price_at_purchase_cents AS FLOAT) / 100,
                    'price_cents', oi.price_at_purchase_cents,
                    'product_id', oi.product_id,
                    'name', ${productNameExpression}
                )
                ORDER BY oi.id
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::json
        ) AS items
    `;
};

const buildOrderItemInsertQuery = (schemaSupport) => {
    const columns = [
        'order_id',
        'product_id',
        'quantity',
        'price_at_purchase_cents'
    ];

    if (schemaSupport.hasProductNameSnapshot) {
        columns.push('product_name_snapshot');
    }

    if (schemaSupport.hasTaxRateSnapshot) {
        columns.push('tax_rate_snapshot');
    }

    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

    return `
        INSERT INTO order_items (
            ${columns.join(', ')}
        )
        VALUES (${placeholders})
    `;
};

const buildOrderItemInsertValues = (schemaSupport, orderId, item) => {
    const values = [
        orderId,
        item.productId,
        item.quantity,
        item.priceAtPurchaseCents
    ];

    if (schemaSupport.hasProductNameSnapshot) {
        values.push(item.productNameSnapshot);
    }

    if (schemaSupport.hasTaxRateSnapshot) {
        values.push(item.taxRateSnapshot);
    }

    return values;
};

const loadDiscountForUpdate = async (client, discountCode) => {
    const discountRes = await client.query(
        'SELECT * FROM discount_codes WHERE code = $1 AND is_active = true FOR UPDATE',
        [discountCode]
    );

    if (discountRes.rows.length === 0) {
        throw new Error(`Invalid or inactive discount code: ${discountCode}`);
    }

    const discount = discountRes.rows[0];
    const now = new Date();

    if (new Date(discount.starts_at) > now) throw new Error('Discount code not yet active');
    if (discount.expires_at && new Date(discount.expires_at) < now) throw new Error('Discount code expired');
    if (discount.usage_limit !== null && discount.usage_count >= discount.usage_limit) {
        throw new Error('Discount usage limit reached');
    }

    await client.query('UPDATE discount_codes SET usage_count = usage_count + 1 WHERE id = $1', [discount.id]);
    return discount;
};

export const createOrder = async (orderData) => {
    const {
        userId,
        paymentMethod,
        paymentId = null,
        items,
        fullName,
        email,
        country,
        city,
        postalCode,
        street,
        houseNumber,
        apartmentNumber,
        idempotencyKey,
        discountCode,
        initialStatus = ORDER_STATUS.PENDING,
        shippingAmountCents = DEFAULT_SHIPPING_AMOUNT_CENTS
    } = orderData;

    const orderId = uuidv4();
    const client = await db.poolInstance.connect();
    const schemaSupport = await getOrderSchemaSupport();

    try {
        let attempts = 0;
        while (attempts < 3) {
            attempts++;

            try {
                await client.query('BEGIN');

                if (idempotencyKey) {
                    const existing = await client.query(
                        'SELECT id FROM orders WHERE idempotency_key = $1',
                        [idempotencyKey]
                    );

                    if (existing.rows.length > 0) {
                        await client.query('ROLLBACK');
                        return await findById(existing.rows[0].id);
                    }
                }

                let discountId = null;
                let activeDiscount = null;

                if (discountCode) {
                    activeDiscount = await loadDiscountForUpdate(client, discountCode);
                    discountId = activeDiscount.id;
                }

                let itemsSubtotalCents = 0;
                const verifiedItems = [];

                for (const item of items) {
                    const stockCheck = await client.query(
                        'SELECT stock, price_cents, name, tax_rate, is_active FROM products WHERE id = $1 FOR UPDATE',
                        [item.productId]
                    );

                    if (stockCheck.rows.length === 0) throw new Error(`Nie znaleziono produktu ${item.productId}`);

                    const product = stockCheck.rows[0];
                    if (!product.is_active) {
                        throw new Error(`Produkt ${product.name} jest niedostępny`);
                    }
                    if (product.stock < item.quantity) {
                        throw new Error(`Brak wystarczającej ilości produktu ${product.name}`);
                    }

                    itemsSubtotalCents += product.price_cents * item.quantity;
                    verifiedItems.push({
                        productId: item.productId,
                        quantity: item.quantity,
                        priceAtPurchaseCents: product.price_cents,
                        productNameSnapshot: product.name,
                        taxRateSnapshot: product.tax_rate
                    });

                    await client.query(
                        'UPDATE products SET stock = stock - $1 WHERE id = $2',
                        [item.quantity, item.productId]
                    );
                }

                const discountAmountCents = calculateDiscountAmountCents(activeDiscount, itemsSubtotalCents);
                const finalTotalCents = itemsSubtotalCents + shippingAmountCents - discountAmountCents;

                if (finalTotalCents <= 0) {
                    throw new Error('Kwota zamówienia musi być większa niż zero');
                }

                const addressSnapshot = buildAddressSnapshot({
                    fullName,
                    email,
                    country,
                    city,
                    postalCode,
                    street,
                    houseNumber,
                    apartmentNumber
                });

                const orderResult = await client.query(`
                    INSERT INTO orders (
                        id,
                        user_id,
                        total_amount_cents,
                        payment_method,
                        status,
                        payment_id,
                        shipping_address_json,
                        idempotency_key,
                        discount_code_id,
                        discount_amount_cents
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING *,
                        CAST(total_amount_cents AS FLOAT) / 100 AS total_amount
                `, [
                    orderId,
                    userId,
                    finalTotalCents,
                    paymentMethod,
                    initialStatus,
                    paymentId,
                    addressSnapshot,
                    idempotencyKey || null,
                    discountId,
                    discountAmountCents
                ]);

                for (const item of verifiedItems) {
                    await client.query(
                        buildOrderItemInsertQuery(schemaSupport),
                        buildOrderItemInsertValues(schemaSupport, orderId, item)
                    );
                }

                await client.query('COMMIT');
                return orderResult.rows[0];
            } catch (error) {
                await client.query('ROLLBACK');

                if (error.code === '40P01' || error.code === '40001') {
                    if (attempts === 3) throw error;
                    await sleep(100 * Math.pow(2, attempts));
                    continue;
                }

                throw error;
            }
        }

        throw new Error('Failed to create order after retries');
    } finally {
        client.release();
    }
};

export const findByUserId = async (userId) => {
    const schemaSupport = await getOrderSchemaSupport();
    const result = await db.query(`
        SELECT
            o.id,
            o.user_id,
            o.status,
            o.payment_method,
            o.payment_id,
            o.discount_amount_cents,
            o.created_at,
            CAST(o.total_amount_cents AS FLOAT) / 100 AS total_amount,
            ${buildOrderItemsAggregate(schemaSupport)}
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `, [userId]);

    return result.rows;
};

export const findById = async (orderId) => {
    const schemaSupport = await getOrderSchemaSupport();
    const result = await db.query(`
        SELECT
            o.id,
            o.user_id,
            o.status,
            o.payment_method,
            o.payment_id,
            o.discount_amount_cents,
            o.shipping_address_json,
            o.created_at,
            CAST(o.total_amount_cents AS FLOAT) / 100 AS total_amount,
            ${buildOrderItemsAggregate(schemaSupport)}
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.id = $1
        GROUP BY o.id
    `, [orderId]);

    return result.rows[0] || null;
};

export const findAllOrders = async () => {
    const schemaSupport = await getOrderSchemaSupport();
    const result = await db.query(`
        SELECT
            o.id,
            o.user_id,
            o.status,
            o.payment_method,
            o.payment_id,
            o.shipping_address_json,
            o.created_at,
            CAST(o.total_amount_cents AS FLOAT) / 100 AS total_amount,
            u.email AS user_email,
            ${buildOrderItemsAggregate(schemaSupport)}
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        GROUP BY o.id, u.email
        ORDER BY o.created_at DESC
    `);

    return result.rows;
};

export const findAdminOrderById = async (orderId) => {
    const schemaSupport = await getOrderSchemaSupport();
    const result = await db.query(`
        SELECT
            o.id,
            o.user_id,
            o.status,
            o.payment_method,
            o.payment_id,
            o.discount_amount_cents,
            o.shipping_address_json,
            o.created_at,
            CAST(o.total_amount_cents AS FLOAT) / 100 AS total_amount,
            u.email AS user_email,
            u.first_name,
            u.last_name,
            ${buildOrderItemsAggregate(schemaSupport)}
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.id = $1
        GROUP BY o.id, u.email, u.first_name, u.last_name
    `, [orderId]);

    return result.rows[0] || null;
};

export const updateOrderStatus = async (orderId, status, paymentId = null) => {
    const result = await db.query(`
        UPDATE orders
        SET status = $1,
            payment_id = COALESCE($2, payment_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *,
            CAST(total_amount_cents AS FLOAT) / 100 AS total_amount
    `, [status, paymentId, orderId]);

    return result.rows[0];
};

export const updateOrderStatusWithTransition = async (orderId, status, paymentId = null) => {
    const before = await findById(orderId);
    if (!before) {
        return { order: null, previousStatus: null, transitioned: false };
    }

    const updated = await updateOrderStatus(orderId, status, paymentId);

    return {
        order: await findById(orderId),
        previousStatus: before.status,
        transitioned: before.status !== updated?.status
    };
};

export const attachPaymentReference = async (orderId, paymentId) => {
    const result = await db.query(`
        UPDATE orders
        SET payment_id = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, payment_id, status
    `, [paymentId, orderId]);

    return result.rows[0] || null;
};

export const findByPaymentId = async (paymentId) => {
    const result = await db.query('SELECT id FROM orders WHERE payment_id = $1 LIMIT 1', [paymentId]);
    if (result.rows.length === 0) return null;
    return findById(result.rows[0].id);
};

export const markOrderPaid = async (orderId, paymentId = null) => {
    const client = await db.poolInstance.connect();

    try {
        await client.query('BEGIN');

        const currentOrder = await client.query(`
            SELECT id, status
            FROM orders
            WHERE id = $1
            FOR UPDATE
        `, [orderId]);

        if (currentOrder.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        const currentStatus = currentOrder.rows[0].status;
        if ([ORDER_STATUS.CANCELLED, ORDER_STATUS.COMPLETED, ORDER_STATUS.REFUNDED].includes(currentStatus)) {
            await client.query('COMMIT');
            return findById(orderId);
        }

        const nextStatus = currentStatus === ORDER_STATUS.PAYMENT_PENDING
            ? ORDER_STATUS.PENDING
            : currentStatus;

        await client.query(`
            UPDATE orders
            SET status = $1,
                payment_id = COALESCE($2, payment_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [nextStatus, paymentId, orderId]);

        await client.query('COMMIT');
        return findById(orderId);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const markOrderPaidWithTransition = async (orderId, paymentId = null) => {
    const client = await db.poolInstance.connect();

    try {
        await client.query('BEGIN');

        const currentOrder = await client.query(`
            SELECT id, status
            FROM orders
            WHERE id = $1
            FOR UPDATE
        `, [orderId]);

        if (currentOrder.rows.length === 0) {
            await client.query('ROLLBACK');
            return { order: null, previousStatus: null, transitioned: false };
        }

        const previousStatus = currentOrder.rows[0].status;
        if ([ORDER_STATUS.CANCELLED, ORDER_STATUS.COMPLETED, ORDER_STATUS.REFUNDED].includes(previousStatus)) {
            await client.query('COMMIT');
            return {
                order: await findById(orderId),
                previousStatus,
                transitioned: false
            };
        }

        const nextStatus = previousStatus === ORDER_STATUS.PAYMENT_PENDING
            ? ORDER_STATUS.PENDING
            : previousStatus;

        await client.query(`
            UPDATE orders
            SET status = $1,
                payment_id = COALESCE($2, payment_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [nextStatus, paymentId, orderId]);

        await client.query('COMMIT');
        return {
            order: await findById(orderId),
            previousStatus,
            transitioned: previousStatus !== nextStatus
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const releasePendingOrder = async (orderId, paymentId = null) => {
    const client = await db.poolInstance.connect();

    try {
        await client.query('BEGIN');

        const orderRes = await client.query(`
            SELECT id, status, discount_code_id
            FROM orders
            WHERE id = $1
            FOR UPDATE
        `, [orderId]);

        if (orderRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        const order = orderRes.rows[0];
        if (order.status !== ORDER_STATUS.PAYMENT_PENDING) {
            await client.query('COMMIT');
            return findById(orderId);
        }

        const itemsRes = await client.query(
            'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
            [orderId]
        );

        for (const item of itemsRes.rows) {
            await client.query(
                'UPDATE products SET stock = stock + $1 WHERE id = $2',
                [item.quantity, item.product_id]
            );
        }

        if (order.discount_code_id) {
            await client.query(`
                UPDATE discount_codes
                SET usage_count = GREATEST(usage_count - 1, 0)
                WHERE id = $1
            `, [order.discount_code_id]);
        }

        await client.query(`
            UPDATE orders
            SET status = $1,
                payment_id = COALESCE($2, payment_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [ORDER_STATUS.CANCELLED, paymentId, orderId]);

        await client.query('COMMIT');
        return findById(orderId);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const markOrderRefundedByPaymentId = async (paymentId) => {
    const order = await findByPaymentId(paymentId);
    if (!order) return null;

    const currentStatus = order.status;
    if ([ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED].includes(currentStatus)) {
        return order;
    }

    return updateOrderStatus(order.id, ORDER_STATUS.REFUNDED, paymentId);
};

export const cancelOrder = async (orderId, userId) => {
    const client = await db.poolInstance.connect();

    try {
        await client.query('BEGIN');

        const checkRes = await client.query(`
            SELECT status
            FROM orders
            WHERE id = $1 AND user_id = $2
            FOR UPDATE
        `, [orderId, userId]);

        if (checkRes.rows.length === 0) {
            throw new Error('Nie znaleziono zamówienia lub brak dostępu');
        }

        const currentStatus = checkRes.rows[0].status;
        const allowedStatuses = [ORDER_STATUS.PENDING, ORDER_STATUS.ACCEPTED];

        if (!allowedStatuses.includes(currentStatus)) {
            throw new Error('Tego zamówienia nie można anulować na tym etapie');
        }

        const itemsRes = await client.query(
            'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
            [orderId]
        );

        for (const item of itemsRes.rows) {
            await client.query(
                'UPDATE products SET stock = stock + $1 WHERE id = $2',
                [item.quantity, item.product_id]
            );
        }

        const updateRes = await client.query(`
            UPDATE orders
            SET status = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *,
                CAST(total_amount_cents AS FLOAT) / 100 AS total_amount
        `, [ORDER_STATUS.CANCELLED, orderId]);

        await client.query('COMMIT');
        return updateRes.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
