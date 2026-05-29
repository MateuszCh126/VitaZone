
import * as db from '../server/scripts/db.js';

export const createConsent = async ({ userId, ipAddress, consentType, status }) => {
    const result = await db.query(
        `INSERT INTO legal_consents (user_id, ip_address, consent_type, status) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [userId, ipAddress, consentType, status]
    );
    return result.rows[0];
};

export const getUserConsents = async (userId) => {
    const result = await db.query(
        `SELECT * FROM legal_consents WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );
    return result.rows;
};
