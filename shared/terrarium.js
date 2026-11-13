import { z } from 'zod';

export const TERRARIUM_MOUNT_SURFACES = ['floor', 'back', 'left', 'right', 'ceiling'];
export const TERRARIUM_SHAPES = ['rectangular', 'cube'];
export const MAX_DATABASE_CENTS = 2_147_483_647;

const PositiveMmSchema = z.number().int().positive().max(3000);

export const DimensionsMmSchema = z.object({
  width: PositiveMmSchema,
  height: PositiveMmSchema,
  depth: PositiveMmSchema
}).strict();

const ProductModelSchema = z.object({
  url: z.string().refine((value) => {
    const prefix = '/models/terrarium/';
    if (!value.startsWith(prefix) || !value.endsWith('.glb')) return false;
    const segments = value.slice(prefix.length).split('/');
    return segments.every((segment) => (
      segment.length > 0 && segment !== '.' && segment !== '..' && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(segment)
    ));
  }, 'Model musi być lokalnym plikiem GLB w katalogu terrarium'),
  version: z.string().trim().min(1).max(40)
}).strict();

export const TerrariumDesignerProductSchema = z.object({
  role: z.enum(['enclosure', 'element']),
  shape: z.enum(TERRARIUM_SHAPES).optional(),
  dimensionsMm: DimensionsMmSchema,
  innerDimensionsMm: DimensionsMmSchema.optional(),
  allowedMountSurfaces: z.array(z.enum(TERRARIUM_MOUNT_SURFACES)).max(5),
  model: ProductModelSchema
}).strict().superRefine((config, context) => {
  if (config.role === 'enclosure' && (!config.shape || !config.innerDimensionsMm)) {
    context.addIssue({ code: 'custom', message: 'Terrarium wymaga kształtu i wymiarów wewnętrznych' });
  }
  if (config.role === 'enclosure' && config.allowedMountSurfaces.length > 0) {
    context.addIssue({ code: 'custom', message: 'SKU terrarium nie może mieć powierzchni montażu' });
  }
  if (config.role === 'enclosure' && config.innerDimensionsMm) {
    for (const axis of ['width', 'height', 'depth']) {
      if (config.innerDimensionsMm[axis] > config.dimensionsMm[axis]) {
        context.addIssue({ code: 'custom', message: 'Wymiary wewnętrzne nie mogą przekraczać wymiarów zewnętrznych' });
      }
    }
    if (config.shape === 'cube' && new Set(Object.values(config.dimensionsMm)).size !== 1) {
      context.addIssue({ code: 'custom', message: 'Wymiary zewnętrzne bryły sześciennej muszą być równe' });
    }
  }
  if (config.role === 'element' && config.innerDimensionsMm) {
    context.addIssue({ code: 'custom', message: 'Element nie może deklarować wymiarów wnętrza' });
  }
  if (config.role === 'element' && config.allowedMountSurfaces.length === 0) {
    context.addIssue({ code: 'custom', message: 'Element wymaga co najmniej jednej dozwolonej powierzchni' });
  }
  if (new Set(config.allowedMountSurfaces).size !== config.allowedMountSurfaces.length) {
    context.addIssue({ code: 'custom', message: 'Powierzchnie montażu nie mogą się powtarzać' });
  }
});

const VectorMmSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite()
}).strict();

const PlacementObjectSchema = z.object({
  instanceId: z.uuid(),
  productId: z.uuid(),
  quantity: z.number().int().min(1).max(20),
  positionMm: VectorMmSchema,
  rotationDeg: VectorMmSchema,
  surface: z.enum(TERRARIUM_MOUNT_SURFACES)
}).strict();

export const TerrariumConfigurationSchema = z.object({
  version: z.literal(1),
  enclosureProductId: z.uuid(),
  objects: z.array(PlacementObjectSchema).min(1).max(80)
}).strict().superRefine((configuration, context) => {
  const ids = new Set();
  configuration.objects.forEach((object, index) => {
    if (ids.has(object.instanceId)) {
      context.addIssue({ code: 'custom', path: ['objects', index, 'instanceId'], message: 'Identyfikatory obiektów nie mogą być powtórzone' });
    }
    ids.add(object.instanceId);
  });
});

export const millimetersToMeters = (millimeters) => millimeters / 1000;

const roundMm = (value) => Math.round(value * 1000) / 1000;
const normalizeDegrees = (value) => {
  const wrapped = ((value % 360) + 360) % 360;
  return roundMm(wrapped > 180 ? wrapped - 360 : wrapped);
};

const getProductDesignerConfig = (product) => {
  const parsed = TerrariumDesignerProductSchema.safeParse(product?.specs?.terrariumDesigner);
  if (!parsed.success) {
    throw new Error(`Produkt ${product?.name || ''} ma nieprawidłowe dane konfiguratora terrarium`);
  }
  return parsed.data;
};

