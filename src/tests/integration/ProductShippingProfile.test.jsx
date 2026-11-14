import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProductModal from '../../components/ProductModal.jsx';

describe('product shipping package profile editing', () => {
    it('submits measured parcel dimensions as server-owned product specs', async () => {
        const onSubmit = vi.fn();
        render(<ProductModal
            isOpen
            onClose={vi.fn()}
            onSubmit={onSubmit}
            categories={[{ id: '00000000-0000-4000-8000-000000000001', name: 'Akcesoria' }]}
            editingProduct={{
                id: '00000000-0000-4000-8000-000000000002',
                name: 'Terrarium',
                price: 100,
                stock: 1,
                description: 'Opis',
                category_id: '00000000-0000-4000-8000-000000000001',
                image_urls: [],
                species: '',
                specs: {}
            }}
        />);

        fireEvent.change(screen.getByLabelText('Specyfikacja produktu i paczki (JSON)'), {
            target: { value: '{"shipping_parcels":[{"width":30,"depth":20,"height":10,"weight":2}]}' }
        });
        fireEvent.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
            specs: { shipping_parcels: [{ width: 30, depth: 20, height: 10, weight: 2 }] }
        })));
    });
});
