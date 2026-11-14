export const CATEGORY_ORDER = [
  'Jaszczurki i gekony',
  'Węże',
  'Żółwie',
  'Płazy',
  'Ptaszniki i skorpiony',
  'Terraria i zestawy',
  'Ogrzewanie i oświetlenie',
  'Podłoża i dekoracje',
  'Pokarm i suplementy'
];

export const STOREFRONT_CATEGORIES = [
  {
    name: 'Jaszczurki i gekony',
    slug: 'gady',
    shortLabel: 'Jaszczurki i gekony',
    description: 'Zobacz dostępne jaszczurki i gekony. Informacje o konkretnej pozycji znajdziesz na jej karcie.',
    image: 'https://images.pexels.com/photos/12514418/pexels-photo-12514418.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Węże',
    slug: 'weze',
    shortLabel: 'Węże',
    description: 'Zobacz dostępne węże. Informacje o konkretnej pozycji znajdziesz na jej karcie.',
    image: 'https://images.pexels.com/photos/16200018/pexels-photo-16200018.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Żółwie',
    slug: 'zolwie',
    shortLabel: 'Żółwie',
    description: 'Zobacz dostępne żółwie. Szczegóły sprawdź na karcie konkretnej pozycji.',
    image: 'https://images.pexels.com/photos/15798777/pexels-photo-15798777.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Płazy',
    slug: 'plazy',
    shortLabel: 'Płazy',
    description: 'Zobacz dostępne płazy. Szczegóły sprawdź na karcie konkretnej pozycji.',
    image: 'https://images.pexels.com/photos/18061314/pexels-photo-18061314.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Ptaszniki i skorpiony',
    slug: 'pajaki',
    shortLabel: 'Ptaszniki i skorpiony',
    description: 'Przeglądaj ptaszniki i skorpiony dostępne w tej kategorii.',
    image: 'https://images.pexels.com/photos/4056759/pexels-photo-4056759.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Terraria i zestawy',
    slug: 'akcesoria',
    shortLabel: 'Terraria i zestawy',
    description: 'Przeglądaj terraria i zestawy. Zawartość sprawdź w opisie konkretnego produktu.',
    image: 'https://images.pexels.com/photos/7516897/pexels-photo-7516897.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Ogrzewanie i oświetlenie',
    slug: 'ogrzewanie-i-oswietlenie',
    shortLabel: 'Ogrzewanie i oświetlenie',
    description: 'Przeglądaj lampy, maty i termostaty z oferty sklepu.',
    image: 'https://images.pexels.com/photos/28750132/pexels-photo-28750132.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Podłoża i dekoracje',
    slug: 'podloza-i-dekoracje',
    shortLabel: 'Podłoża i dekoracje',
    description: 'Przeglądaj podłoża i elementy wystroju terrarium.',
    image: 'https://images.pexels.com/photos/7516897/pexels-photo-7516897.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Pokarm i suplementy',
    slug: 'pokarm-i-suplementy',
    shortLabel: 'Pokarm i suplementy',
    description: 'Przeglądaj pokarm i suplementy. Skład oraz zastosowanie sprawdź w opisie produktu.',
    image: 'https://images.pexels.com/photos/8250731/pexels-photo-8250731.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  }
];

export const FEATURED_CATEGORY_NAMES = [
  'Jaszczurki i gekony',
  'Węże',
  'Płazy',
  'Ptaszniki i skorpiony',
  'Terraria i zestawy',
  'Pokarm i suplementy'
];

export const getCategoryHref = (name) => `/shop?category=${encodeURIComponent(name)}`;
