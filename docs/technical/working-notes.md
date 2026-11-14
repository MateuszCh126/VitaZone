# VitaZone — notatki robocze audytu

> Plik utrzymuje ciągłość prac nad dokumentacją stanu faktycznego i planem rozwoju. Ustalenia poniżej są robocze; przed publikacją należy je porównać z finalnym audytem, testami i bieżącym PR.

## Stan repozytorium

- Data wznowienia: 2026-11-14.
- Checkout: `C:\Users\gamin\.codex\worktrees\vitazone-visual-refresh\vitazone-audit-2026-11-13`.
- Gałąź: `codex/vitazone-visual-refresh`; PR #2 jest otwartym draftem.
- HEAD na początku audytu: `7ffb66064bd0e119a15875a1fdca87e9a7f64cb0`.
- PR #1 (`codex/vitazone-trust-checkout`) został scalony squashem 2026-11-14 jako commit `43d5487ffa9e9242d5b990918aafee0074fdb5fb`.
- **Nie scalać niczego do `main`** w trakcie tego zadania. Kod i dokumentację przygotowywać wyłącznie na gałęzi PR #2; użytkownik wyraźnie dopuścił zmiany kodu i większe korekty na tej gałęzi.
- Nie znaleziono `AGENTS.md`, `docs/README.md` ani przenośnego standardu Codexa w bieżącym checkoutcie. Zasady przekazane przez użytkownika w rozmowie nadal obowiązują: chronić cudze zmiany, nie ujawniać sekretów, używać danych demo, nie wdrażać i nie scalać bez polecenia.
- Checkout był czysty przed rozpoczęciem tego audytu. Przed każdym zapisem sprawdzać `git status`.

## Kierunek produktu i designu

- Priorytet właściciela: profesjonalna architektura plików, PostgreSQL i przepływy danych, jakość porównywalna z pracą doświadczonego zespołu; dokumentacja ma opisywać stan faktyczny oraz prowadzić do wdrożenia.
- Zachować czerń i zieleń jako motyw dżungli. Poprawiać hierarchię, zdjęcia, typografię, rytm i spokojne użycie zieleni; unikać dekoracyjnego „AI slop”. W bazowym HEAD poświata miała 144×144 px, `primary/5`, blur 48 px; w tym audycie zmniejszono ją do 96×96 px, `primary/3`, blur 32 px.
- Można zmieniać kod i strukturę w PR #2, jeśli wynikają z udokumentowanych ustaleń. Nie wykonywać migracji ani operacji na prawdziwej bazie produkcyjnej.
- Nie przedstawiać hipotez, benchmarków ani danych demonstracyjnych jako wyników klientów VitaZone.

## Dostępne i zastosowane workflows

Przegląd rozpoczęto z użyciem skilli: `user-research`, `research-synthesis`, `design-critique`, `accessibility-review`, `design-system`, `design-handoff`, `frontend-design`, `ux-copy`, `seo-ecommerce`, `seo-technical`, `schema`, `web-perf`, `vercel-react-best-practices`, `tailwind-design-system` i `webapp-testing`. Część jest warunkowa: badania syntezuje się dopiero po otrzymaniu danych klientów; pomiary Core Web Vitals wymagają pomiarów runtime/field; Tailwind skill opisuje v4, podczas gdy repo używa Tailwind 3.4, więc nie należy przenosić konfiguracji v4.

Do dokumentacji zastosować podział Diátaxis (wyjaśnienie stanu, referencja modułów i API, plan/how-to) oraz widoki architektury C4 odpowiednie do wielkości systemu. Nie opisywać nieistniejących testów ani obserwacji runtime jako wykonanych.

## Zebrane fakty techniczne

