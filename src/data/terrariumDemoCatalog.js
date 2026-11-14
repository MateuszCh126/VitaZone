const model = (name) => ({ url: `/demo/terrarium/${name}.glb`, version: 'demo-only' });

export const terrariumDemoCatalog = [
  {
    id: 'demo-enclosure-tall',
    name: 'Terrarium pionowe 60 × 90 × 45',
    description: 'Przykładowa wysoka bryła do demonstracji konfiguratora.',
    price_cents: 179900,
    stock: 3,
    is_active: true,
    isDemo: true,
    specs: {
      terrariumDesigner: {
        role: 'enclosure',
        shape: 'rectangular',
        dimensionsMm: { width: 600, height: 900, depth: 450 },
        innerDimensionsMm: { width: 580, height: 880, depth: 430 },
        allowedMountSurfaces: [],
        model: model('demo-enclosure')
      }
    }
  },
  {
    id: 'demo-enclosure-cube',
    name: 'Terrarium sześcienne 60 × 60 × 60',
    description: 'Przykładowa bryła sześcienna do demonstracji konfiguratora.',
    price_cents: 149900,
    stock: 3,
    is_active: true,
    isDemo: true,
    specs: {
      terrariumDesigner: {
        role: 'enclosure',
        shape: 'cube',
        dimensionsMm: { width: 600, height: 600, depth: 600 },
        innerDimensionsMm: { width: 580, height: 580, depth: 580 },
        allowedMountSurfaces: [],
        model: model('demo-enclosure')
      }
    }
  },
  {
    id: 'demo-fern',
    name: 'Paproć tropikalna',
    description: 'Podgląd rośliny o nieregularnym pokroju.',
    price_cents: 2199,
    stock: 12,
    is_active: true,
    isDemo: true,
    demoKind: 'fern',
    specs: {
      terrariumDesigner: {
        role: 'element',
        dimensionsMm: { width: 150, height: 230, depth: 140 },
        allowedMountSurfaces: ['floor'],
        model: model('demo-fern')
      }
    }
  },
  {
    id: 'demo-cork-shelf',
    name: 'Półka korkowa',
    description: 'Przykład elementu mocowanego do tylnej lub bocznej ściany.',
    price_cents: 3499,
    stock: 8,
    is_active: true,
    isDemo: true,
    demoKind: 'shelf',
    specs: {
      terrariumDesigner: {
        role: 'element',
        dimensionsMm: { width: 240, height: 28, depth: 140 },
        allowedMountSurfaces: ['back', 'left', 'right'],
        model: model('demo-shelf')
      }
    }
  },
  {
    id: 'demo-root-branch',
    name: 'Korzeń do wspinania',
    description: 'Przykład gałęzi możliwej do ustawienia przy podłożu lub tylnej ścianie.',
    price_cents: 4299,
    stock: 6,
    is_active: true,
    isDemo: true,
    demoKind: 'branch',
    specs: {
      terrariumDesigner: {
        role: 'element',
        dimensionsMm: { width: 310, height: 220, depth: 100 },
        allowedMountSurfaces: ['floor', 'back'],
        model: model('demo-branch')
      }
    }
  },
  {
    id: 'demo-stone',
    name: 'Kamień bazaltowy',
    description: 'Przykład ciężkiej dekoracji stojącej na podłożu.',
    price_cents: 1299,
    stock: 18,
    is_active: true,
    isDemo: true,
    demoKind: 'stone',
    specs: {
      terrariumDesigner: {
        role: 'element',
        dimensionsMm: { width: 120, height: 85, depth: 110 },
        allowedMountSurfaces: ['floor'],
        model: model('demo-stone')
      }
    }
  }
];
