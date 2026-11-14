import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import Home from '../../pages/Home.jsx';

const renderHome = () => render(
  <HelmetProvider>
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  </HelmetProvider>
);

describe('homepage hero particles', () => {
  it('keeps a sparse, decorative particle field inside the hero and honors reduced motion', () => {
    renderHome();

    const hero = screen.getByRole('heading', { name: /Terraria i wyposażenie/ }).closest('section');
    const particles = hero.querySelector('[data-testid="hero-particles"]');

    expect(particles).toHaveAttribute('aria-hidden', 'true');
    expect(particles.querySelectorAll('.hero-particle')).toHaveLength(8);
    expect(particles.querySelectorAll('.hero-particle').length).toBeLessThanOrEqual(10);
    expect(hero.querySelectorAll('[data-testid="hero-particles"]')).toHaveLength(1);

    const stylesheet = readFileSync(resolve(process.cwd(), 'src/pages/Home.css'), 'utf8');
    expect(stylesheet).toMatch(/pointer-events:\s*none/);
    expect(stylesheet).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(stylesheet).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?animation:\s*none/);
    expect(stylesheet).toMatch(/@keyframes[\s\S]*?transform:/);
    expect(stylesheet).not.toMatch(/@keyframes[\s\S]*?(?:left|top|right|bottom):/);
  });
});
