import express from 'express';
import logger from '../server/config/logger.js';
import * as productRepo from '../repositories/productRepository.js';

const router = express.Router();

router.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

router.get('/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const products = await productRepo.getAllProducts(page, limit);
        res.json(products);
    } catch (error) {
        logger.error('Products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

router.get('/categories', async (req, res) => {
    try {
        const categories = await productRepo.getAllCategories();
        res.json(categories);
    } catch (error) {
        logger.error('Categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

router.get('/species/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json([]);
        }
        const results = await productRepo.searchSpecies(q);
        res.json(results);
    } catch (error) {
        logger.error('Species search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

router.get('/products/:id', async (req, res) => {
    try {
        const product = await productRepo.getPublicProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        logger.error('Fetch product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

export default router;
