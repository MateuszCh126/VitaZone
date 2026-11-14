import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import FAQ from '../../pages/FAQ';

const renderFAQ = () => render(
  <MemoryRouter>
    <HelmetProvider>
      <FAQ />
    </HelmetProvider>
  </MemoryRouter>
);

describe('FAQ page', () => {
  it('provides section links and native, keyboard-accessible disclosures', () => {
    renderFAQ();

    const sections = ['Dostawa i logistyka', 'Płatności i finalizacja zamówienia', 'Zwroty i reklamacje'];
    const nav = screen.getByRole('navigation', { name: 'Przejdź do tematu' });

    sections.forEach((title) => {
      const section = screen.getByRole('heading', { name: title }).closest('section');
      expect(section).toHaveAttribute('id');
      expect(within(nav).getByRole('link', { name: title })).toHaveAttribute('href', `#${section.id}`);
      expect(section.querySelector('details summary')).not.toBeNull();
    });
  });

  it('separates combining items in a cart from their shipping arrangements', () => {
    renderFAQ();

    const answer = screen.getByText(/koszyk/i, { selector: 'p' });
    expect(answer).toHaveTextContent(/jedno zamówienie/i);
    expect(answer).toHaveTextContent(/wysyłane osobno/i);
    expect(answer).toHaveTextContent(/zależnie/i);
  });

  it('uses a restrained solid heading style and keeps disclosure summaries visibly focusable', () => {
    renderFAQ();

    const heading = screen.getByRole('heading', { name: 'FAQ' });
    expect(heading.className).not.toMatch(/gradient|text-transparent|bg-clip-text/);
    expect(document.querySelector('summary[class*="focus-visible:"]')).not.toBeNull();
  });
});
