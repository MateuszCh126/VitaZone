import * as db from '../server/scripts/db.js';

const mapUser = (row) => {
    if (!row) return null;
    return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        firstName: row.first_name,
        lastName: row.last_name,
        fullName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
        name: `${row.first_name || ''} ${row.last_name || ''}`.trim(), // Alias for backward compatibility
        role: row.role,
        // Flat address fields for backward compatibility (using default address)
        country: row.country || null,
        city: row.city || null,
        postalCode: row.postal_code || null,
        street: row.street || null,
        houseNumber: row.house_number || null,
        apartmentNumber: row.apartment_number || null,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
};

export const findByEmail = async (email) => {
    const query = `
        SELECT u.*, a.street, a.city, a.postal_code, a.country, a.house_number, a.apartment_number
        FROM users u
        LEFT JOIN addresses a ON u.id = a.user_id AND a.is_default = true
        WHERE u.email = $1
          AND u.deleted_at IS NULL
    `;
    const result = await db.query(query, [email]);
    return mapUser(result.rows[0]);
};

export const findById = async (id) => {
    const query = `
        SELECT u.*, a.street, a.city, a.postal_code, a.country, a.house_number, a.apartment_number
        FROM users u
        LEFT JOIN addresses a ON u.id = a.user_id AND a.is_default = true
        WHERE u.id = $1
          AND u.deleted_at IS NULL
    `;
    const result = await db.query(query, [id]);
    return mapUser(result.rows[0]);
};

export const create = async (userData) => {
    const { email, passwordHash, firstName, lastName, role, country, city, postalCode, street, houseNumber, apartmentNumber } = userData;

    // 1. Create User
    const userQuery = `
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, password_hash, first_name, last_name, role, created_at, updated_at
    `;
    const userValues = [email, passwordHash, firstName || null, lastName || null, role || 'user'];
    const userResult = await db.query(userQuery, userValues);
    const user = userResult.rows[0];

    // 2. Create Address (if any address info provided)
    if (country || city || postalCode || street || houseNumber || apartmentNumber) {
        const addressQuery = `
            INSERT INTO addresses (user_id, country, city, postal_code, street, house_number, apartment_number, is_default)
            VALUES ($1, $2, $3, $4, $5, $6, $7, true)
            RETURNING *
        `;
        const addressValues = [user.id, country, city, postalCode, street || null, houseNumber || null, apartmentNumber || null];
        const addressResult = await db.query(addressQuery, addressValues);

        // Merge address into result
        const address = addressResult.rows[0];
        user.country = address.country;
        user.city = address.city;
        user.postal_code = address.postal_code;
        user.street = address.street;
        user.houseNumber = address.house_number;
        user.apartmentNumber = address.apartment_number;
    }

    return mapUser(user);
};

export const updateById = async (id, updateData) => {
    // Separate user fields and address fields
    const userFields = ['email', 'passwordHash', 'firstName', 'lastName', 'role'];
    const addressFields = ['country', 'city', 'postalCode', 'street', 'houseNumber', 'apartmentNumber'];

    // Update User Table
    const userUpdates = {};
    Object.keys(updateData).forEach(key => {
        if (userFields.includes(key)) userUpdates[key] = updateData[key];
    });

    if (Object.keys(userUpdates).length > 0) {
        const keys = Object.keys(userUpdates);
        const setClause = keys.map((key, idx) => {
            const dbCol = key === 'passwordHash' ? 'password_hash' : (
                key === 'firstName' ? 'first_name' : (
                    key === 'lastName' ? 'last_name' : key
                )
            );
            return `${dbCol} = $${idx + 2}`;
        }).join(', ');

        const query = `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1`;
        await db.query(query, [id, ...Object.values(userUpdates)]);
    }

    // Update Address Table (Upsert default)
    // For simplicity, we assume we are updating the default address.
    const hasAddressUpdates = Object.keys(updateData).some(k => addressFields.includes(k));
    if (hasAddressUpdates) {
        const existingAddressRes = await db.query(
            'SELECT id FROM addresses WHERE user_id = $1 AND is_default = true',
            [id]
        );

        const addrUpdates = {};
        if (updateData.country !== undefined) addrUpdates.country = updateData.country;
        if (updateData.city !== undefined) addrUpdates.city = updateData.city;
        if (updateData.postalCode !== undefined) addrUpdates.postal_code = updateData.postalCode;
        if (updateData.street !== undefined) addrUpdates.street = updateData.street;
        if (updateData.houseNumber !== undefined) addrUpdates.house_number = updateData.houseNumber || null;
        if (updateData.apartmentNumber !== undefined) addrUpdates.apartment_number = updateData.apartmentNumber || null;

        if (existingAddressRes.rows.length > 0) {
            // Update
            const keys = Object.keys(addrUpdates);
            if (keys.length > 0) {
                const setClause = keys.map((key, idx) => `${key} = $${idx + 2}`).join(', ');
                const query = `UPDATE addresses SET ${setClause} WHERE user_id = $1 AND is_default = true`;
                await db.query(query, [id, ...Object.values(addrUpdates)]);
            }
        } else {
            // Insert
            const query = `
                INSERT INTO addresses (user_id, country, city, postal_code, street, house_number, apartment_number, is_default)
                VALUES ($1, $2, $3, $4, $5, $6, $7, true)
            `;
            const values = [
                id,
                addrUpdates.country || null,
                addrUpdates.city || null,
                addrUpdates.postal_code || null,
                addrUpdates.street || null,
                addrUpdates.house_number || null,
                addrUpdates.apartment_number || null
            ];
            await db.query(query, values);
        }
    }

    return findById(id); // Return full object
};

export const deleteById = async (id) => {
    // Soft Delete Implementation
    const result = await db.query('UPDATE users SET deleted_at = NOW() WHERE id = $1 RETURNING id', [id]);
    return (result.rowCount || 0) > 0;
};

export const updateLastActive = async (id) => {
    const query = 'UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = $1';
    await db.query(query, [id]);
};

export const softDeleteUser = async (id) => {
    const result = await db.query(
        'UPDATE users SET deleted_at = NOW() WHERE id = $1 RETURNING id, email, role, deleted_at',
        [id]
    );
    return result.rows[0];
};
