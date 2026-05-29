const imageBank = {
  leopardGecko: 'https://images.pexels.com/photos/12514418/pexels-photo-12514418.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200',
  beardedDragon: 'https://images.pexels.com/photos/2109796/pexels-photo-2109796.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200',
  cornSnake: 'https://images.pexels.com/photos/80474/snake-corn-snake-reptile-scale-80474.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200',
  ballPython: 'https://images.pexels.com/photos/16200018/pexels-photo-16200018.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200',
  crestedGecko: 'https://images.pexels.com/photos/14688539/pexels-photo-14688539.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200',
  axolotl: 'https://images.pexels.com/photos/8838034/pexels-photo-8838034.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200',
  scorpion: 'https://images.pexels.com/photos/6722692/pexels-photo-6722692.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200',
  dartFrog: 'https://images.pexels.com/photos/18061314/pexels-photo-18061314.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200',
  tortoise: 'https://images.pexels.com/photos/15798777/pexels-photo-15798777.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200',
  terrarium: 'https://images.pexels.com/photos/7516897/pexels-photo-7516897.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200',
  heatLamp: 'https://images.pexels.com/photos/28750132/pexels-photo-28750132.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200',
  whiteFrog: 'https://images.pexels.com/photos/4953212/pexels-photo-4953212.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200',
  feederInsects: 'https://images.pexels.com/photos/8250731/pexels-photo-8250731.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200',
  tarantula: 'https://images.pexels.com/photos/4056759/pexels-photo-4056759.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200',
  jumpingSpider: 'https://images.pexels.com/photos/5902734/pexels-photo-5902734.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=1200'
};

const catalogCategories = [
  {
    name: 'Jaszczurki i gekony',
    slug: 'gady',
    description: 'Spokojniejsze jaszczurki i gekony do startu oraz dojrzałych, dobrze rozpisanych terrariów dziennych i nocnych.'
  },
  {
    name: 'Węże',
    slug: 'weze',
    description: 'Gatunki dla osób, które szukają przewidywalnego temperamentu, prostszego żywienia i dobrze zabezpieczonego setupu.'
  },
  {
    name: 'Żółwie',
    slug: 'zolwie',
    description: 'Żółwie lądowe wymagające mocnego UVB, suchej strefy i odpowiednio zaplanowanej diety roślinnej.'
  },
  {
    name: 'Płazy',
    slug: 'plazy',
    description: 'Aksolotle, rzekotki i inne płazy do zbiorników półwodnych lub wilgotnych, stabilnych terrariów.'
  },
  {
    name: 'Ptaszniki i skorpiony',
    slug: 'pajaki',
    description: 'Bezkręgowce ekspozycyjne dla fanów prostych setupów, mikroklimatu i mniejszego terrarium.'
  },
  {
    name: 'Terraria i zestawy',
    slug: 'akcesoria',
    description: 'Terraria, zestawy startowe i gotowe bazy pod aranżację dla zwierząt naziemnych, nadrzewnych i pustynnych.'
  },
  {
    name: 'Ogrzewanie i oświetlenie',
    slug: 'ogrzewanie-i-oswietlenie',
    description: 'Lampy, promienniki, maty i termostaty do bezpiecznego prowadzenia temperatury i UVB.'
  },
  {
    name: 'Podłoża i dekoracje',
    slug: 'podloza-i-dekoracje',
    description: 'Podłoża, kryjówki, tła i elementy wystroju wspierające dobrostan oraz łatwiejszą obsługę terrarium.'
  },
  {
    name: 'Pokarm i suplementy',
    slug: 'pokarm-i-suplementy',
    description: 'Owady feeder, diety kompletne i suplementy wapniowe do regularnego karmienia i suplementacji.'
  }
];

