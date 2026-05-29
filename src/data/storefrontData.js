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
    description: 'Sprawdzone gatunki dzienne i nocne dla osób zaczynających oraz rozwijających własną hodowlę.',
    image: 'https://images.pexels.com/photos/12514418/pexels-photo-12514418.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Węże',
    slug: 'weze',
    shortLabel: 'Spokojne gatunki startowe',
    description: 'Węże o stabilnym temperamencie, dobrane pod bezpieczny start i odpowiedzialne prowadzenie terrarium.',
    image: 'https://images.pexels.com/photos/80474/snake-corn-snake-reptile-scale-80474.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Żółwie',
    slug: 'zolwie',
    shortLabel: 'Gatunki lądowe do suchych wybiegów',
    description: 'Młode żółwie dla opiekunów gotowych zapewnić mocne UVB, przestrzeń i dobrze rozpisaną dietę roślinną.',
    image: 'https://images.pexels.com/photos/15798777/pexels-photo-15798777.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Płazy',
    slug: 'plazy',
    shortLabel: 'Zbiorniki wilgotne i półwodne',
    description: 'Aksolotle, rzekotki i inne płazy do akwaterrariów oraz spokojnych, dobrze ustabilizowanych setupów.',
    image: 'https://images.pexels.com/photos/18061314/pexels-photo-18061314.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Ptaszniki i skorpiony',
    slug: 'pajaki',
    shortLabel: 'Bezkręgowce ekspozycyjne',
    description: 'Ptaszniki, skakuny i skorpiony do prostych, dobrze zabezpieczonych terrariów ekspozycyjnych.',
    image: 'https://images.pexels.com/photos/4056759/pexels-photo-4056759.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Terraria i zestawy',
    slug: 'akcesoria',
    shortLabel: 'Gotowe bazy pod aranżację',
    description: 'Terraria otwierane od frontu, pionowe setupy i zestawy startowe gotowe do uzupełnienia o wyposażenie.',
    image: 'https://images.pexels.com/photos/7516897/pexels-photo-7516897.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Ogrzewanie i oświetlenie',
    slug: 'ogrzewanie-i-oswietlenie',
    shortLabel: 'Temperatura i UVB pod kontrolą',
    description: 'Lampy, maty i termostaty do budowania stabilnych stref grzewczych oraz bezpiecznego fotoperiodu.',
    image: 'https://images.pexels.com/photos/28750132/pexels-photo-28750132.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Podłoża i dekoracje',
    slug: 'podloza-i-dekoracje',
    shortLabel: 'Funkcjonalny wystrój terrarium',
    description: 'Podłoża, kryjówki, tła i konary dobrane tak, by terrarium wyglądało dobrze i pracowało na dobrostan zwierzęcia.',
    image: 'https://images.pexels.com/photos/7516897/pexels-photo-7516897.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
  },
  {
    name: 'Pokarm i suplementy',
    slug: 'pokarm-i-suplementy',
    shortLabel: 'Owady feeder i diety kompletne',
    description: 'Pokarm żywy, gotowe diety i suplementy wapniowe do codziennego, stabilnego żywienia.',
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
