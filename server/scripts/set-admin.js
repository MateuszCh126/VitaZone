import * as db from './db.js';

async function setAdmin(email) {
    try {
        const result = await db.query("UPDATE users SET role = 'admin' WHERE email = $1 RETURNING id, email, role", [email]);
        if (result.rows.length > 0) {
            console.log(`✅ Admin role granted to: ${result.rows[0].email}`);
        } else {
            console.log(`❌ User not found: ${email}`);
        }
    } catch (error) {
        console.error('❌ Failed to update role', error);
    } finally {
        process.exit();
    }
}

const email = process.argv[2];
if (!email) {
    console.error('Usage: node server/scripts/set-admin.js <email>');
    process.exit(1);
}

setAdmin(email);
