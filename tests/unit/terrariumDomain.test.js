import { describe, expect, it } from 'vitest';
import { AdminTerrariumQuoteSchema, TerrariumCheckoutSchema } from '../../schemas/terrariumSchema.js';
import { ProductSchema } from '../../schemas/productSchema.js';
import {
  calculateTerrariumEstimate,
  createTerrariumQuoteSnapshot,
  MAX_DATABASE_CENTS,
  millimetersToMeters,
  normalizePlacement,
  resolveOrderItemPriceCents,
  TerrariumDesignerProductSchema,
  TerrariumConfigurationSchema,
  validateTerrariumConfiguration
} from '../../shared/terrarium.js';

const enclosureId = '00000000-0000-4000-8000-000000000001';
const fernId = '00000000-0000-4000-8000-000000000002';
const stoneId = '00000000-0000-4000-8000-000000000003';
const itemId = '00000000-0000-4000-8000-000000000004';

const products = [
  {
    id: enclosureId,
    name: 'Terrarium pokazowe',
    price_cents: 10999,
    stock: 4,
    is_active: true,
    specs: {
      terrariumDesigner: {
        role: 'enclosure',
        shape: 'rectangular',
        dimensionsMm: { width: 400, height: 300, depth: 250 },
        innerDimensionsMm: { width: 380, height: 280, depth: 230 },
        allowedMountSurfaces: [],
        model: { url: '/models/terrarium/demo-enclosure.glb', version: '1' }
      }
    }
  },
  {
    id: fernId,
    name: 'Paproć pokazowa',
    price_cents: 1299,
    stock: 10,
    is_active: true,
    specs: {
      terrariumDesigner: {
        role: 'element',
        dimensionsMm: { width: 100, height: 80, depth: 70 },
        allowedMountSurfaces: ['floor'],
        model: { url: '/models/terrarium/demo-fern.glb', version: '1' }
      }
    }
  },
  {
    id: stoneId,
    name: 'Kamień pokazowy',
    price_cents: 899,
    stock: 10,
    is_active: true,
    specs: {
      terrariumDesigner: {
        role: 'element',
        dimensionsMm: { width: 50, height: 40, depth: 50 },
        allowedMountSurfaces: ['floor', 'back'],
        model: { url: '/models/terrarium/demo-stone.glb', version: '1' }
      }
    }
  }
];

const configuration = {
  version: 1,
  enclosureProductId: enclosureId,
  objects: [
    {
      instanceId: itemId,
      productId: fernId,
      quantity: 2,
      positionMm: { x: 0, y: -100, z: 0 },
      rotationDeg: { x: 0, y: 0, z: 0 },
      surface: 'floor'
    }
  ]
};