- Aplikacja to React 19 + Vite SPA, Express 5 API uruchamiane lokalnie z `server.js` i eksportowane dla Vercel z `api/index.js`, PostgreSQL przez `pg`, Stripe Checkout, Resend, Gemini, Vercel Analytics/Speed Insights i Tailwind 3.4.
- `src/App.jsx` definiuje router, providery sesji/koszyka, lazy-load stron i opóźnione widgety. `vite.config.js` ma dynamiczne route chunks i ręczne osobne chunki ikon/Vercel.
- Backend ma routes, repositories, schemas, controllers/services oraz SQL/migracje; warstwy nie są wszędzie jednolite (np. admin route z SQL bezpośrednio; część logiki transakcyjnej znajduje się w order repository).
- Publiczne produkty są ładowane po stronie klienta. Sitemap obecnie wymienia głównie statyczne strony i nie zawiera adresów produktów; canonical/title/schema produktu powstają po fetchu w kliencie. Potrzebny wybór SSR/SSG/prerender oraz generowania sitemap z aktywnego katalogu.
- `src/components/ProductModal.jsx` ma pola admina z `<label>` bez powiązania `htmlFor`/`id` według audytu.
- `ProductModal` nie ma też semantyki modalnego dialogu ani obsługi fokusu: brak `role="dialog"`, `aria-modal`, `aria-labelledby`, autofocus/focus trap, Escape i zwrotu fokusu. Porównać z `CartDrawer`/mobilnym menu przed wdrożeniem.
- Handoff design-system wskazuje, że `gray-500` nie spełnia kontrastu na czarnym tle. W tej iteracji widoczne `text-gray-500` zamieniono na jaśniejszy tekst; pozostałe użycia są dekoracyjnymi kropkami statusu czatu.
- Product JSON-LD dopuszcza `priceCents === 0`; dodać warunek/test zgodny z widoczną ofertą i wymaganiami Google.
- API publicznego katalogu przyjmuje page/limit bez jednoznacznego limitu maksymalnego; widoki list użytkowników/zamówień administracyjnych oraz historii mogą zwracać całość.
- Rate limiting jest konfigurowany lokalnie w procesie; dla wielu instancji/serverless limit może nie być globalny. Zweryfikować wymagany poziom ochrony przed ustawieniem docelowym.
- `DOCUMENTATION.md` zawiera historyczne i w części niepotwierdzone twierdzenia („Production Ready”, rozbieżne opisy JWT/API i kategoryczne twierdzenie o zwrocie żywych zwierząt). Oznaczyć go jako nieautorytatywny albo uporządkować; źródłem wdrożeniowym mają być świeże dokumenty oparte na kodzie.
- Brak `docs/README.md`/indeksu dokumentacji. Root README opisuje `npm install` i obecność `package-lock.json`, podczas gdy projekt deklaruje pnpm i `pnpm-lock.yaml`; wybrać jeden manager i udokumentować politykę lockfile.
- Nie znaleziono listenera na portach 3000, 4173, 4174, 4181, 4182, 5173 w pierwszej inspekcji. Pełny serwer API wymaga `DATABASE_URL` i `JWT_SECRET`; nie uruchamiać na środowisku z nieweryfikowanym `.env` ani realną bazą. Do review przeglądarkowego używać izolowanych fixture/mocks.
- Nie stwierdzono browser trace ani bieżących pomiarów CWV. Nie ma field analytics dostępnych w repo.

## Raporty subagentów (read-only, Luna)

### Dostępność / SEO / testy

- PR #2 ma testy Playwright dla flow sklepu, ale nie znaleziono automatycznego skanera WCAG/axe, testów kontrastu ani testów surowego HTML/sitemap/canonical dla bezpośredniego requestu produktu.
- E2E określa szerokości 720/360 px jako odpowiednik reflow; to nie jest rzeczywisty browser zoom 200%.
- Dobre istniejące elementy: tokeny black/green, global focus-visible i reduced motion, mobilna nawigacja z obsługą klawiatury, etykiety/błędy w checkout i focus management koszyka/cookies.
- Pierwotny audyt statyczny znalazł kontrast checkout (`src/pages/Checkout.jsx`), brak dostępnych nazw `ProductModal`, produktowe JSON-LD z ceną 0 oraz CSR-only meta/schema i niepełną sitemapę (`public/sitemap.xml`). Kontrast, modal i JSON-LD poprawiono; ograniczenie SEO pozostaje do planowanej przebudowy.
- Agent nie uruchamiał aplikacji ani testów; wnioski są statyczne.

