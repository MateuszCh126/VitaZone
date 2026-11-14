# VitaZone — design system i handoff

**Zakres:** istniejący storefront React/Vite, Tailwind CSS 3; refinement istniejącej czarno-zielonej marki. Nie jest to nowy brand ani migracja Tailwind.

## Tokeny

| Token | Wartość | Użycie |
|---|---|---|
| `bg` | RGB 5 5 5 (`#050505`) | główne tło |
| `bg-secondary` | RGB 15 15 15 (`#0f0f0f`) | odseparowane sekcje |
| `surface-raised` | RGB 22 26 23 | podniesione tło komponentu |
| `primary` | RGB 88 201 131 (`#58c983`) | CTA, fokus, akcent marki |
| `text` | RGB 255 255 255 | tekst główny |
| `muted` | RGB 156 163 175 | tekst pomocniczy |
| `rounded-card` | 16 px | listing/kategorie |
| `shadow-surface` | 0 12px 30px, czarny 24% | warstwa powierzchni; używać oszczędnie |
| `duration-quick` | 140 ms | hover/focus |
| `duration-standard` | 220 ms | spokojne przejście obrazu/układu |

Tekst pomocniczy używa co najmniej `gray-400` na czarnych powierzchniach. `gray-500` (#6b7280) na tle `#050505` ma kontrast około 4,22:1 i nie spełnia 4,5:1 dla zwykłego tekstu; `gray-400` (#9ca3af) ma około 8,03:1.

Używaj nazw Tailwind z `tailwind.config.js`; wartości kolorów są zakodowane jako RGB, by klasy z opacity (`text-primary/80`) działały spójnie. Nie dodawaj nowych odcieni zieleni do komponentu ad hoc.

## Układ i responsywność

Projekt używa standardowych breakpointów Tailwind:

- `<640 px`: jedna kolumna, CTA/listing pełnej szerokości; akcja dodania do koszyka zawsze widoczna.
- `640–767 px` (`sm`): większy oddech, nadal układ mobilny.
- `768–1023 px` (`md`): filtry poza głównym listingiem mogą pozostać schowane w disclosure; siatka produktów dwukolumnowa.
- `1024–1279 px` (`lg`): dwie kolumny w układzie treści hero sekcji informacyjnej.
- `1280 px+` (`xl`): listing trzykolumnowy; kategorie trzykolumnowe.

Kontenery trzymają się `container mx-auto`, z bocznym gutterem 16 px na telefonie i 24 px od `sm`.

## Elementy i interakcje

### Karta kategorii / produktu

- Kategoria: fotografia, gradient u dołu tylko dla kontrastu, tytuł jako link i neutralny opis. Promień 16 px. Zoom obrazu tylko 1.03 w 220 ms; kliknięcie prowadzi do kategorii.
- Produkt: cały tytuł/zdjęcie prowadzą do szczegółów. Przycisk koszyka ma nazwę dostępną dla czytnika. Na dotyku jest stale widoczny; na desktopie pokazuje się po hover albo focus-within.
- Nie renderuj badge popularności, opinii, dopasowania gatunkowego ani „dobrego na start” bez zweryfikowanego, produktowego źródła.
- JSON-LD `Product` może zawierać wyłącznie dane pokazane na karcie i potwierdzone przez API: nazwę, opis, zdjęcia, cenę z `price_cents` i dostępność ze stanu magazynowego. Nie mapuj technicznego ID na SKU; jeśli brakuje wymaganej ceny lub zdjęcia, pomiń schema. Przed osadzeniem danych w `<script>` escapuj znaki HTML.

### Inputy i filtry

- Widoczna etykieta poprzedza input/select. Błąd jest tekstem przy polu, `aria-invalid=true`, `aria-describedby` łączy pole z błędem.
- Focus klawiatury: 2 px w kolorze primary z 3 px offsetem, bez znikania na tle obrazu. Primary jest jednym tokenem dla akcentu i fokusu. Aktywne filtry używają `bg-primary/[0.08]`, obrysu `border-primary/70` i tekstu `text-primary`; nie dodają stałej poświaty.
- Równorzędne ścieżki zakupowe dostają równorzędną wagę wizualną. Na homepage oba linki używają obrysu i dyskretnej powierzchni; nie wyróżniać „pierwszego terrarium” jako sugerowanej decyzji bez danych.
- Aktywne filtry można zdejmować pojedynczo. Sortowanie katalogowe i cena mogą opierać się o obecny katalog; nowość wynika z `created_at`, nie z ręcznej popularności.
- Cel interaktywny: co najmniej 44×44 CSS px w ważnych elementach mobilnych; nie schodzić poniżej wymogu WCAG 2.2 24×24 px z wyjątkami.

### Cookie consent

- Region nie jest modalny, bo wybór nie blokuje strony.
- Równorzędne akcje: „Odrzuć analitykę”, „Dostosuj”, „Akceptuj analitykę”.
- Checkbox analityki jest natywny i ma opis. Niezbędne elementy są zawsze aktywne.

### Tło i ruch

- Nie renderować poświaty pod kursorem. Nawet ograniczony wariant był widoczny na dużych czarnych powierzchniach i odciągał uwagę od treści.
- Pływający launcher czatu nie ma stałego zielonego halo. Na `/register` ukrywa się poniżej breakpointu `sm` (640 px), by nie zasłaniać zgód i wysłania formularza. Zachować widoczny fokus klawiatury.
- Zielone cząsteczki występują wyłącznie w hero homepage, są `aria-hidden` i nie przechwytują pointera. Przy `prefers-reduced-motion: reduce` animacja jest wyłączona, a punkty pozostają statyczne.
- Czerwona kropka czatu oznacza tylko nieprzeczytaną, udaną odpowiedź. Otwarcie panelu czyści stan; kropka nie pulsuje.
- Nagłówki FAQ i dokumentów prawnych są jednolite, bez gradientowego wypełnienia tekstu. Akcenty publicznej warstwy korzystają z jednego tokenu `primary`.
- Żadna dekoracyjna animacja nie ma opóźniać widoczności produktu ani bloku decyzji.

## Dostępność i przegląd ręczny

Build/testy kodu nie zastępują sprawdzenia wyrenderowanego widoku. W tej iteracji na lokalnym Vite obejrzano homepage, FAQ i Kontakt; Playwright renderuje wszystkie trasy na mockach. `pnpm test:e2e` przeszedł 21 scenariuszy, w tym testy tras na wąskim viewport i reflow przy 200-procentowym ekwiwalencie. Nie sprawdzono fizycznych urządzeń, czytnika ekranu ani rzeczywistego zoomu 200%.

Przed końcowym odbiorem sprawdzić homepage, listing, produkt, koszyk i checkout przy 360, 768 i 1440 px; powiększenie 200%; tab/shift-tab/enter/space; widoczność fokusu; screen reader; kontrast; reduced motion; brak hover na dotyku; długie polskie nazwy i stany pustego listingu. Zrzuty robione na mockach potwierdzają lokalne renderowanie, nie rzeczywiste dane produktu ani backend.

## Otwarte ograniczenia

Sklep nie został zweryfikowany z prawdziwym backendem ani bazą danych; Playwright używa jawnych danych demonstracyjnych. Zrzut użytkownika pokazuje stan sprzed zmian, nie dowodzi jakości po zmianach. Zdjęcia zewnętrzne i przypisanie obrazu do konkretnego wariantu nadal trzeba potwierdzić z właścicielem.