describe('terrarium domain', () => {
  it('converts measured millimeters to scene meters', () => {
    expect(millimetersToMeters(425)).toBe(0.425);
  });

  it('snaps and clamps a floor placement inside the measured enclosure', () => {
    expect(normalizePlacement({
      positionMm: { x: 500, y: 200, z: -500 },
      rotationDeg: { x: 0, y: 0, z: 0 },
      surface: 'floor',
      product: products[1].specs.terrariumDesigner,
      enclosure: products[0].specs.terrariumDesigner
    })).toEqual({
      positionMm: { x: 140, y: -100, z: -80 },
      rotationDeg: { x: 0, y: 0, z: 0 },
      surface: 'floor'
    });
  });

  it('canonicalizes full-turn rotations before saving placement data', () => {
    const placement = normalizePlacement({
      positionMm: { x: 0, y: 0, z: 0 },
      rotationDeg: { x: 0, y: 360, z: -720 },
      surface: 'floor',
      product: products[1].specs.terrariumDesigner,
      enclosure: products[0].specs.terrariumDesigner
    });

    expect(placement.rotationDeg).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('does not accept a front-glass placement surface', () => {
    expect(() => TerrariumConfigurationSchema.parse({
      ...configuration,
      objects: [{ ...configuration.objects[0], surface: 'front' }]
    })).toThrow();
  });

  it('rejects duplicate object ids in a submitted scene', () => {
    expect(() => TerrariumConfigurationSchema.parse({
      ...configuration,
      objects: [configuration.objects[0], {
        ...configuration.objects[0], productId: stoneId, surface: 'floor'
      }]
    })).toThrow(/powtórzone/i);
  });

  it('validates both SKU mount rules and physical enclosure bounds', () => {
    expect(() => validateTerrariumConfiguration(configuration, products)).not.toThrow();
    expect(() => validateTerrariumConfiguration({
      ...configuration,
      objects: [{ ...configuration.objects[0], positionMm: { x: 180, y: -100, z: 0 } }]
    }, products)).toThrow(/granicy/i);
    expect(() => validateTerrariumConfiguration({
      ...configuration,
      objects: [{ ...configuration.objects[0], surface: 'back' }]
    }, products)).toThrow(/powierzchni/i);
  });

  it('rejects malformed catalog measurements before persisting or pricing a project', () => {
    const invalidProducts = products.map((product) => product.id === fernId ? {
      ...product,
      specs: {
        terrariumDesigner: {
          ...product.specs.terrariumDesigner,
          dimensionsMm: { width: Number.NaN, height: 120, depth: 100 }
        }
      }
    } : product);

    expect(() => calculateTerrariumEstimate(configuration, invalidProducts)).toThrow(/konfiguratora|SKU/i);
  });

  it('calculates an itemized estimate from catalog prices', () => {
    const estimate = calculateTerrariumEstimate(configuration, products);

    expect(estimate.totalCents).toBe(13597);
    expect(estimate.items).toEqual([
      { productId: enclosureId, name: 'Terrarium pokazowe', quantity: 1, unitPriceCents: 10999, lineTotalCents: 10999 },
      { productId: fernId, name: 'Paproć pokazowa', quantity: 2, unitPriceCents: 1299, lineTotalCents: 2598 }
    ]);
  });

  it('rejects browser-supplied amounts from the project configuration', () => {
    expect(() => TerrariumConfigurationSchema.parse({
      ...configuration,
      estimateTotalCents: 1
    })).toThrow();
    expect(() => TerrariumConfigurationSchema.parse({
      ...configuration,
      objects: [{ ...configuration.objects[0], price_cents: 1 }]
    })).toThrow();
  });

  it('requires complete mm dimensions, a local versioned GLB, and valid product surfaces', () => {
    const validConfig = products[1].specs.terrariumDesigner;
    expect(TerrariumDesignerProductSchema.parse(validConfig)).toEqual(validConfig);
    expect(() => TerrariumDesignerProductSchema.parse({
      ...validConfig,
      allowedMountSurfaces: ['front']
    })).toThrow();
    expect(() => TerrariumDesignerProductSchema.parse({
      ...validConfig,
      model: { url: 'https://assets.example.invalid/plant.glb', version: '1' }
    })).toThrow();
    expect(() => TerrariumDesignerProductSchema.parse({
      ...validConfig,
      model: { url: '/models/terrarium/%2e%2e/outside.glb', version: '1' }
    })).toThrow();
    expect(() => TerrariumDesignerProductSchema.parse({
      ...validConfig,
      dimensionsMm: { width: 0, height: 80, depth: 70 }
    })).toThrow();
  });

  it('keeps enclosure internal dimensions inside its outer dimensions and validates cube shape', () => {
    const enclosure = products[0].specs.terrariumDesigner;
    expect(() => TerrariumDesignerProductSchema.parse({
      ...enclosure,
      innerDimensionsMm: { width: 401, height: 300, depth: 250 }
    })).toThrow(/wewnętrzne/i);
    expect(() => TerrariumDesignerProductSchema.parse({
      ...enclosure,
      shape: 'cube'
    })).toThrow(/sześcien/i);
  });

  it('validates terrarium metadata when the admin edits a catalog SKU', () => {
    const product = {
      name: 'Paproć testowa',
      price: 21.99,
      stock: 4,
      categoryId: '00000000-0000-4000-8000-000000000006',
      specs: { terrariumDesigner: products[1].specs.terrariumDesigner }
    };

    expect(ProductSchema.safeParse(product).success).toBe(true);
    expect(ProductSchema.safeParse({
      ...product,
      specs: {
        terrariumDesigner: {
          ...product.specs.terrariumDesigner,
          dimensionsMm: { width: 0, height: 80, depth: 70 }
        }
      }
    }).success).toBe(false);
  });

  it('builds a final quote by SKU price while preserving the requested quantities', () => {
    const estimate = calculateTerrariumEstimate(configuration, products);
    const quote = createTerrariumQuoteSnapshot(estimate, [
      { productId: enclosureId, unitPriceCents: 10999 },
      { productId: fernId, unitPriceCents: 1500 }
    ]);

    expect(quote.totalCents).toBe(13999);
    expect(quote.items[1]).toMatchObject({ productId: fernId, quantity: 2, unitPriceCents: 1500, lineTotalCents: 3000 });
    expect(() => createTerrariumQuoteSnapshot(estimate, [
      { productId: enclosureId, unitPriceCents: 10999 },
      { productId: stoneId, unitPriceCents: 1 }
    ])).toThrow(/pozycji/i);
  });

  it('rejects estimates and quotes that exceed PostgreSQL integer cents', () => {
    const highValueProducts = products.map((product) => ({
      ...product,
      price_cents: product.id === enclosureId ? 1_500_000_000 : product.id === fernId ? 400_000_000 : product.price_cents
    }));
    expect(() => calculateTerrariumEstimate(configuration, highValueProducts)).toThrow(/zakres|limitu/i);

    const estimate = calculateTerrariumEstimate(configuration, products);
    expect(() => createTerrariumQuoteSnapshot(estimate, [
      { productId: enclosureId, unitPriceCents: 1_500_000_000 },
      { productId: fernId, unitPriceCents: 400_000_000 }
    ])).toThrow(/zakres|limitu/i);

    const boundaryProducts = products.map((product) => ({
      ...product,
      price_cents: product.id === enclosureId ? MAX_DATABASE_CENTS - 3000 : product.id === fernId ? 1500 : product.price_cents
    }));
    const boundaryEstimate = calculateTerrariumEstimate(configuration, boundaryProducts);
    expect(boundaryEstimate.totalCents).toBe(MAX_DATABASE_CENTS);
    expect(createTerrariumQuoteSnapshot(boundaryEstimate, [
      { productId: enclosureId, unitPriceCents: MAX_DATABASE_CENTS - 3000 },
      { productId: fernId, unitPriceCents: 1500 }
    ]).totalCents).toBe(MAX_DATABASE_CENTS);
  });

  it('charges the accepted per-SKU price snapshot even if the catalog price changes', () => {
    const snapshot = [{ productId: fernId, quantity: 2, unitPriceCents: 1500 }];
    expect(resolveOrderItemPriceCents({ id: fernId, price_cents: 1299 }, {
      productId: fernId,
      quantity: 2
    }, snapshot)).toBe(1500);
    expect(() => resolveOrderItemPriceCents({ id: fernId, price_cents: 1299 }, {
      productId: fernId,
      quantity: 1
    }, snapshot)).toThrow();
  });

  it('accepts only per-product quote prices and computes no client-supplied total', () => {
    const quoteInput = {
      items: [
        { productId: enclosureId, unitPriceCents: 10999 },
        { productId: fernId, unitPriceCents: 1500 }
      ],
      validForDays: 7,
      message: 'Oferta ważna przez tydzień.'
    };

    expect(AdminTerrariumQuoteSchema.parse(quoteInput)).toEqual(quoteInput);
    expect(() => AdminTerrariumQuoteSchema.parse({ ...quoteInput, totalCents: 1 })).toThrow();
    expect(() => AdminTerrariumQuoteSchema.parse({
      ...quoteInput,
      items: [{ productId: fernId, unitPriceCents: -1 }]
    })).toThrow();
  });

  it('validates a shipping address before quote payment', () => {
    expect(TerrariumCheckoutSchema.safeParse({
      fullName: 'Jan Kowalski',
      email: 'jan@example.com',
      country: 'Polska',
      city: 'Jelenia Góra',
      postal_code: '58-500',
      street: 'Kolejowa',
      house_number: '12'
    }).success).toBe(true);
    expect(TerrariumCheckoutSchema.safeParse({
      fullName: '',
      email: 'nie-email',
      country: 'Polska',
      city: '',
      postal_code: 'x',
      street: '',
      house_number: ''
    }).success).toBe(false);
  });

  it('rejects inactive, missing, or understocked catalog products', () => {
    expect(() => calculateTerrariumEstimate(configuration, products.slice(0, 1))).toThrow(/produktu/i);
    expect(() => calculateTerrariumEstimate(configuration, products.map((product) => (
      product.id === fernId ? { ...product, is_active: false } : product
    )))).toThrow(/niedostępny/i);
    expect(() => calculateTerrariumEstimate(configuration, products.map((product) => (
      product.id === fernId ? { ...product, stock: 1 } : product
    )))).toThrow(/ilości/i);
    expect(() => calculateTerrariumEstimate({
      ...configuration,
      objects: [
        { ...configuration.objects[0], quantity: 1 },
        { ...configuration.objects[0], instanceId: '00000000-0000-4000-8000-000000000005', quantity: 1 }
      ]
    }, products.map((product) => (
      product.id === fernId ? { ...product, stock: 1 } : product
    )))).toThrow(/ilości/i);
  });
});