### Copy / treść wszystkich głównych ekranów

- Strona główna ma dwie ścieżki zakupowe, ale etykieta ścieżki pierwszego terrarium może sugerować kompletność, podczas gdy prowadzi tylko do kategorii; walidować w badaniu.
- Katalog powtarza komunikat o błędzie w banerze i stanie pustym.
- `/about` opisuje sposób używania sklepu, nie zweryfikowaną historię firmy/atuty.
- `/contact` ukrywa właściwy e-mail za ogólnym CTA; e-mail nie został potwierdzony.
- FAQ nie może podać warunków dostawy, póki właściciel nie zweryfikuje logistyki.
- Checkout: nienaturalne „Bezpieczna kasa”, anglicyzm „checkout” w pustym stanie/błędzie, literówka „polaczenie”; copy o bezpieczeństwie jest ogólne.
- Dashboard CTA „Zwróć” tylko otwiera przygotowaną wiadomość e-mail; powinno odzwierciedlać rzeczywisty skutek. „Zgłoś problem” również otwiera mailto.
- Admin ma statyczny komunikat „Status sklepu: Aktywny”.
- Dokumenty prawne są wyraźnie oznaczone jako wersje robocze i nie mogą być traktowane jako gotowe do sprzedaży.
- Login „kolekcja” nie pasuje do produktu; rejestracja ma kapitalizację „Dołącz do Nas”, słowo „pupil” i niezweryfikowaną obietnicę „bezpieczne konto”.
- Te rekomendacje pochodzą z audytu copy w kodzie; bez danych klientów nie są twierdzeniami o konwersji ani reprezentatywnymi wynikami badania.

### Architektura / wydajność / bezpieczeństwo

- Brak jednolitej warstwy use-case/service dla wszystkich domen; `routes/adminRoutes.js` ma SQL, a `repositories/orderRepository.js` łączy dostęp do danych z orkiestracją transakcji i częścią kompatybilności schematu.
- Ograniczyć i walidować parametry katalogu (`routes/catalogRoutes.js:11-16`, `repositories/productRepository.js:4-15`); paginować admin collections i historię użytkownika (`routes/adminRoutes.js:95-102,160-185`, `repositories/orderRepository.js:351-421`).
- Shipping quote wzywa usługi wielokrotnie i szeregowo (`server/services/shippingService.js:116-140`, `server/services/shipping/furgonetkaClient.js:47-58`); rozważyć cache/reuse w ramach requestu i równoległe wyceny po sprawdzeniu limitów providera.
- Upload obrazu do 5 MB jest chroniony adminem, ale tworzy base64 w odpowiedzi (`server/services/storageService.js:10-21`, `server/services/imageService.js:3-19`); rozważyć object storage tylko jeśli produktowe użycie uzasadnia.
- Nie twierdzić, że znaleziono SQL injection/penetracyjne problemy; audyt nie był testem penetracyjnym. Utrzymać parametryzowane zapytania, rolę CSRF/CORS, cookie flags i weryfikację webhooka.
- Źródłowy audyt nie mierzył wydajności runtime ani produkcyjnej bazy/providera.

## Zewnętrzne źródła do cytowania

