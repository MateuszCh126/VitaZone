import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Checkout from '../../pages/Checkout.jsx';

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ user: null, loading: false })
}));

vi.mock('../../context/CartContext', () => ({
    useCart: () => ({
        cart: [{ id: '00000000-0000-4000-8000-000000000001', name: 'Terrarium', price: 100, quantity: 1 }],
        cartTotal: 100,
        clearCart: vi.fn(),
        appliedDiscount: null,
        applyDiscount: vi.fn(),
        removeDiscount: vi.fn()
    })
}));

describe('Checkout guest flow', () => {
    it('lets a signed-out customer view checkout and labels the email field', () => {
        render(<MemoryRouter><Checkout /></MemoryRouter>);

        expect(screen.getByRole('heading', { name: 'Bezpieczna kasa' })).toBeInTheDocument();
        expect(screen.getByLabelText(/Adres e-mail/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Telefon do dostawy/)).toBeInTheDocument();
    });
});
