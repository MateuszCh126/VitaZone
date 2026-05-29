import express from 'express';
import { track as trackServerEvent } from '@vercel/analytics/server';
import logger from '../server/config/logger.js';
import * as db from '../server/scripts/db.js';
import * as orderRepo from '../repositories/orderRepository.js';
import * as productRepo from '../repositories/productRepository.js';
import * as userRepo from '../repositories/userRepository.js';
import * as discountRepo from '../repositories/discountRepository.js';
import { ORDER_STATUS, PROCESSING_ORDER_STATUSES } from '../shared/orderStatus.js';
import { UpdateOrderStatusSchema } from '../schemas/orderSchema.js';
import { ProductSchema, ToggleActiveSchema } from '../schemas/productSchema.js';
import { CreateDiscountSchema, UpdateDiscountSchema } from '../schemas/discountSchema.js';
import { sendOrderStatusEmail } from '../server/services/emailService.js';

const router = express.Router();

router.get('/stats', async (req, res) => {
    let client;
    try {
        client = await db.poolInstance.connect();
        const excludedRevenueStatuses = [
            ORDER_STATUS.CANCELLED,
            ORDER_STATUS.PAYMENT_PENDING,
            ORDER_STATUS.REFUNDED
        ];

        const currentMonthQuery = `
            SELECT COALESCE(SUM(total_amount_cents), 0) as sum
            FROM orders
            WHERE status <> ALL($1::text[])
            AND created_at >= date_trunc('month', CURRENT_DATE)
        `;
        const prevMonthQuery = `
            SELECT COALESCE(SUM(total_amount_cents), 0) as sum
            FROM orders
            WHERE status <> ALL($1::text[])
            AND created_at >= date_trunc('month', CURRENT_DATE - interval '1 month')
            AND created_at < date_trunc('month', CURRENT_DATE)
        `;
        const activeUsersQuery = `
            SELECT COUNT(*) as count
            FROM users
            WHERE last_active_at > NOW() - INTERVAL '20 minutes'
        `;
        const processingQuery = `
            SELECT COUNT(*) as count
            FROM orders
            WHERE status = ANY($1::text[])
        `;
        const productsCountQuery = 'SELECT COUNT(*) as count FROM products';

        const [currRes, prevRes, totalRes, userCount, orderCount, recent, activeRes, processingRes, productsRes] = await Promise.all([
            client.query(currentMonthQuery, [excludedRevenueStatuses]),
            client.query(prevMonthQuery, [excludedRevenueStatuses]),
            client.query('SELECT COALESCE(SUM(total_amount_cents), 0) as sum FROM orders WHERE status <> ALL($1::text[])', [excludedRevenueStatuses]),
            client.query('SELECT COUNT(*) FROM users'),
            client.query('SELECT COUNT(*) FROM orders'),
            client.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5'),
            client.query(activeUsersQuery),
            client.query(processingQuery, [PROCESSING_ORDER_STATUSES]),
            client.query(productsCountQuery)
        ]);

        const currentMonthRev = parseFloat(currRes.rows[0].sum) / 100;
        const prevMonthRev = parseFloat(prevRes.rows[0].sum) / 100;
        const totalRevenue = parseFloat(totalRes.rows[0].sum) / 100;

        let growth = 0;
        if (prevMonthRev > 0) {
            growth = ((currentMonthRev - prevMonthRev) / prevMonthRev) * 100;
        } else if (currentMonthRev > 0) {
            growth = 100;
        }

        res.json({
            totalUsers: userCount.rows[0].count,
            activeUsers: activeRes.rows[0].count,
            totalOrders: orderCount.rows[0].count,
            totalRevenue,
            revenueGrowth: growth.toFixed(1),
            recentOrders: recent.rows,
            ordersProcessing: processingRes.rows[0].count,
            totalProducts: productsRes.rows[0].count
        });
    } catch (error) {
        logger.error('Admin stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    } finally {
        if (client) {
            client.release();
        }
    }
});

router.get('/orders', async (req, res) => {
    try {
        const orders = await orderRepo.findAllOrders();
        res.json(orders);
    } catch (error) {
        logger.error('Admin orders fetch error:', error);
        res.status(500).json({ error: 'Nie udało się pobrać zamówień' });
    }
});

router.get('/orders/:id', async (req, res) => {
    try {
        const order = await orderRepo.findAdminOrderById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Nie znaleziono zamówienia' });
        }
        res.json(order);
    } catch (error) {
        logger.error('Admin order details fetch error:', error);
        res.status(500).json({ error: 'Nie udało się pobrać szczegółów zamówienia' });
    }
});