const getEnclosureConfig = (enclosure) => {
  const config = getProductDesignerConfig(enclosure);
  if (config.role !== 'enclosure' || !config.innerDimensionsMm) {
    throw new Error('Nieprawidłowy SKU terrarium');
  }
  return config;
};

const getElementConfig = (product) => {
  const config = getProductDesignerConfig(product);
  if (config.role !== 'element') {
    throw new Error(`Produkt ${product?.name || ''} nie jest skonfigurowany do projektowania terrarium`);
  }
  return config;
};

const requireAvailableProduct = (product, quantity) => {
  if (!product) throw new Error('Nie znaleziono produktu w katalogu');
  if (product.is_active !== true) throw new Error(`Produkt ${product.name} jest niedostępny`);
  if (Number(product.stock) < quantity) throw new Error(`Brak wystarczającej ilości produktu ${product.name}`);
  if (!Number.isSafeInteger(Number(product.price_cents)) || Number(product.price_cents) <= 0) {
    throw new Error(`Nieprawidłowa cena produktu ${product.name}`);
  }
};

const productMap = (products) => new Map(products.map((product) => [product.id, product]));
const assertDatabaseCents = (amount) => {
  if (!Number.isSafeInteger(amount) || amount < 0 || amount > MAX_DATABASE_CENTS) {
    throw new Error('Kwota przekracza zakres zapisywany w groszach');
  }
};

const orientedHalfExtents = (dimensionsMm, rotationDeg) => {
  const radians = {
    x: rotationDeg.x * Math.PI / 180,
    y: rotationDeg.y * Math.PI / 180,
    z: rotationDeg.z * Math.PI / 180
  };
  const cosX = Math.cos(radians.x);
  const sinX = Math.sin(radians.x);
  const cosY = Math.cos(radians.y);
  const sinY = Math.sin(radians.y);
  const cosZ = Math.cos(radians.z);
  const sinZ = Math.sin(radians.z);
  const half = {
    x: dimensionsMm.width / 2,
    y: dimensionsMm.height / 2,
    z: dimensionsMm.depth / 2
  };
  const max = { x: 0, y: 0, z: 0 };

  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const x = sx * half.x;
        const y = sy * half.y;
        const z = sz * half.z;
        const xRotated = x;
        const yRotated = y * cosX - z * sinX;
        const zRotated = y * sinX + z * cosX;
        const xYawed = xRotated * cosY + zRotated * sinY;
        const yYawed = yRotated;
        const zYawed = -xRotated * sinY + zRotated * cosY;
        const xFinal = xYawed * cosZ - yYawed * sinZ;
        const yFinal = xYawed * sinZ + yYawed * cosZ;
        max.x = Math.max(max.x, Math.abs(xFinal));
        max.y = Math.max(max.y, Math.abs(yFinal));
        max.z = Math.max(max.z, Math.abs(zYawed));
      }
    }
  }

  return max;
};

const ensureFits = (half, enclosure) => {
  if (half.x * 2 > enclosure.width || half.y * 2 > enclosure.height || half.z * 2 > enclosure.depth) {
    throw new Error('Produkt nie mieści się w granicy terrarium');
  }
};

export const normalizePlacement = ({ positionMm, rotationDeg, surface, product, enclosure }) => {
  if (!TERRARIUM_MOUNT_SURFACES.includes(surface)) {
    throw new Error('Nieobsługiwana powierzchnia montażu');
  }

  const allowedSurfaces = product?.allowedMountSurfaces || [];
  if (!allowedSurfaces.includes(surface)) {
    throw new Error('Produkt nie może być umieszczony na tej powierzchni');
  }

  const inner = enclosure?.innerDimensionsMm;
  if (!inner) throw new Error('Nieprawidłowe wymiary wewnętrzne terrarium');

  const normalizedRotation = {
    x: normalizeDegrees(rotationDeg.x),
    y: normalizeDegrees(rotationDeg.y),
    z: normalizeDegrees(rotationDeg.z)
  };
  const half = orientedHalfExtents(product.dimensionsMm, normalizedRotation);
  ensureFits(half, inner);

  const xRange = { min: -inner.width / 2 + half.x, max: inner.width / 2 - half.x };
  const yRange = { min: -inner.height / 2 + half.y, max: inner.height / 2 - half.y };
  const zRange = { min: -inner.depth / 2 + half.z, max: inner.depth / 2 - half.z };
  const clamp = (value, range) => Math.min(Math.max(value, range.min), range.max);
  const position = {
    x: clamp(positionMm.x, xRange),
    y: clamp(positionMm.y, yRange),
    z: clamp(positionMm.z, zRange)
  };

  if (surface === 'floor') position.y = yRange.min;
  if (surface === 'ceiling') position.y = yRange.max;
  if (surface === 'back') position.z = zRange.min;
  if (surface === 'left') position.x = xRange.min;
  if (surface === 'right') position.x = xRange.max;

  return {
    positionMm: { x: roundMm(position.x), y: roundMm(position.y), z: roundMm(position.z) },
    rotationDeg: normalizedRotation,
    surface
  };
};

