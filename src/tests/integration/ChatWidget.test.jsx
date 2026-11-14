import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChatWidget from '../../components/ChatWidget.jsx';

describe('ChatWidget scope and availability copy', () => {
    it('describes catalog information without claiming live availability or animal-care advice', () => {
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
            configurable: true,
            value: vi.fn()
        });
        render(
            <MemoryRouter initialEntries={['/']}>
                <ChatWidget />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByRole('button', { name: 'Otwórz czat' }));

        expect(screen.getByText('Informacje o ofercie sklepu')).toBeInTheDocument();
        expect(screen.getByText(/Odpowiedzi opierają się na katalogu sklepu/)).toBeInTheDocument();
        expect(screen.getByText(/nie zastępuje lekarza weterynarii/)).toBeInTheDocument();
        expect(screen.queryByText('Dostępny')).not.toBeInTheDocument();
    });
});

describe('ChatWidget unread responses', () => {
    it('shows an accessible unread badge for a response received while closed and clears it when opened', async () => {
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
            configurable: true,
            value: vi.fn()
        });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            text: async () => JSON.stringify({ message: 'Odpowiedź asystenta' })
        }));

        render(
            <MemoryRouter initialEntries={['/']}>
                <ChatWidget />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Otwórz czat' }));
        fireEvent.change(screen.getByRole('textbox', { name: 'Wiadomość do asystenta' }), {
            target: { value: 'Pytanie' }
        });
        fireEvent.click(screen.getByRole('button', { name: 'Wyślij wiadomość' }));
        fireEvent.click(screen.getByRole('button', { name: 'Zamknij czat' }));

        expect(await screen.findByRole('status', { name: 'Nowa odpowiedź' })).toBeInTheDocument();
        expect(document.querySelector('.animate-ping')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Otwórz czat' }));

        expect(screen.getByText('Odpowiedź asystenta')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.queryByRole('status', { name: 'Nowa odpowiedź' })).not.toBeInTheDocument();
        });
        vi.unstubAllGlobals();
    });

    it('uses the latest panel state when a response finishes after closing the panel', async () => {
        let resolveResponse;
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
            configurable: true,
            value: vi.fn()
        });
        vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => {
            resolveResponse = resolve;
        })));

        render(
            <MemoryRouter initialEntries={['/']}>
                <ChatWidget />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Otwórz czat' }));
        fireEvent.change(screen.getByRole('textbox', { name: 'Wiadomość do asystenta' }), {
            target: { value: 'Pytanie' }
        });
        fireEvent.click(screen.getByRole('button', { name: 'Wyślij wiadomość' }));
        fireEvent.click(screen.getByRole('button', { name: 'Zamknij czat' }));
        resolveResponse({
            ok: true,
            text: async () => JSON.stringify({ message: 'Odpowiedź po zamknięciu' })
        });

        expect(await screen.findByRole('status', { name: 'Nowa odpowiedź' })).toBeInTheDocument();
        vi.unstubAllGlobals();
    });
});
