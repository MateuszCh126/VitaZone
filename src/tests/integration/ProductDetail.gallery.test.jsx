import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ProductDetail from '../../pages/ProductDetail.jsx';

vi.mock('../../context/CartContext', () => ({
  useCart: () => ({ addToCart: vi.fn() })
}));

const product = {
  id: 'demo-product',
  name: 'Terrarium demonstracyjne',
  category_name: 'Terraria i zestawy',
  species: '',
  description: 'Produkt demonstracyjny.',
  price: 100,
  stock: 2,
  image_urls: ['/first.jpg', '/second.jpg', '/third.jpg']
};

describe('ProductDetail image gallery', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => product
    }));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const renderProduct = () => render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/product/demo-product']}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetail />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );

  it('announces the active slide, supports arrow keys, and keeps focus on the gallery control', async () => {
    renderProduct();

    const gallery = await screen.findByRole('region', { name: 'Zdjęcia produktu Terrarium demonstracyjne' });
    expect(gallery).toHaveAttribute('aria-label', 'Zdjęcia produktu Terrarium demonstracyjne');
    const nextButton = screen.getByRole('button', { name: 'Następne zdjęcie produktu Terrarium demonstracyjne' });
    nextButton.focus();

    expect(screen.getByRole('status')).toHaveTextContent('Zdjęcie 1 z 3: Terrarium demonstracyjne');
    fireEvent.keyDown(nextButton, { key: 'ArrowRight' });

    expect(screen.getByRole('status')).toHaveTextContent('Zdjęcie 2 z 3: Terrarium demonstracyjne');
    expect(document.activeElement).toBe(nextButton);
    expect(screen.getByRole('button', { name: 'Pokaż zdjęcie 2 z 3 produktu Terrarium demonstracyjne' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.keyDown(nextButton, { key: 'ArrowLeft' });
    expect(screen.getByRole('status')).toHaveTextContent('Zdjęcie 1 z 3: Terrarium demonstracyjne');
  });

  it('keeps slide changes user-triggered and does not autoplay', async () => {
    renderProduct();
    await screen.findByRole('region', { name: 'Zdjęcia produktu Terrarium demonstracyjne' });

    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(screen.getByRole('status')).toHaveTextContent('Zdjęcie 1 z 3: Terrarium demonstracyjne');
  });
});