- Diátaxis: https://diataxis.fr/ — cztery typy dokumentacji: tutorial, how-to, explanation, reference.
- C4: https://c4model.com/introduction — kontekst, kontenery, komponenty i kod jako mapy architektury; używać tylko poziomów potrzebnych czytelnikom.
- React Suspense: https://react.dev/reference/react/Suspense — lazy-loaded code może aktywować granicę Suspense.
- WCAG 2.2: https://www.w3.org/TR/WCAG22/ — docelowy standard przeglądu dostępności.
- Google Product structured data: https://developers.google.com/search/docs/specialty/ecommerce/include-structured-data-relevant-to-ecommerce — dane strukturalne mają odpowiadać widocznej aktualnej ofercie.
- Core Web Vitals: https://web.dev/articles/defining-core-web-vitals-thresholds — LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 jako progi p75, nie pojedynczy wynik lab.
- UOKiK, informacje w umowach na odległość: https://prawakonsumenta.uokik.gov.pl/prawo-do-informacji/sprzedaz-poza-lokalem-i-na-odleglosc/ — przed publikacją wymaga weryfikacji przez prawnika dla konkretnych warunków sklepu.
- Tekst jednolity ustawy o prawach konsumenta (Dz.U. 2026 poz. 1244): https://eli.gov.pl/api/acts/DU/2026/1244/text/U/D20261244Lj.pdf — aktualny oficjalny tekst widziany 2026-11-14; notatka nie jest opinią prawną.

## Następne czynności

1. Otrzymać i scalić raporty subagentów (bez przekazywania im prawa edycji); uzupełnić je własną inspekcją źródeł i stron.
2. Zweryfikować szczegóły architektury PostgreSQL: schemat, klucze, indeksy, migracje, status order/payment, rezerwacje, izolacja i raportowalność.
3. Wykonano izolowany mobile smoke review 16 tras na mockach; wcześniej istniejący visual review obejrzał zrzuty wybranych ekranów desktop/mobile. Pełny, ręczny przegląd wszystkich widoków i stanów nadal jest potrzebny.
4. Sprawdzić Vercel CLI/GitHub read-only i aktualną listę PR, nie zmieniać zewnętrznego stanu.
5. Utworzyć dokument stanu faktycznego i plan wdrożenia z file map, route map, C4/data-flow, tabelą produktów roboczych, testami odbioru, etapami z zależnościami i ryzykami.
6. Zaimplementowano część potwierdzonych poprawek wysokiego priorytetu na PR #2: kontrast, etykiety i focus management dialogu admina, nieprawidłowe JSON-LD, teksty checkoutu i panelu, bramkę legacy resetu DB, wyciszone halo i pojedynczy komunikat błędu katalogu. Cały bieżący zestaw weryfikacji przeszedł (wyniki niżej). Nie scalać niczego do `main` ani nie wdrażać.
7. Utworzono indeks dokumentacji i oznaczono stary handbook jako historyczny/nieautorytatywny.

## Wyniki poprzedniej weryfikacji — 2026-11-14

- `pnpm exec vitest run` — 16 plików, 78 testów zaliczonych.
- `pnpm lint` — zaliczone bez błędów.
- `pnpm build` — zaliczone; Vite ostrzegł o starej bazie Browserslist/caniuse-lite (11 miesięcy).
- `pnpm check:secrets` — zaliczone.
- `$env:PLAYWRIGHT_PORT = '4182'; pnpm test:e2e` — 14/14 scenariuszy na Chromium i fixture API demo, w tym przejście wszystkich 16 tras na szerokości 390 px bez błędu React/overflow oraz pojedynczy stan błędu katalogu.
- `git diff --check` — zaliczone; Git wypisał wyłącznie ostrzeżenia o przyszłej konwersji LF → CRLF dla plików roboczych.
- Poprzedni lokalny render miał jeszcze halo kursora; został zastąpiony aktualnym renderem po jego całkowitym usunięciu (szczegóły w uzupełnieniu poniżej).
- E2E nie weryfikuje produkcyjnych API, prawdziwych metod Stripe, Furgonetki ani rzeczywistej transakcji. Nie wykonano czytnika ekranu, zoomu przeglądarki 200%, testu na fizycznym urządzeniu ani pomiarów polowych.
- Nie wykonano `pnpm migrate`, nie łączono się z bazą produkcyjną i nie wdrażano.