router.patch('/orders/:id', async (req, res) => {
    try {
        const { status } = UpdateOrderStatusSchema.parse(req.body);
        if ([ORDER_STATUS.PAYMENT_PENDING, ORDER_STATUS.REFUNDED].includes(status)) {
            return res.status(400).json({
                error: 'Ten status jest aktualizowany automatycznie przez system płatności.'
            });
        }
        const { order, previousStatus, transitioned } = await orderRepo.updateOrderStatusWithTransition(req.params.id, status);

        if (!order) {
            return res.status(404).json({ error: 'Nie znaleziono zamówienia' });
        }

        if (transitioned) {
            try {
                await sendOrderStatusEmail(order, previousStatus);
            } catch (emailError) {
                logger.error('Failed to send status update email', emailError);
            }

            try {
                await trackServerEvent('order_status_updated', {
                    orderId: order.id.slice(0, 8),
                    previousStatus,
                    status: order.status
                }, { headers: req.headers });
            } catch (trackingError) {
                logger.warn('Failed to track order_status_updated event', trackingError);
            }
        }

        res.json(order);
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Dane formularza są nieprawidłowe', details: error.errors });
        }
        logger.error('Admin order update error:', error);
        res.status(500).json({ error: 'Nie udało się zaktualizować statusu zamówienia' });
    }
});

router.get('/users', async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.created_at,
                   COUNT(o.id) as order_count,
                   COALESCE(SUM(o.total_amount_cents), 0) as total_spent_cents
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            WHERE u.deleted_at IS NULL
            GROUP BY u.id
            ORDER BY total_spent_cents DESC
        `;
        const result = await db.query(query);
        const users = result.rows.map((row) => ({
            id: row.id,
            email: row.email,
            name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Bez Nazwy',
            role: row.role,
            joined: row.created_at,
            orderCount: parseInt(row.order_count, 10),
            totalSpent: parseFloat(row.total_spent_cents) / 100
        }));
        res.json(users);
    } catch (error) {
        logger.error('Admin users fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch user analytics' });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        const result = await userRepo.softDeleteUser(req.params.id);
        if (!result) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User soft deleted', user: result });
    } catch (error) {
        logger.error('Admin user delete error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

router.get('/products', async (req, res) => {
    try {
        const products = await productRepo.getAllAdminProducts();
        res.json(products);
    } catch (error) {
        logger.error('Admin products fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch admin products' });
    }
});

router.post('/products', async (req, res) => {
    try {
        const validatedData = ProductSchema.parse(req.body);
        const product = await productRepo.createProduct(validatedData);
        res.status(201).json(product);
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        logger.error('Admin product create error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

router.put('/products/:id', async (req, res) => {
    try {
        const validatedData = ProductSchema.parse(req.body);
        const product = await productRepo.updateProduct(req.params.id, validatedData);
        res.json(product);
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        logger.error('Admin product update error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

router.delete('/products/:id', async (req, res) => {
    try {
        await productRepo.deleteProduct(req.params.id);
        res.status(204).send();
    } catch (error) {
        logger.error('Admin product delete error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

router.patch('/products/:id/toggle-active', async (req, res) => {
    try {
        const validatedData = ToggleActiveSchema.parse(req.body);
        const result = await productRepo.toggleProductActive(req.params.id, validatedData.isActive);
        res.json(result);
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        logger.error('Admin product toggle error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

router.get('/discounts', async (req, res) => {
    try {
        const discounts = await discountRepo.getAllDiscounts();
        res.json(discounts);
    } catch (error) {
        logger.error('Admin discounts fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch discounts' });
    }
});

router.post('/discounts', async (req, res) => {
    try {
        const validatedData = CreateDiscountSchema.parse(req.body);
        const discount = await discountRepo.createDiscount(validatedData);
        res.status(201).json(discount);
    } catch (error) {
        if (error.message === 'DUPLICATE_CODE') {
            return res.status(409).json({ error: 'Discount code already exists' });
        }
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        logger.error('Admin discount create error:', error);
        res.status(500).json({ error: 'Failed to create discount' });
    }
});

router.put('/discounts/:id', async (req, res) => {
    try {
        const validatedData = UpdateDiscountSchema.parse(req.body);
        const discount = await discountRepo.updateDiscount(req.params.id, validatedData);
        if (!discount) {
            return res.status(404).json({ error: 'Discount not found' });
        }
        res.json(discount);
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        logger.error('Admin discount update error:', error);
        res.status(500).json({ error: 'Failed to update discount' });
    }
});

router.delete('/discounts/:id', async (req, res) => {
    try {
        await discountRepo.deleteDiscount(req.params.id);
        res.status(204).send();
    } catch (error) {
        logger.error('Admin discount delete error:', error);
        res.status(500).json({ error: 'Failed to delete discount (might be in use)' });
    }
});

export default router;
