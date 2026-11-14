import { describe, expect, it } from 'vitest';
import { sortProducts } from '../../utils/productSorting.js';

const products = [
    { id: 'mid', price: 20, created_at: '2026-10-01T00:00:00.000Z' },
    { id: 'low', price: 5, created_at: '2026-10-03T00:00:00.000Z' },
    { id: 'high', price: 50, created_at: '2026-10-02T00:00:00.000Z' }
];

describe('sortProducts', () => {
    it('keeps catalog order when no ranking was selected', () => {
        expect(sortProducts(products, 'catalog').map(({ id }) => id)).toEqual(['mid', 'low', 'high']);
    });

    it('sorts by price in either direction using catalog prices', () => {
        expect(sortProducts(products, 'price-asc').map(({ id }) => id)).toEqual(['low', 'mid', 'high']);
        expect(sortProducts(products, 'price-desc').map(({ id }) => id)).toEqual(['high', 'mid', 'low']);
    });

    it('sorts newest first using product creation timestamps', () => {
        expect(sortProducts(products, 'newest').map(({ id }) => id)).toEqual(['low', 'high', 'mid']);
    });
});