const catalogProducts = [
  {
    name: 'Gekon lamparci Classic',
    species: 'Eublepharis macularius',
    categorySlug: 'gady',
    priceCents: 24900,
    stock: 9,
    description: 'Spokojny, nocny gekon idealny na start. Lubi stabilne ogrzewanie strefowe, kryjówki oraz regularne karmienie owadami.',
    imageUrls: [imageBank.leopardGecko],
    taxRate: 23
  },
  {
    name: 'Agama brodata Juvenile',
    species: 'Pogona vitticeps',
    categorySlug: 'gady',
    priceCents: 38900,
    stock: 6,
    description: 'Młoda agama dla osób szukających dziennego, kontaktowego gada do większego terrarium z mocnym UVB i szeroką strefą grzewczą.',
    imageUrls: [imageBank.beardedDragon],
    taxRate: 23
  },
  {
    name: 'Gekon orzęsiony Harlequin',
    species: 'Correlophus ciliatus',
    categorySlug: 'gady',
    priceCents: 32900,
    stock: 7,
    description: 'Arborealny gekon do pionowego terrarium, ceniony za łatwe żywienie gotowymi dietami i spokojny, ekspozycyjny charakter.',
    imageUrls: [imageBank.crestedGecko],
    taxRate: 23
  },
  {
    name: 'Scynk ognisty',
    species: 'Mochlus fernandi',
    categorySlug: 'gady',
    priceCents: 55900,
    stock: 3,
    description: 'Widowiskowy scynk do ciepłego terrarium z grubą warstwą podłoża, wilgotną kryjówką i spokojnym rytmem obsługi.',
    imageUrls: [imageBank.beardedDragon],
    taxRate: 23
  },
  {
    name: 'Wąż zbożowy Okeetee',
    species: 'Pantherophis guttatus',
    categorySlug: 'weze',
    priceCents: 27900,
    stock: 8,
    description: 'Jeden z najlepszych węży dla początkujących. Aktywny, odporny i łatwy w prowadzeniu przy poprawnej temperaturze i zabezpieczonym terrarium.',
    imageUrls: [imageBank.cornSnake],
    taxRate: 23
  },
  {
    name: 'Pyton królewski Pastel',
    species: 'Python regius',
    categorySlug: 'weze',
    priceCents: 64900,
    stock: 4,
    description: 'Popularna odmiana barwna regiusa dla osób, które chcą spokojnego węża o przewidywalnym temperamencie i eleganckim wyglądzie.',
    imageUrls: [imageBank.ballPython],
    taxRate: 23
  },
  {
    name: 'Lampropeltis californiae',
    species: 'Lampropeltis californiae',
    categorySlug: 'weze',
    priceCents: 44900,
    stock: 5,
    description: 'Kontrastowo wybarwiony wąż królewski dla opiekunów, którzy chcą aktywniejszego gatunku i dobrze zabezpieczonego setupu.',
    imageUrls: [imageBank.cornSnake],
    taxRate: 23
  },
  {
    name: 'Wąż mleczny Nelsona',
    species: 'Lampropeltis triangulum nelsoni',
    categorySlug: 'weze',
    priceCents: 46900,
    stock: 4,
    description: 'Kolorowy wąż mleczny dla osób szukających energicznego, ale przewidywalnego gatunku do kompaktowego terrarium naziemnego.',
    imageUrls: [imageBank.cornSnake],
    taxRate: 23
  },
  {
    name: 'Żółw stepowy Juvenile',
    species: 'Testudo horsfieldii',
    categorySlug: 'zolwie',
    priceCents: 69900,
    stock: 4,
    description: 'Młody żółw lądowy do suchego, dobrze doświetlonego wybiegu. Wymaga mocnego UVB, wysokiej temperatury w baskingu i zbilansowanej diety.',
    imageUrls: [imageBank.tortoise],
    taxRate: 23
  },
  {
    name: 'Żółw grecki Young Adult',
    species: 'Testudo hermanni',
    categorySlug: 'zolwie',
    priceCents: 75900,
    stock: 3,
    description: 'Żółw grecki do suchego wybiegu z rozbudowaną strefą aktywności. Dobrze sprawdza się u osób gotowych na długoterminową opiekę.',
    imageUrls: [imageBank.tortoise],
    taxRate: 23
  },
  {
    name: 'Żółw lamparci Juvenile',
    species: 'Stigmochelys pardalis',
    categorySlug: 'zolwie',
    priceCents: 89900,
    stock: 2,
    description: 'Młody żółw lamparci dla doświadczonych opiekunów, którzy planują duży wybieg, bardzo mocne UVB i konsekwentną suplementację.',
    imageUrls: [imageBank.tortoise],
    taxRate: 23
  },
  {
    name: 'Aksolotl meksykański Leucistic',
    species: 'Ambystoma mexicanum',
    categorySlug: 'plazy',
    priceCents: 14900,
    stock: 10,
    description: 'Wodny płaz o spokojnym temperamencie, najlepiej prowadzony w chłodniejszym akwarium bez silnego nurtu i z dużą ilością kryjówek.',
    imageUrls: [imageBank.axolotl],
    taxRate: 23
  },
  {
    name: 'Rzekotka australijska White\'s',
    species: 'Litoria caerulea',
    categorySlug: 'plazy',
    priceCents: 16900,
    stock: 8,
    description: 'Wytrzymała rzekotka o dużym apetycie i łagodnym charakterze. Dobrze sprawdza się w wilgotnym terrarium wertykalnym.',
    imageUrls: [imageBank.whiteFrog],
    taxRate: 23
  },
  {
    name: 'Drzewołaz błękitny Azureus',
    species: 'Dendrobates tinctorius azureus',
    categorySlug: 'plazy',
    priceCents: 29900,
    stock: 5,
    description: 'Efektowny drzewołaz do ustabilizowanego bioaktywnego terrarium. Wymaga wysokiej wilgotności, drobnego pokarmu i konsekwentnej obsługi.',
    imageUrls: [imageBank.dartFrog],
    taxRate: 23
  },
  {
    name: 'Kumak dalekowschodni',
    species: 'Bombina orientalis',
    categorySlug: 'plazy',
    priceCents: 11900,
    stock: 12,
    description: 'Żwawy płaz półwodny, świetny do ekspozycyjnych zbiorników z częścią lądową i płytką strefą wodną.',
    imageUrls: [imageBank.whiteFrog],
    taxRate: 23
  },
  {
    name: 'Ptasznik czerwonokolanowy',
    species: 'Brachypelma hamorii',
    categorySlug: 'pajaki',
    priceCents: 12900,
    stock: 6,
    description: 'Klasyczny, spokojny ptasznik naziemny często polecany jako pierwszy gatunek ze względu na przewidywalne zachowanie.',
    imageUrls: [imageBank.tarantula],
    taxRate: 23
  },
  {
    name: 'Ptasznik kędzierzawy',
    species: 'Tliltocatl albopilosus',
    categorySlug: 'pajaki',
    priceCents: 9900,
    stock: 7,
    description: 'Łagodny ptasznik o charakterystycznym skręconym owłosieniu, dobrze sprawdzający się w prostym naziemnym setupie.',
    imageUrls: [imageBank.tarantula],
    taxRate: 23
  },
  {
    name: 'Skakun królewski',
    species: 'Phidippus regius',
    categorySlug: 'pajaki',
    priceCents: 8900,
    stock: 11,
    description: 'Inteligentny, dzienny skakun do małego, jasnego terrarium. Dobry wybór dla osób, które chcą aktywnego bezkręgowca.',
    imageUrls: [imageBank.jumpingSpider],
    taxRate: 23
  },
  {
    name: 'Skorpion cesarski',
    species: 'Pandinus imperator',
    categorySlug: 'pajaki',
    priceCents: 21900,
    stock: 4,
    description: 'Duży skorpion ekspozycyjny do ciepłego terrarium z wilgotnym mikroklimatem, kryjówkami i grubym podłożem.',
    imageUrls: [imageBank.scorpion],
    taxRate: 23
  },
  {
    name: 'Terrarium szklane 60x45x45',
    species: 'Terrarium front opening',
    categorySlug: 'akcesoria',
    priceCents: 39900,
    stock: 12,
    description: 'Uniwersalne terrarium z frontowym dostępem i wydajną wentylacją, dobre dla gekonów, młodych agam i wielu bezkręgowców.',
    imageUrls: [imageBank.terrarium],
    taxRate: 23
  },
  {
    name: 'Terrarium pionowe 45x45x60',
    species: 'Terrarium wertykalne',
    categorySlug: 'akcesoria',
    priceCents: 45900,
    stock: 8,
    description: 'Pionowy setup pod gatunki nadrzewne, rzekotki i gekony orzęsione. Duży front, wentylacja i miejsce na roślinność.',
    imageUrls: [imageBank.terrarium],
    taxRate: 23
  },
  {
    name: 'Nanoterrarium 30x30x45',
    species: 'Terrarium pionowe',
    categorySlug: 'akcesoria',
    priceCents: 21900,
    stock: 10,
    description: 'Kompaktowe terrarium ekspozycyjne do skakunów, małych gekonów nadrzewnych i aranżacji roślinnych.',
    imageUrls: [imageBank.terrarium],
    taxRate: 23
  },
  {
    name: 'Zestaw startowy dla gekona lamparciego',
    species: 'Starter kit',
    categorySlug: 'akcesoria',
    priceCents: 69900,
    stock: 5,
    description: 'Kompletny zestaw: terrarium, ogrzewanie, miski, kryjówki i podstawowe wyposażenie potrzebne do bezpiecznego startu.',
    imageUrls: [imageBank.terrarium],
    taxRate: 23
  },
  {
    name: 'Mata grzewcza 28W',
    species: 'Ogrzewanie strefowe',
    categorySlug: 'ogrzewanie-i-oswietlenie',
    priceCents: 8900,
    stock: 18,
    description: 'Podstawowe źródło ciepła do terrariów wymagających ciepłej strefy dennej. Najlepiej pracuje w duecie z termostatem.',
    imageUrls: [imageBank.heatLamp],
    taxRate: 23
  },
  {
    name: 'Promiennik ceramiczny 100W',
    species: 'Ceramic heat emitter',
    categorySlug: 'ogrzewanie-i-oswietlenie',
    priceCents: 11900,
    stock: 14,
    description: 'Promiennik bez emisji światła do dogrzewania nocnego oraz budowania stabilnej temperatury w większych setupach.',
    imageUrls: [imageBank.heatLamp],
    taxRate: 23
  },
  {
    name: 'Lampa UVB T5 6%',
    species: 'Oświetlenie UVB',
    categorySlug: 'ogrzewanie-i-oswietlenie',
    priceCents: 14900,
    stock: 14,
    description: 'Świetlówka UVB do gatunków dziennych i półdziennych, wspierająca prawidłowy metabolizm wapnia i rytm dobowy.',
    imageUrls: [imageBank.heatLamp],
    taxRate: 23
  },
  {
    name: 'Termostat elektroniczny z sondą',
    species: 'Kontrola temperatury',
    categorySlug: 'ogrzewanie-i-oswietlenie',
    priceCents: 17900,
    stock: 16,
    description: 'Cyfrowy termostat do stabilnego prowadzenia mat, kabli i emiterów ciepła bez ryzyka przegrzania terrarium.',
    imageUrls: [imageBank.heatLamp],
    taxRate: 23
  },
  {
    name: 'Podłoże kokosowe premium 10 L',
    species: 'Podłoże terrarystyczne',
    categorySlug: 'podloza-i-dekoracje',
    priceCents: 2990,
    stock: 30,
    description: 'Naturalne podłoże utrzymujące wilgotność, sprawdzające się w terrariach tropikalnych i u wielu bezkręgowców.',
    imageUrls: [imageBank.terrarium],
    taxRate: 23
  },
  {
    name: 'Chipsy bukowe 10 L',
    species: 'Podłoże do terrariów suchych',
    categorySlug: 'podloza-i-dekoracje',
    priceCents: 2490,
    stock: 28,
    description: 'Suche, estetyczne podłoże do węży i wybranych jaszczurek pustynnych, łatwe w regularnej podmianie.',
    imageUrls: [imageBank.terrarium],
    taxRate: 23
  },
  {
    name: 'Kryjówka skalna XL',
    species: 'Dekoracja funkcjonalna',
    categorySlug: 'podloza-i-dekoracje',
    priceCents: 4990,
    stock: 22,
    description: 'Stabilna kryjówka zwiększająca poczucie bezpieczeństwa zwierzęcia i pomagająca organizować strefy w terrarium.',
    imageUrls: [imageBank.terrarium],
    taxRate: 23
  },
  {
    name: 'Konar mangrowy L',
    species: 'Dekoracja wspinaczkowa',
    categorySlug: 'podloza-i-dekoracje',
    priceCents: 8990,
    stock: 15,
    description: 'Naturalny konar do setupów nadrzewnych, bioaktywnych i półwodnych. Daje dodatkową powierzchnię użytkową i kryjówkową.',
    imageUrls: [imageBank.terrarium],
    taxRate: 23
  },
  {
    name: 'Tło strukturalne Jungle 60 cm',
    species: 'Tło terrarystyczne',
    categorySlug: 'podloza-i-dekoracje',
    priceCents: 13900,
    stock: 9,
    description: 'Lekkie tło 3D do poprawy estetyki i pionowej funkcjonalności terrarium tropikalnego lub leśnego.',
    imageUrls: [imageBank.terrarium],
    taxRate: 23
  },
  {
    name: 'Karaczan dubia XL - pakiet 50 szt.',
    species: 'Pokarm feeder',
    categorySlug: 'pokarm-i-suplementy',
    priceCents: 3490,
    stock: 26,
    description: 'Wysokiej jakości owady karmowe dla gadów i płazów owadożernych, pakowane pod bieżący obrót i szybką wysyłkę.',
    imageUrls: [imageBank.feederInsects],
    taxRate: 23
  },
  {
    name: 'Świerszcz kubański M - pakiet 100 szt.',
    species: 'Pokarm feeder',
    categorySlug: 'pokarm-i-suplementy',
    priceCents: 2490,
    stock: 40,
    description: 'Ruchliwy, świeży feeder dla gekonów, agam i młodych płazów. Dobry wybór do regularnego karmienia aktywnych zwierząt.',
    imageUrls: [imageBank.feederInsects],
    taxRate: 23
  },
  {
    name: 'Mącznik młynarek - pakiet 200 g',
    species: 'Pokarm feeder',
    categorySlug: 'pokarm-i-suplementy',
    priceCents: 1990,
    stock: 35,
    description: 'Klasyczny pokarm pomocniczy dla owadożerców, polecany jako uzupełnienie diety przy właściwej suplementacji.',
    imageUrls: [imageBank.feederInsects],
    taxRate: 23
  },
  {
    name: 'Wapń z D3 100 g',
    species: 'Suplement mineralny',
    categorySlug: 'pokarm-i-suplementy',
    priceCents: 2790,
    stock: 20,
    description: 'Podstawowy suplement dla gatunków wymagających regularnego podawania wapnia i wsparcia metabolizmu kostnego.',
    imageUrls: [imageBank.feederInsects],
    taxRate: 23
  },
  {
    name: 'Dieta kompletna dla gekonów orzęsionych 70 g',
    species: 'Dieta gotowa',
    categorySlug: 'pokarm-i-suplementy',
    priceCents: 3990,
    stock: 18,
    description: 'Gotowa dieta do regularnego podawania gekonom orzęsionym i innym gekonom owocowo-nektarowym.',
    imageUrls: [imageBank.feederInsects],
    taxRate: 23
  }
];

export { catalogCategories, catalogProducts };
