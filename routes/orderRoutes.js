import express from 'express';
import env from '../server/config/env.js';
import logger from '../server/config/logger.js';
import * as orderRepo from '../repositories/orderRepository.js';
import { CreateOrderSchema } from '../schemas/orderSchema.js';
import { sendOrderStatusEmail } from '../server/services/emailService.js';

const createOrderRoutes = ({ orderLimiter }) => {
    const router = express.Router();

    router.post('/', orderLimiter, async (req, res) => {
        try {
            if (!env.ALLOW_MANUAL_ORDER_CREATION) {
                return res.status(410).json({
                    error: 'Ręczne tworzenie zamówień jest wyłączone. Użyj płatności Stripe Checkout.'
                });
            }

            const validatedData = CreateOrderSchema.parse(req.body);
            const idempotencyKey = req.headers['idempotency-key'];
            if (idempotencyKey && (typeof idempotencyKey !== 'string' || idempotencyKey.length > 128)) {
                return res.status(400).json({ error: 'Nieprawidłowy klucz idempotencji' });
            }

            if (req.user.id !== validatedData.userId) {
                return res.status(403).json({ error: 'Brak dostępu: nie możesz tworzyć zamówienia dla innego użytkownika' });
            }

            const newOrder = await orderRepo.createOrder({
                userId: validatedData.userId,
                items: validatedData.items,
                totalAmount: validatedData.total,
                paymentMethod: 'manual',
                country: validatedData.shipping.country,
                city: validatedData.shipping.city,
                postalCode: validatedData.shipping.postal_code,
                street: validatedData.shipping.street,
                houseNumber: validatedData.shipping.house_number,
                apartmentNumber: validatedData.shipping.apartment_number,
                idempotencyKey,
                discountCode: validatedData.discountCode
            });
            res.status(201).json(newOrder);
        } catch (error) {
            if (error.name === 'ZodError') {
                return res.status(400).json({ error: 'Dane formularza są nieprawidłowe', details: error.errors });
            }
            const badRequestPatterns = [
                'Nie znaleziono',
                'niedostępny',
                'Brak wystarczającej ilości',
                'nie można anulować',
                'Invalid or inactive discount code',
                'Discount code not yet active',
                'Discount code expired',
                'Discount usage limit reached'
            ];
            if (badRequestPatterns.some((pattern) => error.message.includes(pattern))) {
                return res.status(400).json({ error: error.message });
            }
            logger.error('Order error:', error);
            res.status(500).json({ error: 'Wystąpił błąd serwera podczas tworzenia zamówienia' });
        }
    });

    router.get('/user/:userId', async (req, res) => {
        try {
            if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Brak dostępu' });
            }

            const orders = await orderRepo.findByUserId(req.params.userId);
            res.json(orders);
        } catch (error) {
            logger.error('Fetch user orders error:', error);
            res.status(500).json({ error: 'Nie udało się pobrać zamówień' });
        }
    });

    router.get('/:id', async (req, res) => {
        try {
            const order = await orderRepo.findById(req.params.id);
            if (!order) {
                return res.status(404).json({ error: 'Nie znaleziono zamówienia' });
            }

            if (req.user.id !== order.user_id && req.user.role !== 'admin') {
                logger.warn(`IDOR Attempt: User ${req.user.id} tried to access order ${order.id}`);
                return res.status(403).json({ error: 'Brak dostępu' });
            }

            res.json(order);
        } catch (error) {
            logger.error('Fetch order error:', error);
            res.status(500).json({ error: 'Nie udało się pobrać zamówienia' });
        }
    });

    router.patch('/:id/cancel', async (req, res) => {
        try {
            const existingOrder = await orderRepo.findById(req.params.id);
            const cancelledOrder = await orderRepo.cancelOrder(req.params.id, req.user.id);
            if (cancelledOrder && existingOrder?.status !== cancelledOrder.status) {
                try {
                    await sendOrderStatusEmail(cancelledOrder, existingOrder?.status || null);
                } catch (emailError) {
                    logger.error('Failed to send cancellation email', emailError);
                }
            }
            res.json(cancelledOrder);
        } catch (error) {
            if (error.message === 'Nie znaleziono zamówienia lub brak dostępu') {
                return res.status(404).json({ error: error.message });
            }
            if (error.message === 'Tego zamówienia nie można anulować na tym etapie') {
                return res.status(400).json({ error: error.message });
            }
            logger.error('Cancel order error:', error);
            res.status(500).json({ error: 'Nie udało się anulować zamówienia' });
        }
    });

    return router;
};

export default createOrderRoutes;