## Zmiany w poprzednim audycie

- Utworzono `docs/README.md` i `docs/technical/current-state-and-roadmap.md`, a `DOCUMENTATION.md` oznaczono jako historyczny/nieautorytatywny.
- Wcześniejszy stan zmniejszył poświatę do 96×96 px; po następnym render review komponent został usunięty.
- Katalog nie renderuje już drugiej pustej wiadomości przy aktywnym błędzie API.
- Wyniki bieżących kontroli zapisane powyżej; PR #2 pozostaje draftem, bez merge do `main` i bez deploymentu.

## Uzupełnienie audytu tras i aktualnego kodu — 2026-11-14

- Ostatni zapis powyżej dotyczy wcześniejszego stanu PR. Po kolejnych zmianach uruchom kontrole ponownie; nie przypisuj wcześniejszych liczb nowym plikom.
- Render lokalny obejmował 16 tras × dwa viewporty (1365×900 oraz 390×844), wyłącznie fikcyjne dane/API. Nie zaobserwowano błędów strony ani poziomego overflow w tych 32 stanach. Pełne ograniczenia są w [audycie tras](route-audit.md).
- Po ocenie renderu nawet zmniejszony bloom nadal był widoczny na czarnych obszarach: `MouseGlow` usunięto z `App` i repozytorium. H1 strony głównej skrócono; login/rejestracja mają jednolite powierzchnie; checkout bez pozycji nie pokazuje formularza; historia bez zamówień ma stan pusty; prod ErrorBoundary nie ujawnia stack trace.
- Statyczny przegląd bazy znalazł różnice między `schema.sql` a kolumnami runtime, pomijanie SQL w migration runnerze, szeroką odpowiedź statystyk admina, nieograniczone listy, współbieżność koszyka i niejednolitą obsługę błędów skryptów. Nie łączono się z DB ani nie uruchamiano migracji; szczegóły są w sekcji 7 planu technicznego.
- Checkout i konta/admina testowane są tylko na mockach; aktywne metody płatności, umowy przewoźników, legalność 18+, zdjęcia i dane firmy wymagają właścicielskiego potwierdzenia.

### Najnowsza weryfikacja po zmianach

- `pnpm exec vitest run` — 16 plików, 79 testów przeszło.
- `$env:PLAYWRIGHT_PORT='4182'; pnpm test:e2e` — 17/17 przeszło na Chromium z API demo; obejmuje pusty checkout, pustą historię konta i admina na koncie mock.
- `pnpm lint` — przeszło bez błędów i ostrzeżeń po dodaniu brakującego importu `beforeEach` w teście checkoutu.
- `pnpm build` — przeszło; pozostaje ostrzeżenie o starej bazie Browserslist/caniuse-lite (11 miesięcy).
- `pnpm check:secrets` — przeszło. `git diff --check` — przeszło, z ostrzeżeniami Git o przyszłej konwersji LF→CRLF.
- Wykonano punktowy screenshot strony głównej 1440×900 po usunięciu `MouseGlow`; na tym renderze poświata kursora nie występuje. Nie jest to pełny test interakcji ani dowód produkcyjnego zachowania.
- E2E zgłosiło `ECONNREFUSED` w proxy Vite dla `/api/cart` i `/api/categories` przed mockami, ale 17/17 asercji zakończyło się powodzeniem. Żaden test nie zależy od prawdziwego API.

## Wznowienie dokumentacji — 2026-11-14

