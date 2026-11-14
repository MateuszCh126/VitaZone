import * as db from '../server/scripts/db.js';

const PRODUCT_COLUMNS = `
    id, name, description, image_urls, stock, price_cents, is_active, specs,
    CAST(tax_rate AS FLOAT) AS tax_rate
`;

const parseProject = (row) => row ? {
    ...row,
    configuration: row.configuration_json,
    estimate: row.estimate_json,
    quote: row.quote_json
} : null;

const getProjectProducts = async (project) => {
    if (!project) return [];
    const ids = [...new Set([
        project.configuration_json?.enclosureProductId,
        ...(project.configuration_json?.objects || []).map((item) => item.productId)
    ].filter(Boolean))];
    if (ids.length === 0) return [];
    const result = await db.query(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ANY($1::uuid[])`, [ids]);
    return result.rows;
};

export const listConfiguratorProducts = async () => {
    const result = await db.query(`
        SELECT ${PRODUCT_COLUMNS}
        FROM products
        WHERE is_active = true AND stock > 0 AND price_cents > 0
          AND specs ? 'terrariumDesigner'
        ORDER BY name ASC
    `);
    return result.rows;
};

export const getProductsByIds = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const result = await db.query(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ANY($1::uuid[])`, [ids]);
    return result.rows;
};

export const createProject = async ({ userId, configuration, estimate }) => {
    const result = await db.query(`
        INSERT INTO terrarium_projects (
            user_id, status, configuration_version, configuration_json,
            estimate_json, estimate_total_cents
        ) VALUES ($1, 'submitted', $2, $3, $4, $5)
        RETURNING *
    `, [userId, configuration.version, configuration, estimate, estimate.totalCents]);
    return parseProject(result.rows[0]);
};

export const findProjectsByUser = async (userId) => {
    const result = await db.query(`
        SELECT * FROM terrarium_projects
        WHERE user_id = $1
        ORDER BY created_at DESC
    `, [userId]);
    return result.rows.map(parseProject);
};

export const findProjectByUser = async (projectId, userId) => {
    const result = await db.query(`
        SELECT * FROM terrarium_projects
        WHERE id = $1 AND user_id = $2
    `, [projectId, userId]);
    return parseProject(result.rows[0]);
};

export const findProjectDetailByUser = async (projectId, userId) => {
    const project = await findProjectByUser(projectId, userId);
    if (!project) return null;
    return { ...project, products: await getProjectProducts(project) };
};

export const findAllProjects = async () => {
    const result = await db.query(`
        SELECT p.*, u.email AS customer_email,
               CONCAT_WS(' ', u.first_name, u.last_name) AS customer_name
        FROM terrarium_projects p
        JOIN users u ON u.id = p.user_id
        ORDER BY CASE p.status WHEN 'submitted' THEN 0 WHEN 'quoted' THEN 1 ELSE 2 END,
                 p.created_at DESC
    `);
    return result.rows.map(parseProject);
};

export const findAdminProject = async (projectId) => {
    const result = await db.query(`
        SELECT p.*, u.email AS customer_email,
               CONCAT_WS(' ', u.first_name, u.last_name) AS customer_name
        FROM terrarium_projects p
        JOIN users u ON u.id = p.user_id
        WHERE p.id = $1
    `, [projectId]);
    const project = parseProject(result.rows[0]);
    if (!project) return null;
    return { ...project, products: await getProjectProducts(project) };
};

export const updateAdminQuote = async ({ projectId, adminUserId, quote, validUntil, message }) => {
    const result = await db.query(`
        UPDATE terrarium_projects
        SET status = 'quoted',
            admin_user_id = $2,
            quote_json = $3,
            quote_total_cents = $4,
            quote_version = quote_version + 1,
            quote_message = $5,
            quote_expires_at = $6,
            accepted_at = NULL,
            checkout_attempt = 0,
            order_id = NULL,
            stripe_session_id = NULL,
            updated_at = NOW()
        WHERE id = $1 AND status IN ('submitted', 'quoted')
        RETURNING *
    `, [projectId, adminUserId, quote, quote.totalCents, message, validUntil]);
    return parseProject(result.rows[0]);
};

export const acceptProjectQuote = async (projectId, userId) => {
    const result = await db.query(`
        UPDATE terrarium_projects
        SET status = 'accepted', accepted_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND status = 'quoted'
          AND quote_expires_at > NOW() AND quote_json IS NOT NULL
        RETURNING *
    `, [projectId, userId]);
    return parseProject(result.rows[0]);
};

export const claimProjectCheckout = async (projectId, userId) => {
    const result = await db.query(`
        UPDATE terrarium_projects
        SET status = 'payment_pending',
            checkout_attempt = CASE
                WHEN status = 'accepted' THEN checkout_attempt + 1
                ELSE checkout_attempt
            END,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
          AND quote_expires_at > NOW() AND quote_json IS NOT NULL
          AND (
              status = 'accepted'
              OR (
                  status = 'payment_pending'
                  AND stripe_session_id IS NULL
                  AND updated_at < NOW() - INTERVAL '5 minutes'
              )
          )
        RETURNING *
    `, [projectId, userId]);
    return parseProject(result.rows[0]);
};

export const attachProjectCheckout = async ({ projectId, userId, orderId, sessionId }) => {
    const result = await db.query(`
        UPDATE terrarium_projects
        SET order_id = $3, stripe_session_id = $4, updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND status = 'payment_pending'
        RETURNING *
    `, [projectId, userId, orderId, sessionId]);
    return parseProject(result.rows[0]);
};

export const resetProjectCheckout = async (projectId) => {
    const result = await db.query(`
        UPDATE terrarium_projects
        SET status = 'accepted', order_id = NULL, stripe_session_id = NULL, updated_at = NOW()
        WHERE id = $1 AND status = 'payment_pending'
        RETURNING id
    `, [projectId]);
    return result.rowCount > 0;
};

export const resetProjectCheckoutByOrder = async (orderId) => {
    const result = await db.query(`
        UPDATE terrarium_projects
        SET status = 'accepted', order_id = NULL, stripe_session_id = NULL, updated_at = NOW()
        WHERE order_id = $1 AND status = 'payment_pending'
        RETURNING id
    `, [orderId]);
    return result.rowCount > 0;
};

export const markProjectPaidByOrder = async (orderId) => {
    const result = await db.query(`
        UPDATE terrarium_projects
        SET status = 'paid', updated_at = NOW()
        WHERE order_id = $1 AND status = 'payment_pending'
        RETURNING id
    `, [orderId]);
    return result.rows[0] || null;
};
