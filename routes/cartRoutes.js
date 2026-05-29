
import express from 'express';
import * as cartRepo from '../repositories/cartRepository.js';
import { verifyToken } from '../server/middleware/authMiddleware.js';
import { CartItemParamSchema, CartItemSchema, SyncCartSchema, UpdateCartItemSchema } from '../schemas/cartSchema.js';

const router = express.Router();

const authenticate = verifyToken;


// GET /api/cart
router.get('/', authenticate, async (req, res) => {
    try {
        const cart = await cartRepo.getCartByUserId(req.user.id);
        const items = await cartRepo.getCartItems(cart.id);

        // Map to frontend format
        const formattedItems = items.map(item => ({
            id: item.product_id, // Frontend expects .id for product id in some places, or .productId? 
            // Existing CartContext uses: { id, name, price, quantity, image }
            // Let's match db columns to frontend expectations
            productId: item.product_id,
            name: item.name,
            price: item.price_cents / 100, // convert back to standard unit
            image: item.image_urls ? item.image_urls[0] : null,
            quantity: item.quantity
        }));

        res.json({ cartId: cart.id, items: formattedItems });
    } catch (error) {
        console.error('Cart Fetch Error:', error);
        res.status(500).json({ error: 'Nie udało się pobrać koszyka' });
    }
});

// POST /api/cart/sync (Merge local cart on login)
router.post('/sync', authenticate, async (req, res) => {
    try {
        const { items } = SyncCartSchema.parse(req.body);
        if (Array.isArray(items) && items.length > 0) {
            await cartRepo.mergeGuestCart(req.user.id, items);
        }
        // Return updated cart
        const cart = await cartRepo.getCartByUserId(req.user.id);
        const updatedItems = await cartRepo.getCartItems(cart.id);

        const formattedItems = updatedItems.map(item => ({
            id: item.product_id,
            productId: item.product_id,
            name: item.name,
            price: item.price_cents / 100,
            image: item.image_urls ? item.image_urls[0] : null,
            quantity: item.quantity
        }));

        res.json({ success: true, items: formattedItems });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Dane formularza są nieprawidłowe', details: error.errors });
        }
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error('Cart Sync Error:', error);
        res.status(500).json({ error: 'Nie udało się zsynchronizować koszyka' });
    }
});

// POST /api/cart/items (Add Item)
router.post('/items', authenticate, async (req, res) => {
    try {
        const { productId, quantity } = CartItemSchema.parse(req.body);
        const cart = await cartRepo.getCartByUserId(req.user.id);
        await cartRepo.addItemToCart(cart.id, productId, quantity);
        res.json({ success: true });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Dane formularza są nieprawidłowe', details: error.errors });
        }
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        res.status(500).json({ error: 'Nie udało się dodać produktu do koszyka' });
    }
});

// PUT /api/cart/items/:productId (Update Quantity)
router.put('/items/:productId', authenticate, async (req, res) => {
    try {
        const { quantity } = UpdateCartItemSchema.parse(req.body);
        const { productId } = CartItemParamSchema.parse(req.params);
        const cart = await cartRepo.getCartByUserId(req.user.id);
        await cartRepo.updateItemQuantity(cart.id, productId, quantity);
        res.json({ success: true });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Dane formularza są nieprawidłowe', details: error.errors });
        }
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        res.status(500).json({ error: 'Nie udało się zaktualizować ilości produktu' });
    }
});

// DELETE /api/cart/items/:productId
router.delete('/items/:productId', authenticate, async (req, res) => {
    try {
        const { productId } = CartItemParamSchema.parse(req.params);
        const cart = await cartRepo.getCartByUserId(req.user.id);
        await cartRepo.deleteItemFromCart(cart.id, productId);
        res.json({ success: true });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Dane formularza są nieprawidłowe', details: error.errors });
        }
        res.status(500).json({ error: 'Nie udało się usunąć produktu z koszyka' });
    }
});

// DELETE /api/cart (Clear Cart)
router.delete('/', authenticate, async (req, res) => {
    try {
        const cart = await cartRepo.getCartByUserId(req.user.id);
        await cartRepo.clearCart(cart.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Nie udało się wyczyścić koszyka' });
    }
});

export default router;