- Stan Git potwierdzony na branchu `codex/vitazone-visual-refresh`, HEAD `92b8ad4`; dwie wcześniejsze edycje `current-state-and-roadmap.md` i `route-audit.md` zachowano.
- Ścieżka `docs/README.md` istnieje w aktualnym checkoutcie. Starsze zdanie wyżej, że indeksu nie znaleziono, opisuje wcześniejszy checkout i nie jest aktualnym stanem.
- Dodano [referencję kodu](codebase-reference.md), [inwentarz skilli i narzędzi](engineering-tooling-inventory.md) oraz [plan techniczny](../superpowers/plans/2026-11-14-vitazone-engineering-roadmap.md). Są to dokumenty lokalne, jeszcze nie commitowane/pushowane.
- Potwierdzono 149 katalogów skilli w `C:\Users\gamin\.agents\skills` i 494 narzędzia w sesji. Liczba narzędzi jest migawką; opis inwentarza odróżnia użyte, tylko dostępne i nieadekwatne. Nie wczytywano instrukcji wszystkich 149 niezwiązanych domen.
- Odświeżono legal source date do 2026-11-14; ELI wskazuje Dz.U. 2026 poz. 1244 jako tekst jednolity ustawy o prawach konsumenta, obowiązujący w stanie na 2026-09-02. To nie jest opinia prawna.
- Nie uruchomiono nowego test suite dla zmian dokumentacyjnych. `git diff --check` wykonano i nie zgłosił błędów whitespace; pozostały jedynie ostrzeżenia Git LF→CRLF na dwóch wcześniejszych plikach.
- Następny krok: sprawdzić pokrycie rejestru plików i tras względem repo/routera, naprawić nieaktualne/niedokładne wpisy, następnie wykonać review dokumentacji i lokalnych zmian. Nic nie scalać do `main` ani nie wdrażać.

## Kontrola PR #3 na prośbę właściciela — 2026-11-14

- PR #3 `Draft: Add 3D terrarium configurator` (`codex/terrarium-configurator-3d` → `main`) pozostaje `OPEN` i draftem; head `35172bd2e9737c3223e66a6575c2560c83328498`, base `43d5487ffa9e9242d5b990918aafee0074fdb5fb`.
- `gh pr view 3` zwracał `mergeable: CONFLICTING`; API `mergeable_state: dirty`; `gh pr checks 3` raportował brak checków. Zmiana obejmuje 47 plików (+4,242/-28), więc nie była bezpieczna do automatycznego squash merge.
- Read-only `git merge-tree --write-tree origin/main refs/remotes/origin/pr-3` względem aktualnego `origin/main` wykazał konflikty treści w `repositories/orderRepository.js`, `routes/stripeRoutes.js`, `server/controllers/stripeController.js`, `src/App.jsx`, `src/components/ProductModal.jsx`. Niczego nie łączono ani nie rozwiązywano.
- Wniosek: warunek właściciela „jeśli bez konfliktu” nie zachodzi; PR #3 nie został scalony. Branch PR #2 pozostaje bieżącym worktree.

## Poprawki backendu po audycie — 2026-11-14

- Test-first dla helpera HTML, schematu czatu i timeoutu Furgonetki: pierwsze uruchomienie celowo nie przechodziło, bo nie było escapera, schema przyjmowała `system`, a client nie przekazywał sygnału ani deadline.
- Zmiany na branchu: `server/services/emailHtml.js` escapuje tekst; `emailService.js` używa go dla dynamicznego HTML, normalizuje ilość i nie loguje e-maila odbiorcy przy wyłączonym Resend. `schemas/chatSchema.js` odrzuca rolę `system`. Klient Furgonetki przekazuje `AbortSignal` i ma twardy deadline; timeout można ustawić przez `FURGONETKA_TIMEOUT_MS` (default 10 s).
- Skorygowano `server/services/shipping/README.md`: stary opis przypisywał kodowi package/label creation i zmienny host API, których bieżący adapter nie implementuje.
- Weryfikacja: `pnpm exec vitest run tests/unit/emailHtml.test.js tests/unit/emailService.test.js tests/unit/chatSchema.test.js tests/unit/furgonetkaClient.test.js` — 4 pliki, 10 testów passed. `pnpm lint` — exit 0, bez warningów.
- Pełny test suite/build/E2E/secrets scan po tej poprawce jest nadal do wykonania. Brak wywołań prawdziwych providerów, bazy i deploymentu.