const assertValidPlacement = (object, product, enclosure) => {
  const config = getElementConfig(product);
  if (!config.allowedMountSurfaces?.includes(object.surface)) {
    throw new Error(`Produkt ${product.name} nie może być montowany na tej powierzchni`);
  }

  const normalized = normalizePlacement({
    positionMm: object.positionMm,
    rotationDeg: object.rotationDeg,
    surface: object.surface,
    product: config,
    enclosure
  });
  const toleranceMm = 1;
  const outOfBounds = Object.keys(normalized.positionMm).some((axis) => (
    Math.abs(normalized.positionMm[axis] - object.positionMm[axis]) > toleranceMm
  ));
  if (outOfBounds) throw new Error(`Produkt ${product.name} znajduje się poza granicy terrarium`);
};

export const validateTerrariumConfiguration = (input, products) => {
  const configuration = TerrariumConfigurationSchema.parse(input);
  const byId = productMap(products);
  const enclosure = byId.get(configuration.enclosureProductId);
  requireAvailableProduct(enclosure, 1);
  const enclosureConfig = getEnclosureConfig(enclosure);
  const requestedQuantities = new Map([[enclosure.id, 1]]);

  for (const object of configuration.objects) {
    const product = byId.get(object.productId);
    requireAvailableProduct(product, 1);
    assertValidPlacement(object, product, enclosureConfig);
    requestedQuantities.set(object.productId, (requestedQuantities.get(object.productId) || 0) + object.quantity);
  }

  for (const [productId, quantity] of requestedQuantities) {
    requireAvailableProduct(byId.get(productId), quantity);
  }

  return configuration;
};

export const calculateTerrariumEstimate = (input, products) => {
  const configuration = validateTerrariumConfiguration(input, products);
  const byId = productMap(products);
  const quantities = new Map([[configuration.enclosureProductId, 1]]);

  for (const object of configuration.objects) {
    quantities.set(object.productId, (quantities.get(object.productId) || 0) + object.quantity);
  }

  const items = [...quantities.entries()].map(([productId, quantity]) => {
    const product = byId.get(productId);
    const unitPriceCents = Number(product.price_cents);
    const lineTotalCents = unitPriceCents * quantity;
    assertDatabaseCents(lineTotalCents);
    return {
      productId,
      name: product.name,
      quantity,
      unitPriceCents,
      lineTotalCents
    };
  });

  const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  assertDatabaseCents(totalCents);

  return {
    currency: 'pln',
    items,
    totalCents
  };
};

export const createTerrariumQuoteSnapshot = (estimate, productPrices) => {
  if (!Array.isArray(productPrices)) throw new Error('Nieprawidłowa lista pozycji wyceny');

  const pricesById = new Map();
  for (const item of productPrices) {
    if (pricesById.has(item.productId)) throw new Error('Powtórzona pozycja wyceny');
    if (!Number.isSafeInteger(item.unitPriceCents) || item.unitPriceCents <= 0) {
      throw new Error('Cena produktu musi być dodatnią liczbą groszy');
    }
    pricesById.set(item.productId, item.unitPriceCents);
  }

  if (pricesById.size !== estimate.items.length || estimate.items.some((item) => !pricesById.has(item.productId))) {
    throw new Error('Lista pozycji wyceny nie odpowiada produktom z projektu');
  }

  const items = estimate.items.map((item) => {
    const unitPriceCents = pricesById.get(item.productId);
    const lineTotalCents = unitPriceCents * item.quantity;
    assertDatabaseCents(lineTotalCents);
    return {
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPriceCents,
      lineTotalCents
    };
  });

  const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  assertDatabaseCents(totalCents);

  return {
    currency: estimate.currency,
    items,
    totalCents
  };
};

export const resolveOrderItemPriceCents = (product, item, priceSnapshot) => {
  if (!priceSnapshot) return Number(product.price_cents);
  if (!Array.isArray(priceSnapshot)) throw new Error('Nieprawidłowy snapshot cen');

  const matches = priceSnapshot.filter((entry) => entry.productId === item.productId);
  if (matches.length !== 1 || matches[0].quantity !== item.quantity) {
    throw new Error('Snapshot ceny nie odpowiada ilości pozycji zamówienia');
  }
  if (!Number.isSafeInteger(matches[0].unitPriceCents) || matches[0].unitPriceCents <= 0) {
    throw new Error('Snapshot zawiera nieprawidłową cenę produktu');
  }
  if (product.id !== item.productId) throw new Error('Snapshot ceny nie odpowiada SKU');

  return matches[0].unitPriceCents;
};
