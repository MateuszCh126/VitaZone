import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '../../context/CartContext';

let mockUser = null;

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ user: mockUser })
}));

const sampleItem = {
    id: 'p1',
    productId: 'p1',
    name: 'Gekon lamparci',
    price: 100,
    quantity: 1,
    image: null
};

const TestComponent = () => {
    const {
        cart,
        appliedDiscount,
        applyDiscount,
        updateQuantity
    } = useCart();

    return (
        <div>
            <div data-testid="cart-total">{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</div>
            <div data-testid="discount-code">{appliedDiscount?.code || 'none'}</div>
            <div data-testid="discount-amount">{appliedDiscount?.amount || 0}</div>
            <button onClick={() => applyDiscount('TEST')}>Apply Discount</button>
            <button onClick={() => updateQuantity('p1', 1)}>Increase Quantity</button>
        </div>
    );
};

describe('CartContext Integration', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mockUser = null;
        localStorage.clear();
        globalThis.fetch = vi.fn();
    });

    it('clears applied discount when the authenticated user changes', async () => {
        mockUser = { id: 'admin-1', email: 'admin@example.com' };

        globalThis.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ items: [sampleItem] })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ code: 'TEST', amount: 2500, type: 'percent', value: 25 })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    items: [{ ...sampleItem, id: 'p2', productId: 'p2', name: 'Agama brodata', price: 150 }]
                })
            });

        const view = render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/cart'),
                expect.objectContaining({ credentials: 'include' })
            );
        });

        fireEvent.click(screen.getByText('Apply Discount'));

        await waitFor(() => {
            expect(screen.getByTestId('discount-code').textContent).toBe('TEST');
        });

        mockUser = { id: 'user-2', email: 'user2@example.com' };
        view.rerender(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('discount-code').textContent).toBe('none');
        });
    });

    it('revalidates the discount amount when cart total changes', async () => {
        localStorage.setItem('exotic_cart', JSON.stringify([sampleItem]));

        globalThis.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ code: 'TEST', amount: 2500, type: 'percent', value: 25 })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ code: 'TEST', amount: 5000, type: 'percent', value: 25 })
            });

        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('cart-total').textContent).toBe('100');
        });

        fireEvent.click(screen.getByText('Apply Discount'));

        await waitFor(() => {
            expect(screen.getByTestId('discount-amount').textContent).toBe('2500');
        });

        fireEvent.click(screen.getByText('Increase Quantity'));

        await waitFor(() => {
            expect(screen.getByTestId('cart-total').textContent).toBe('200');
            expect(screen.getByTestId('discount-amount').textContent).toBe('5000');
        });
    });
});
