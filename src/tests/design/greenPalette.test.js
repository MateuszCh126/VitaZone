import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
const shop = readFileSync(resolve(process.cwd(), 'src/pages/Shop.jsx'), 'utf8');
const tailwind = readFileSync(resolve(process.cwd(), 'tailwind.config.js'), 'utf8');

describe('calmer VitaZone green system', () => {
  it('uses the softer shared green token with AA text contrast on black', () => {
    const token = css.match(/--color-primary:\s*(\d+)\s+(\d+)\s+(\d+)\s*;/);
    expect(token, 'primary CSS token should be defined').not.toBeNull();
    const rgb = token.slice(1).map(Number).map((channel) => channel / 255).map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
    const luminance = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    const blackContrast = (luminance + 0.05) / 0.05;

    expect(token.slice(1).map(Number)).toEqual([88, 201, 131]);
    expect(blackContrast).toBeGreaterThanOrEqual(4.5);
    expect(css).not.toMatch(/--color-focus:\s*\d/);
  });

  it('gives selected catalog filters a quiet green surface and no persistent glow', () => {
    expect(shop).toMatch(/bg-primary\/\[0\.\d+\][^'`]*text-primary/);
    expect(shop).toMatch(/border-primary\/\d+/);
    expect(shop).not.toContain('shadow-glow');
    expect(tailwind).not.toMatch(/glow\s*:/);
  });

  it('keeps a clearly visible keyboard focus outline using the shared primary token', () => {
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px solid rgb\(var\(--color-primary\)\)[^}]*outline-offset:\s*3px/s);
  });
});
