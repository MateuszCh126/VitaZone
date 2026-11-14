# VitaZone — design system i handoff

**Zakres:** istniejący storefront React/Vite, Tailwind CSS 3; refinement istniejącej czarno-zielonej marki. Nie jest to nowy brand ani migracja Tailwind.

## Tokeny

| Token | Wartość | Użycie |
|---|---|---|
| `bg` | RGB 5 5 5 (`#050505`) | główne tło |
| `bg-secondary` | RGB 15 15 15 (`#0f0f0f`) | odseparowane sekcje |
| `surface-raised` | RGB 22 26 23 | podniesione tło komponentu |
| `primary` | RGB 0 255 136 (`#00ff88`) | CTA, fokus, akcent marki |
| `text` | RGB 255 255 255 | tekst główny |
| `muted` | RGB 156 163 175 | tekst pomocniczy |
| `rounded-card` | 16 px | listing/kategorie |
| `shadow-surface` | 0 12px 30px, czarny 24% | warstwa powierzchni; używać oszczędnie |
| `shadow-glow` | 0 0 22px, primary 10% | tylko skupiony stan marki, nie podświetlenie całego ekranu |
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
- Focus: 2 px w kolorze primary z 3 px offsetem, bez znikania na tle obrazu.
- Aktywne filtry można zdejmować pojedynczo. Sortowanie katalogowe i cena mogą opierać się o obecny katalog; nowość wynika z `created_at`, nie z ręcznej popularności.
- Cel interaktywny: co najmniej 44×44 CSS px w ważnych elementach mobilnych; nie schodzić poniżej wymogu WCAG 2.2 24×24 px z wyjątkami.

### Cookie consent

- Region nie jest modalny, bo wybór nie blokuje strony.
- Równorzędne akcje: „Odrzuć analitykę”, „Dostosuj”, „Akceptuj analitykę”.
- Checkbox analityki jest natywny i ma opis. Niezbędne elementy są zawsze aktywne.

### Tło i ruch

- Halo kursora 96×96 px, `primary/3`, blur 32 px, bez screen blending i bez opacity layer. Ograniczone do `md` i precyzyjnego wskaźnika. Efekt ma być prawie niewidocznym tłem, nie plamą przykrywającą treść; usuń go, jeśli w realnym renderze nadal odciąga uwagę.
- Ciągłe cząsteczki zostały usunięte z powierzchni sklepu. Ograniczone ruchy systemowe dostają globalny override animacji i transitionów; ambient effects nie są ładowane, gdy `prefers-reduced-motion: reduce` jest aktywne.
- Żadna dekoracyjna animacja nie ma opóźniać widoczności produktu ani bloku decyzji.

## Dostępność i przegląd ręczny

Build/testy kodu nie zastępują sprawdzenia wyrenderowanego widoku. Na lokalnym Vite z mockowanym API demo obejrzano zrzuty strony głównej (1440 px, normalny i ograniczony ruch), listingu (390 px), karty produktu (1440 i 390 px), koszyka oraz checkoutu (390 px). Playwright przeszedł 12 scenariuszy, w tym zakup gościa, walidację checkoutu i przekazanie fokusu między krokami, focus management ustawień cookies, menu mobilne, etykiety i błędy formularzy oraz koszyk. Scenariusz reflow sprawdza ścieżkę zakupową przy 720 i 360 px bez poziomego przewijania; nie zastępuje on rzeczywistego powiększenia 200%. Nie sprawdzono fizycznych urządzeń, czytnika ekranu ani pełnej ręcznej nawigacji klawiaturą.

Przed końcowym odbiorem sprawdzić homepage, listing, produkt, koszyk i checkout przy 360, 768 i 1440 px; powiększenie 200%; tab/shift-tab/enter/space; widoczność fokusu; screen reader; kontrast; reduced motion; brak hover na dotyku; długie polskie nazwy i stany pustego listingu. Zrzuty robione na mockach potwierdzają lokalne renderowanie, nie rzeczywiste dane produktu ani backend.

## Otwarte ograniczenia

Sklep nie został zweryfikowany z prawdziwym backendem ani bazą danych; Playwright używa jawnych danych demonstracyjnych. Zrzut użytkownika pokazuje stan sprzed zmian, nie dowodzi jakości po zmianach. Zdjęcia zewnętrzne i przypisanie obrazu do konkretnego wariantu nadal trzeba potwierdzić z właścicielem.