## Krytyka wizualna „O sklepie” i nawigacja klawiaturą — 2026-11-14

- Zrzuty lokalne 1440×900 oraz 390×844 potwierdziły, że `/about` składał się z kilku powtarzanych kart i powtórzonego opisu zakupu. Zastąpiono je redakcyjnym H1, rzeczową listą działów, jedną krótką ścieżką 3 kroków i działającym linkiem do katalogu. Nie użyto niezatwierdzonych zdjęć/historii firmy ani animacji/poświaty.
- Po oględzinach struktury wykryto zagnieżdżony `<main>` na `/about` oraz brak skip linku. Page używa teraz jednego wspólnego landmarku, a app shell ma widoczny po fokusie link „Przejdź do treści”.
- Test red/green: przed dodaniem linku `pnpm exec playwright test -g "keeps one main landmark"` zakończył się błędem braku skip linku; po zmianie przeszedł 1/1. Test weryfikuje Tab → link → Enter → fokus `#main-content`.
- Ręczny render/screenshot na lokalnym Vite sprawdzono przy 1440×900 i 390×844 z zapisaną decyzją odmowy analityki w przeglądarce testowej. Brak `pageerror`, `scrollWidth` równe viewportowi. Zrzuty pozostały w systemowym Temp, poza repo.
- Pełny Vitest/build/lint/secret scan/E2E należy uruchomić ponownie po tej zmianie UI; ostatni pełny run poprzedzał dodanie skip linku i nowego About layout.

## Punkt wznowienia przed pauzą — 2026-11-14

