import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from '../../src/utils/jsonLd.js';
import { buildProductSchema } from '../../src/utils/productSchema.js';

const product = {
  id: 42,
  name: 'Terrarium 60 × 45 × 45',
  description: 'Opis produktu',
  price_cents: 12999,
  stock: 3,
  image_urls: ['/products/terrarium.webp']
};

describe('buildProductSchema', () => {
  it('uses only verified product fields and does not invent an SKU or reviews', () => {
    const schema = buildProductSchema(product, {
      canonicalUrl: 'https://vitazone.vercel.app/product/42',
      imageBaseUrl: 'https://vitazone.vercel.app'
    });

    expect(schema).toMatchObject({
      '@type': 'Product',
      name: 'Terrarium 60 × 45 × 45',
      image: ['https://vitazone.vercel.app/products/terrarium.webp'],
      offers: {
        '@type': 'Offer',
        url: 'https://vitazone.vercel.app/product/42',
        priceCurrency: 'PLN',
        price: '129.99',
        availability: 'https://schema.org/InStock'
      }
    });
    expect(schema).not.toHaveProperty('sku');
    expect(schema).not.toHaveProperty('aggregateRating');
    expect(schema).not.toHaveProperty('review');
  });

  it('omits schema when a product has no real image or server price', () => {
    expect(buildProductSchema({ ...product, image_urls: [] }, {
      canonicalUrl: 'https://vitazone.vercel.app/product/42',
      imageBaseUrl: 'https://vitazone.vercel.app'
    })).toBeNull();
    expect(buildProductSchema({ ...product, price_cents: null }, {
      canonicalUrl: 'https://vitazone.vercel.app/product/42',
      imageBaseUrl: 'https://vitazone.vercel.app'
    })).toBeNull();
  });

  it.each(['', ' ', false, '0', 0, null, undefined])('rejects malformed price value %s', (priceCents) => {
    expect(buildProductSchema({ ...product, price_cents: priceCents }, {
      canonicalUrl: 'https://vitazone.vercel.app/product/42',
      imageBaseUrl: 'https://vitazone.vercel.app'
    })).toBeNull();
  });

  it('excludes unsafe image URLs and omits unavailable stock data', () => {
    const schema = buildProductSchema({
      ...product,
      stock: null,
      image_urls: ['/valid.webp', 'javascript:alert(1)', 'https://user:password@example.com/image.jpg']
    }, {
      canonicalUrl: 'https://vitazone.vercel.app/product/42',
      imageBaseUrl: 'https://vitazone.vercel.app'
    });

    expect(schema.image).toEqual(['https://vitazone.vercel.app/valid.webp']);
    expect(schema.offers).not.toHaveProperty('availability');
  });

  it.each(['', ' ', false, '0', null, undefined])('does not infer stock status from malformed value %s', (stock) => {
    const schema = buildProductSchema({ ...product, stock }, {
      canonicalUrl: 'https://vitazone.vercel.app/product/42',
      imageBaseUrl: 'https://vitazone.vercel.app'
    });

    expect(schema.offers).not.toHaveProperty('availability');
  });
});

describe('serializeJsonLd', () => {
  it('escapes markup delimiters before JSON-LD is embedded in HTML', () => {
    const serialized = serializeJsonLd({ description: '</script><script>alert(1)</script> & value' });

    expect(serialized).not.toContain('<');
    expect(serialized).not.toContain('>');
    expect(serialized).not.toContain('&');
    expect(JSON.parse(serialized).description).toBe('</script><script>alert(1)</script> & value');
  });

  it('escapes Unicode line separators without changing parsed values', () => {
    const serialized = serializeJsonLd({ description: `line\u2028separator\u2029` });

    expect(serialized).not.toContain('\u2028');
    expect(serialized).not.toContain('\u2029');
    expect(JSON.parse(serialized).description).toBe(`line\u2028separator\u2029`);
  });
});
