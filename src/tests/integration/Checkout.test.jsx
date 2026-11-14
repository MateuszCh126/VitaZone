import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Checkout from '../../pages/Checkout.jsx';

const { useCartMock } = vi.hoisted(() => ({ useCartMock: vi.fn() }));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ user: null, loading: false })
}));

vi.mock('../../context/CartContext', () => ({
    useCart: useCartMock
}));

describe('Checkout guest flow', () => {
    beforeEach(() => {
        useCartMock.mockReturnValue({
            cart: [{ id: '00000000-0000-4000-8000-000000000001', name: 'Terrarium', price: 100, quantity: 1 }],
            cartTotal: 100,
            clearCart: vi.fn(),
            appliedDiscount: null,
            applyDiscount: vi.fn(),
            removeDiscount: vi.fn()
        });
    });

    it('lets a signed-out customer view checkout and labels the email field', () => {
        render(<HelmetProvider><MemoryRouter><Checkout /></MemoryRouter></HelmetProvider>);

        expect(screen.getByRole('heading', { name: 'Finalizacja zamówienia' })).toBeInTheDocument();
        expect(screen.getByLabelText(/Adres e-mail/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Telefon do dostawy/)).toBeInTheDocument();
    });

    it('does not show delivery or payment fields when the cart is empty', () => {
        useCartMock.mockReturnValue({
            cart: [],
            cartTotal: 0,
            clearCart: vi.fn(),
            appliedDiscount: null,
            applyDiscount: vi.fn(),
            removeDiscount: vi.fn()
        });

        render(<HelmetProvider><MemoryRouter><Checkout /></MemoryRouter></HelmetProvider>);

        expect(screen.getByRole('heading', { name: 'Koszyk jest pusty' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Wróć do asortymentu' })).toHaveAttribute('href', '/shop');
        expect(screen.queryByLabelText(/Adres e-mail/)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Sprawdź metody i koszt dostawy' })).not.toBeInTheDocument();
    });
});