- Użytkownik poprosił o pauzę. Kontynuować na worktree `C:\Users\gamin\.codex\worktrees\vitazone-visual-refresh\vitazone-audit-2026-11-13`, branch `codex/vitazone-visual-refresh` (PR #2). Nie scalać do `main` ani nie wdrażać. PR #2 był ostatnio otwarty jako draft i `MERGEABLE`; stan sprawdzić ponownie przed jakąkolwiek publikacją.
- Przed tą pauzą wykonano trzy read-only audyty subagentami `gpt-6-luna`: architektura/DB, 16 tras/treści/widoki, checkout/płatności/dostawa. Raporty są w kontekście rozmowy. Ważne dopiski: runner odkrywa każdy `migrate_*.js`/`run_migration_*.js` (w tym historyczne `migrate_v2`–`v4` i `migrate_names`); ścieżka Stripe nie przekazuje obsługiwanego przez repo klucza idempotencji; niejednoznaczny wynik Stripe może kolidować ze zwolnieniem rezerwacji stocku; obraz „Węże” jest botaniczny; launcher czatu nachodzi na zgodę/newsletter przy rejestracji.
- Wdrożono lokalnie dwie poprawki wyglądu/interakcji na PR #2: oba CTA ścieżek zakupowych mają równą wagę; launcher czatu jest ukryty na telefonie na `/register`, a stały zielony `shadow-glow` zastąpiono neutralnym cieniem i widocznym fokusowaniem. Zmieniono też `tests/e2e/storefront.spec.js` o testy tych założeń i niezasłaniania akcji checkoutu na 360 px.
- TDD: test równych CTA najpierw wykazał różnicę między pełnym zielonym wypełnieniem a obrysem, potem przeszedł. Test zasłaniania newslettera najpierw wykrył kolizję po załadowaniu odroczonego widgetu, potem przeszedł po ukryciu launchera na małych ekranach `/register`. Test stałej zielonej poświaty najpierw wykrył `rgba(0, 255, 136, 0.1)`, potem przeszedł po zmianie cienia.
- Ostatni wąski run Playwright: `$env:PLAYWRIGHT_PORT='4182'; pnpm exec playwright test -g 'equal visual weight|mobile chat launcher clear|permanent green halo|reflows shopping and checkout'` — 4/4 passed. Pojawiały się tylko ostrzeżenia `NO_COLOR`/`FORCE_COLOR` i przestarzała baza Browserslist (`caniuse-lite` 11 miesięcy). Pełny zestaw po tych zmianach nie został jeszcze odpalony.
- Lokalny, fikcyjny smoke render objął 16 tras × desktop 1440×1000 i telefon 390×844 (32 zrzuty w `C:\Users\gamin\AppData\Local\Temp\vitazone-route-audit`). Każdy widok miał jeden `h1` i jeden `main`, brak `pageerror` i poziomego overflow. Oczekiwane 401 dla wylogowanej sesji pochodziły z mocka. Jedno `currentSrc` było puste dla obrazu lazy-load na mobilnej stronie głównej, ponieważ skrypt nie przewinął strony przed pełnostronicowym screenshotem; nie uznawać tego za potwierdzony brak assetu. Screenshoty mają tylko fixture/demo i nie potwierdzają produkcyjnej oferty.
- Powyższa lista opisywała stan w chwili pauzy. Po wznowieniu część dokumentów/planów została zaktualizowana, a testy pełne wykonano; pozostają końcowy przegląd diffu i dokumentów.
- Bieżący stan zmienionych plików źródłowych obejmuje wcześniejsze niecommitowane poprawki z tej sesji oraz `src/pages/Home.jsx`, `src/components/ChatWidget.jsx`, `tests/e2e/storefront.spec.js`; nie wykonano commit/push/merge/deploy.

## Wznowienie i pełna weryfikacja — 2026-11-14

- PR #2 sprawdzono przez `gh pr view 2`: `OPEN`, draft, `MERGEABLE`, head `codex/vitazone-visual-refresh`, base `codex/vitazone-trust-checkout`. Bez merge i deploymentu.
- Aktualizacja dokumentacji: dopisano testową obserwację równych CTA, brak stałego halo, launcher rejestracji ukryty poniżej 640 px, niejednoznaczny lazy-load screenshot, oraz braki źródeł fotografii; rozbudowano ryzyko Stripe (rezerwacja stock przed Checkout Session i brak idempotency handoff); skorygowano GitHub connector z 15 na 89 narzędzi; dodano ADR migracji PostgreSQL ze statusem `Proposed`.
- Pierwszy pełny Vitest po zmianie `ChatWidget` wykrył, że komponent używa `useLocation`, a test jednostkowy nie montował go pod routerem. Zmieniono test, aby używał `MemoryRouter`; ponowny `pnpm exec vitest run` przeszedł: 20 plików, 89 testów.
- `pnpm lint` — pierwsza równoległa próba dostała `ENOENT` dla katalogu Playwright `test-results`, który runner równolegle sprzątał. Powtórzony samodzielnie po zakończeniu E2E: exit 0, bez błędów i warningów.
- `pnpm build` — exit 0; pozostał warning o `caniuse-lite` w wieku 11 miesięcy.
- `pnpm check:secrets` — exit 0, `Secret check passed`.
- `$env:PLAYWRIGHT_PORT='4182'; pnpm test:e2e` — 21/21 testów przeszło w Chromium na mock API/demo. W logu pojawiły się oczekiwane proxy `ECONNREFUSED` dla `/api/cart` i `/api/categories` przed stubami; testy nie weryfikują live backendu ani dostawców.
- Nie przeprowadzono testu czytnikiem ekranu, zoomu 200% przeglądarki, fizycznego telefonu, prawdziwej transakcji ani migracji. ELI/UOKiK review jest checklistą źródeł, nie opinią prawną.
