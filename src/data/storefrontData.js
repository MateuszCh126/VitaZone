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
    shortLabel: 'Gekony, agamy i skynki',
    description: 'Przeglądaj dostępne jaszczurki i gekony oraz informacje na kartach produktów.',
    image: 'https://images.pexels.com/photos/12514418/pexels-photo-12514418.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Węże',
    slug: 'weze',
    shortLabel: 'Węże w ofercie',
    description: 'Zobacz dostępne węże i sprawdź szczegóły na kartach produktów.',
    image: 'https://images.pexels.com/photos/80474/snake-corn-snake-reptile-scale-80474.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Żółwie',
    slug: 'zolwie',
    shortLabel: 'Gatunki lądowe do suchych wybiegów',
    description: 'Zobacz dostępne żółwie oraz informacje podane przy konkretnym produkcie.',
    image: 'https://images.pexels.com/photos/15798777/pexels-photo-15798777.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Płazy',
    slug: 'plazy',
    shortLabel: 'Zbiorniki wilgotne i półwodne',
    description: 'Przeglądaj dostępne płazy i informacje na kartach produktów.',
    image: 'https://images.pexels.com/photos/18061314/pexels-photo-18061314.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Ptaszniki i skorpiony',
    slug: 'pajaki',
    shortLabel: 'Bezkręgowce ekspozycyjne',
    description: 'Ptaszniki, skakuny i skorpiony dostępne w tej kategorii.',
    image: 'https://images.pexels.com/photos/4056759/pexels-photo-4056759.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Terraria i zestawy',
    slug: 'akcesoria',
    shortLabel: 'Gotowe bazy pod aranżację',
    description: 'Przeglądaj terraria i zestawy. Zawartość sprawdzisz w opisie każdego produktu.',
    image: 'https://images.pexels.com/photos/7516897/pexels-photo-7516897.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Ogrzewanie i oświetlenie',
    slug: 'ogrzewanie-i-oswietlenie',
    shortLabel: 'Temperatura i UVB pod kontrolą',
    description: 'Przeglądaj dostępne lampy, maty i termostaty.',
    image: 'https://images.pexels.com/photos/28750132/pexels-photo-28750132.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Podłoża i dekoracje',
    slug: 'podloza-i-dekoracje',
    shortLabel: 'Funkcjonalny wystrój terrarium',
    description: 'Podłoża, kryjówki, tła i konary z aktualnej oferty.',
    image: 'https://images.pexels.com/photos/7516897/pexels-photo-7516897.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Pokarm i suplementy',
    slug: 'pokarm-i-suplementy',
    shortLabel: 'Owady feeder i diety kompletne',
    description: 'Przeglądaj dostępny pokarm i suplementy; szczegóły składu zawiera karta produktu.',
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
