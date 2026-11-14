import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProductModal from '../../components/ProductModal.jsx';

const renderModal = (props = {}) => render(
    <>
        <button type="button">Otwórz formularz produktu</button>
        <ProductModal
            isOpen
            onClose={vi.fn()}
            onSubmit={vi.fn()}
            categories={[{ id: 'category-1', name: 'Terraria' }]}
            {...props}
        />
    </>
);

describe('ProductModal accessibility', () => {
    it('exposes a named modal dialog and labels each editable field', () => {
        renderModal();

        expect(screen.getByRole('dialog', { name: 'Dodaj produkt' })).toHaveAttribute('aria-modal', 'true');
        expect(screen.getByLabelText('Nazwa produktu')).toBeInTheDocument();
        expect(screen.getByLabelText('Gatunek (łacina)')).toBeInTheDocument();
        expect(screen.getByLabelText('Cena (zł)')).toBeInTheDocument();
        expect(screen.getByLabelText('Stan magazynowy')).toBeInTheDocument();
        expect(screen.getByLabelText('Kategoria')).toBeInTheDocument();
        expect(screen.getByLabelText('Zdjęcia produktu')).toBeInTheDocument();
        expect(screen.getByLabelText('Opis produktu')).toBeInTheDocument();
        expect(screen.getByLabelText('Specyfikacja produktu i paczki (JSON)')).toBeInTheDocument();
    });

    it('moves focus into the dialog, traps reverse tab navigation, closes on Escape, and restores focus', async () => {
        const onClose = vi.fn();
        const triggerMarkup = <button type="button">Otwórz formularz produktu</button>;
        const view = render(triggerMarkup);
        const trigger = screen.getByRole('button', { name: 'Otwórz formularz produktu' });
        trigger.focus();
        view.rerender(<>
            {triggerMarkup}
            <ProductModal
                isOpen
                onClose={onClose}
                onSubmit={vi.fn()}
                categories={[{ id: 'category-1', name: 'Terraria' }]}
            />
        </>);
        const dialog = screen.getByRole('dialog', { name: 'Dodaj produkt' });
        const nameField = screen.getByLabelText('Nazwa produktu');
        const closeButton = screen.getByRole('button', { name: 'Zamknij okno produktu' });
        const submitButton = screen.getByRole('button', { name: 'Utwórz produkt' });

        await waitFor(() => expect(nameField).toHaveFocus());
        closeButton.focus();
        fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
        expect(submitButton).toHaveFocus();

        fireEvent.keyDown(dialog, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledOnce();

        view.rerender(<>
            <button type="button">Otwórz formularz produktu</button>
            <ProductModal isOpen={false} onClose={onClose} onSubmit={vi.fn()} categories={[]} />
        </>);
        await waitFor(() => expect(trigger).toHaveFocus());
    });
});
