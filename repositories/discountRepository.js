import * as db from '../server/scripts/db.js';

export const createDiscount = async (data) => {
    const { code, type, value, startsAt, expiresAt, usageLimit, isActive } = data;
    const query = `
        INSERT INTO discount_codes (code, type, value, starts_at, expires_at, usage_limit, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `;
    const values = [
        code, type, value,
        startsAt || new Date(),
        expiresAt || null,
        usageLimit || null,
        isActive !== undefined ? isActive : true
    ];

    try {
        const res = await db.query(query, values);
        return res.rows[0];
    } catch (e) {
        if (e.constraint === 'discount_codes_code_key') {
            throw new Error('DUPLICATE_CODE');
        }
        throw e;
    }
};

export const getDiscountByCode = async (code) => {
    const query = `SELECT * FROM discount_codes WHERE code = $1`;
    const res = await db.query(query, [code]);
    return res.rows[0];
};

export const getAllDiscounts = async () => {
    const query = `SELECT * FROM discount_codes ORDER BY created_at DESC`;
    const res = await db.query(query);
    return res.rows;
};

export const updateDiscount = async (id, data) => {
    // Only allow updating certain fields to prevent breaking history logic if code already used
    // Actually, allowing change of expires_at, usage_limit, is_active is standard.
    // Changing value or type might be risky if code was used, but for MVP it's OK.

    const fields = [];
    const values = [];
    let idx = 1;

    // Helper to build dynamic query
    const addField = (col, val) => {
        if (val !== undefined) {
            fields.push(`${col} = $${idx++}`);
            values.push(val);
        }
    };

    addField('is_active', data.isActive);
    addField('starts_at', data.startsAt);
    addField('expires_at', data.expiresAt);
    addField('usage_limit', data.usageLimit);

    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE discount_codes SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;

    const res = await db.query(query, values);
    return res.rows[0];
};

export const deleteDiscount = async (id) => {
    // Soft delete usually better, but requirements said "delete". 
    // Given we have FK in orders, we should probably soft delete or just toggle active.
    // Let's implement HARD delete but it will fail if FK exists (which is good safety).
    const query = `DELETE FROM discount_codes WHERE id = $1 RETURNING id`;
    const res = await db.query(query, [id]);
    return res.rows[0];
};

export const validateDiscountClientSide = async (code, cartTotal) => {
    const discount = await getDiscountByCode(code);
    const invalidResult = { valid: false, error: 'Discount code is invalid or unavailable' };

    if (!discount) return invalidResult;
    if (!discount.is_active) return invalidResult;

    const now = new Date();
    if (new Date(discount.starts_at) > now) return invalidResult;
    if (discount.expires_at && new Date(discount.expires_at) < now) return invalidResult;

    if (discount.usage_limit !== null && discount.usage_count >= discount.usage_limit) {
        return invalidResult;
    }

    // Determine discount amount
    let discountAmount = 0;
    if (discount.type === 'fixed') {
        discountAmount = discount.value; // value is in cents
    } else {
        discountAmount = Math.round(cartTotal * (discount.value / 100));
    }

    // Cap discount at cart total (no negative total)
    if (discountAmount > cartTotal) discountAmount = cartTotal;

    return {
        valid: true,
        discount: {
            code: discount.code,
            type: discount.type,
            value: discount.value,
            amount: discountAmount
        }
    };
};
