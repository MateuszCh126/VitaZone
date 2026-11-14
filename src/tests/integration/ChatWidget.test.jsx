import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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
