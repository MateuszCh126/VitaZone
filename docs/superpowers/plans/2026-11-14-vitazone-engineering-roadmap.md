# VitaZone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` or `superpowers:executing-plans` task-by-task. Each independently reviewable task must use its own focused change and verification; do not merge to `main` or deploy.

**Goal:** Rozwijać VitaZone jako wiarygodny, dostępny i technicznie bezpieczny sklep, który pomaga kupującym znaleźć produkt właściwy do ich potrzeb.

**Architecture:** Zachować istniejące React/Vite SPA, Express API i PostgreSQL w pierwszych etapach. Ustalić kontrakty/moduły przed ekstrakcją use-case i zmianą migratora; provider-y płatności, wysyłki, poczty i AI pozostają za zweryfikowanymi adapterami.

**Tech Stack:** React 19, Vite 7, React Router 7, Express 5, PostgreSQL/`pg`, Zod 4, Stripe Checkout, pnpm 10.33, Tailwind CSS 3.4, Vitest 5 beta, Playwright.

**Spec:** [Stan techniczny](../../technical/current-state-and-roadmap.md), [audyt tras](../../technical/route-audit.md), [referencja kodu](../../technical/codebase-reference.md), [design system](../../design-system/vitazone.md) i [badanie UX](../../research/vitazone-ux-research.md).

## Global Constraints

- Audyt sklepu, warstwa wizualna i konfigurator terrarium zostały scalone do `main` przez PR #2 i PR #3. Pozostałe pozycje poniżej są roadmapą — ich niewykonane bramki pozostają otwarte. Wdrożenie i migracja produkcyjna nadal wymagają osobnego polecenia oraz potwierdzonych danych właściciela.
- Używamy syntetycznych fixture; bez dumpów/połączeń do produkcyjnej bazy, transakcji live i sekretów w repo/logach.
- Ceny, stan, prawne informacje, marketing claims, logistyka i dane zwierząt wymagają źródła i właściciela.
- Kupujący bez konta i z kontem są wspierani; konto pozostaje opcjonalne.
- Zachować czerń/zieleń; `MouseGlow` pozostaje usunięty, bez globalnego bloom. Tailwind pozostaje v3.4.
- Serwer wylicza cenę, rabat, wysyłkę, własność i płatność; redirect klienta nie potwierdza zapłaty.
- Dostępność celuje w WCAG 2.2 AA; ograniczony ruch, klawiatura, screen reader i 200% browser zoom są release criteria.
- Zmiany architektury znaczące zapisujemy w ADR; zmiany widoczne/operacyjne w `docs/changes/`.

## Review Focus

- Stary lub częściowy schemat PostgreSQL i błędny exit code nie mogą oznaczyć migracji jako wykonanej; testy świeżej bazy, upgradu i awarii.
- Wyścig dwóch koszyków/checkoutów o ostatnią sztukę nie może tworzyć ujemnego stock, podwójnego orderu ani niezabezpieczonego retry.
- HTML od klienta oraz role `system` z payloadu nie mogą wpływać na e-mail ani prompt systemowy; provider timeout musi zakończyć request.
- Dane zamówień, adresy, e-mail i historie czatu nie mogą wyciekać przez admin stats, logi, URL ani historię innego klienta.
- Brak obrazu, długi polski tekst, błąd API, brak cookie zgody, viewport mobilny i reduced motion muszą mieć czytelny, dostępny stan.

---

## Cel, metryki i dowód

**Status:** roadmapa kolejnych prac po PR #2 i PR #3; nie wszystkie zadania planu zostały wykonane. Punkty zależne od firmy, klientów, dostawców lub prawnika są oznaczone i nie powinny być zastępowane fikcyjnymi danymi.
**Stan bazowy:** branch `codex/vitazone-visual-refresh`, SPA React 19/Vite, Express 5, PostgreSQL przez `pg`, Stripe Checkout, Vercel Functions.
**Zasady:** zachować markę black/green i spokojny charakter; nie wprowadzać manipulacyjnej presji; ceny, stan, reputacja i treści prawne muszą mieć dowód; prace i testy lokalne używają syntetycznych danych; bez migracji produkcyjnej i deployu. Integracja do `main` jest dozwolona po zakończeniu audytu, review, testów oraz rozwiązaniu konfliktów; nie używać force-push.

## 1. Cel, metryki i dowód

### Cel produktu

Pomóc klientowi wybrać produkt właściwy dla konkretnego celu/zwierzęcia i warunków, zrozumieć zawartość zamówienia oraz całkowite koszty przed zobowiązaniem. Dwie ścieżki mają równą wagę: **urządzam pierwsze terrarium** oraz **mam już zwierzę i uzupełniam wyposażenie**.

### Wskaźniki jakości

- Główna miara: odsetek zamówień dostarczonych bez anulowania/zwrotu i bez zgłoszenia niedopasowania, raportowany wraz z mianownikiem i oknem czasu.
- Ochronne: zwroty/anulowania, błędny dobór i pytania do obsługi, nieudane/nieudokumentowane płatności, problemy doręczeń, błędy API.
- Diagnostyczne: wyszukiwanie → lista → produkt → koszyk → checkout → potwierdzona płatność. Same kliknięcia/CTR nie są sukcesem.
- Zbieranie analityki ograniczone do niezbędnych danych, właściwej zgody i retencji; nie wysyłać adresów, e-maili ani surowych fraz do analityki.

Nie ma tu danych bazowych, segmentacji ani transkryptów klientów. Nie tworzyć person, procentów ani „wzrostu konwersji” bez danych. Każdy eksperyment musi określać hipotezę, podstawową miarę jakości, guardrails, minimalny ruch i kryterium zatrzymania.

## 2. Stan faktyczny i linkowane artefakty

- [Referencja plików i modułów](../../technical/codebase-reference.md) mapuje role źródeł, pliki, integracje i ograniczenia.
- [Audyt tras](../../technical/route-audit.md) opisuje widok, treść, działanie, responsywność i priorytet dla każdej trasy z `src/App.jsx`.
- [Stan techniczny i roadmap](../../technical/current-state-and-roadmap.md) zawiera C4, przepływ płatności, bazy danych, bezpieczeństwo i kolejność etapów.
- [Design system/handoff](../../design-system/vitazone.md) opisuje tokeny, rytm, komponenty i kryteria a11y.
- [Badanie UX](../../research/vitazone-ux-research.md), [przegląd prawa](../../research/vitazone-polish-consumer-law-review.md) i [płatności/dostawa](../../research/vitazone-payments-shipping-readiness.md) zawierają nierozstrzygnięte dane właściciela.
- [Inwentarz skilli/narzędzi](../../technical/engineering-tooling-inventory.md) opisuje sesję i wybór workflowów.

Każdy punkt niżej powinien aktualizować właściwy artefakt i status realizacji w `docs/changes/`. Numery issue/PR dopisać, gdy rzeczywiście powstaną — nie wymyślać identyfikatorów.

## 3. Kolejność prac i taski do wdrożenia

### Faza 0 — zamrożenie wymagań i facts registry (P0, bez publikowania)

#### T0.1 — Rejestr faktów, twierdzeń i właścicieli

- **Zakres:** dane firmy, skrzynka kontaktu, fotografie/licencje, opis zwierząt, stock i ceny, warunki płatności/dostawy/zwrotu, twierdzenia o bezpieczeństwie i obsłudze.
- **Artefakty:** rejestr w `docs/research/` z kolumnami claim, źródło, właściciel, data weryfikacji, kanały publikacji, status (`potwierdzone`/`do potwierdzenia`/`wycofane`).
- **Zależności:** dokumenty firmy, feed katalogu i operator/umowa przewozowa; odpowiednia ocena prawna.
- **Odbiór:** brak placeholderów/nieuzasadnionych obietnic na publicznych stronach; każde prawo do zdjęć udokumentowane.
- **Blokada:** bez danych właściciela placeholderów nie zamieniamy na zgadywane dane.

- [ ] Wyeksportować wszystkie publiczne copy i twierdzenia do rejestru; wskazać właściciela, źródło i kanały.
- [ ] Zatwierdzić status każdej wartości firmy, katalogu, zdjęcia, dostawy, płatności i zwrotu; bez dowodu oznaczyć do potwierdzenia.
- [ ] Sprawdzić rejestr przed każdą zmianą tekstu i dodać odnośnik do dokumentu faktów w review.

#### T0.2 — Legal review dla faktycznego modelu sprzedaży

- **Zakres:** operator przedsiębiorstwa, obowiązki przedumowne i checkout, cena całkowita, płatność/dostawa, reklamacje, odstąpienie i konkretne kategorie produktów/zwierząt, cookies/analityka, przekazywanie danych providerom.
- **Źródła pierwotne:** [ELI: tekst jednolity ustawy](https://eli.gov.pl/api/acts/DU/2026/1244/text/U/D20261244Lj.pdf), [UOKiK: sprzedaż na odległość](https://prawakonsumenta.uokik.gov.pl/prawo-do-informacji/sprzedaz-poza-lokalem-i-na-odleglosc/), [UOKiK: odstąpienie](https://prawakonsumenta.uokik.gov.pl/prawo-odstapienia-od-umowy/terminy-odstapienie/).
- **Odbiór:** zatwierdzone treści przez właściwego prawnika; zachować wersję, datę i proces aktualizacji. Ten plan sam nie jest opinią prawną.

- [ ] Zmapować publiczne obowiązki na konkretne trasy i ekran finalizacji.
- [ ] Prawnik/owner potwierdza wyjątki per kategoria oraz zakres oświadczenia 18+.
- [ ] Zaktualizować dokument legal review i zapisać datę/źródło bez deklarowania zgodności przed podpisem.

### Faza 1 — jakość inżynierska i dostarczanie zmian (P0)

#### T1.1 — Jednoznaczny package manager i CI dla PR

- **Pliki:** `package.json`, `pnpm-lock.yaml`, `package-lock.json`, `.github/workflows/ci.yml`, `README.md`.
- **Kroki:** potwierdzić Vercel project source/build settings; wybrać pnpm (packageManager już przypięty); zregenerować/utrzymać pnpm lock; usunąć npm lock dopiero po udowodnieniu braku użycia. Dodać PR pipeline: frozen install → lint → unit/integration → build → secrets; Playwright w oddzielnym job/artifact.
- **Odbiór:** wymagane status checks, PR #2 dostaje checki, brak workflow dopisującego/zmieniającego stan produkcyjny, testy używają tylko fixture.
- **Ryzyko:** obecna konfiguracja Vercel nie została przypisana do repo/commitu; najpierw odczytać ustawienia i nie zmieniać deploymentu w tym tasku.

- [ ] Potwierdzić read-only ustawienia source branch/root/install/build na Vercel.
- [ ] Wybrać pnpm jako jedyne źródło locka i sprawdzić frozen install na czystym checkoutcie.
- [ ] Dodać PR workflow lint → unit → build → secret scan; workflow ma działać tylko na PR/push branch.
- [ ] Uruchomić workflow i potwierdzić, że PR ma wymagane checks; nie włączać deploy job.

#### T1.2 — Granice testowe i deterministyczne E2E

- **Pliki:** `playwright.config.js`, `tests/e2e/storefront.spec.js`, `src/tests/**`, ewentualne `tests/integration/**`.
- **Kroki:** rozdzielić unit/integration/browser; ustawić fixture API deterministycznie; mocki jawnie dla Stripe, Furgonetki, Resend, Gemini; collect traces tylko bez PII/secrets. Dodać raporty flaky/error, nie maskować `console.error`/HTTP błędów testowych.
- **Odbiór:** powtarzalne uruchomienie na czystym checkoutcie i Chromium; jasny zestaw testów e2e bez real DB/providers.

- [ ] Udokumentować test fixture i listę mockowanych usług w konfiguracji E2E.
- [ ] Dodać asercje dla uncaught page errors i nieoczekiwanych odpowiedzi HTTP.
- [ ] Uruchomić `pnpm exec vitest run` i `pnpm test:e2e`; zachować liczbę testów oraz rzeczywiste ograniczenia.

### Faza 2 — PostgreSQL, kontrakty danych, zamówienie (P0, największe ryzyko)

#### T2.1 — Kanoniczny model danych z porównaniem runtime

- **Pliki:** `schema.sql`, `VitaZonedb.sql`, `server/scripts/migrations/**`, `repositories/*.js`, `schemas/*.js`.
- **Kroki:** wygenerować zestawienie tabel/kolumn/FK/index/check z obu schematów, migracji i wszystkich SQL query. Oznaczyć runtime wymagania i semantykę; nie brać żadnego starego pliku jako prawdy bez uzgodnienia.
- **Odbiór:** jedna zatwierdzona wersja diagramu ERD i katalogu pól; każdy query ma tabelę/kolumny; constraints i cascade określone; wartości pieniężne w groszach.
- **Ograniczenie:** wyłącznie disposable Postgres z syntetycznymi fixtures; żadnych połączeń do środowisk współdzielonych.

- [ ] Zestawić tabele/kolumny/constraints z baseline, migracji, repository SQL i runtime contracts.
- [ ] Zapisać ERD i diff brakujących/powielonych pól; owner architektury zatwierdza kanoniczny model.
- [ ] Dodać syntetyczne fixtures dla najstarszej obsługiwanej wersji i testować wyłącznie lokalny/disposable Postgres.

#### T2.2 — Append-only migrator i ćwiczenie odtworzenia

- **Pliki docelowe:** nowy migrator/schema package (wybór po repo audit), ledger, migracje uporządkowane, testy kontenerowe/fixture w CI. Oznaczyć stare `pnpm migrate` jako legacy reset, nie standard.
- **Wymagania:** checksum, advisory lock, atomowe ledgerowanie zgodne z możliwościami DDL, niezerowy exit po każdym błędzie, walidacja kolejności, osobna rola migratora i runtime, limity/timeouts połączenia, backup/restore runbook.
- **Testy:** instalacja na czystej bazie; upgrade ze snapshotów starych schematów (fixture); ponowne wykonanie; fail mid-migration; błędny checksum; dwa migratory; downgrade tylko gdy bezstratny. Testy muszą assertować, że błędna migracja nie trafia jako applied.
- **Odbiór:** CI dowodzi fresh + upgrade + failure + concurrency; restore wykonany na syntetycznej kopii.

- [ ] Uzgodnić API migracji (`up`, checksum, version) i model ledgera przed implementacją.
- [ ] Dodać testy red dla fresh install, upgrade, checksum drift, partial failure oraz dwóch konkurencyjnych runnerów.
- [ ] Implementować runner i wymagane migracje append-only z niezerowym exit po dowolnym błędzie.
- [ ] Wykonać lokalny synthetic backup/restore drill; zaktualizować runbook i komendy.

#### T2.3 — Idempotencja zamówień i stock race

- **Pliki:** `repositories/orderRepository.js`, `routes/orderRoutes.js`, `routes/stripeRoutes.js`, `server/controllers/stripeController.js`, `shared/orderStatus.js`.
- **Kroki:** zdefiniować niezmienne snapshoty cen/podatku/dostawy/rabatu; klucz idempotencji server-side i porównanie payloadu przy ponowieniu; warunkowa atomowa rezerwacja/dekrementacja stock; jawne przejścia statusów i wygaśnięcie rezerwacji; webhook podpisany jako źródło potwierdzenia paid.
- **Testy:** duplikat/kolizja idempotency, równoległy zakup ostatniej sztuki, powtórzony event webhook, out-of-order event, expiry/cancel/fail/price change/refund, zapis timeoutu providerów.
- **Odbiór:** brak podwójnego zamówienia/opłaty lub ujemnego stock w kontrolowanych testach współbieżnych; kwota pochodzi wyłącznie z serwera; status audytowalny.

- [ ] Napisać kontrakt/status transition table i testy failure/duplicate/race przed zmianą repository.
- [ ] Zaimplementować serwerową idempotencję z kontrolą zgodności payloadu i atomową polityką stock.
- [ ] Sprawdzić webhook retry, duplikat i zmianę kolejności eventów w izolowanym Stripe test mode.

#### T2.4 — Gość i poufny dostęp do zamówienia

- **Pliki:** `routes/orderRoutes.js`, `repositories/orderRepository.js`, `routes/stripeRoutes.js`, `src/pages/Checkout.jsx`, `src/pages/Dashboard.jsx`, powiadomienia.
- **Kroki:** jeśli guest checkout już wdrożono w PR #1, najpierw sporządzić kontrakt na żywym kodzie. Potwierdzić unikalny token dostępu/flow e-mail i czas ważności albo konto; nie wystawiać historii przez numer zamówienia; przetestować logowanie istniejącego klienta.
- **Odbiór:** IDOR/zgadywanie ID nie ujawnia danych; gość może odebrać informację o własnym zamówieniu przez kontrolowany kanał; e-mail bez nieescapowanego HTML.

- [ ] Rozrysować obecny guest/auth order flow na bazie realnego kodu PR #1.
- [ ] Zdefiniować kanał i sekret/expiry dla guest order access bez numeru zamówienia jako poświadczenia.
- [ ] Dodać testy cross-user/cross-guest, wygasłego dostępu oraz transakcyjnego potwierdzenia.

#### T2.5 — Integralność koszyka, constraints i bounded reads

- **Pliki:** `repositories/cartRepository.js`, `routes/catalogRoutes.js`, `routes/adminRoutes.js`, `repositories/productRepository.js`, `repositories/orderRepository.js`, migracje.
- **Kroki:** unikalny koszyk per owner/session zgodnie z modelem; atomowe zwiększenie ilości względem stock; maksymalne limity, stabilne sortowanie/paginacja list; projekcje pól admina bez snapshot PII; checki ceny/qty i jasna polityka soft-delete.
- **Testy:** równoległe create/update, max/out-of-range query, brak ownera, paginacja deterministyczna, SQL query shape w admin stats.
- **Odbiór:** każde collection endpoint ma twardą górną granicę; DB narzuca kluczowe invariants.

- [ ] Dodać testy graniczne list oraz query pagination ze stabilnym sortem.
- [ ] Dodać constraints i atomowe operacje koszyka w migracji po zatwierdzeniu kanonicznego schematu.
- [ ] Ograniczyć admin stats do pól wymaganych przez ekran, bez snapshot adresu i danych płatniczych.

### Faza 3 — Backend security, prywatność, provider reliability (P0/P1)

#### T3.1 — Escaping e-maila, allowlista ról czatu i provider deadlines

- **Pliki:** `server/services/emailService.js`, `schemas/chatSchema.js`, `server/controllers/chatController.js`, `server/services/shipping/furgonetkaClient.js` i testy unit.
- **Kroki:** escaping HTML tekstowych pól we wszystkich kontekstach; akceptować role klienta wyłącznie `user`/`assistant`, ograniczyć długość/historię; timeout i anulowanie requestu providerów; logować identyfikator requestu bez treści wrażliwych.
- **Testy:** HTML `<img>`, atrybuty/quotes, unicode; role `system`/sekwencje niepoprawne; fetch nigdy nie rozwiązuje się; abort i status providera.
- **Odbiór:** żadna kontrolowana przez klienta treść nie staje się HTML/promptem systemowym; API kończy się w skonfigurowanym terminie.

- [x] Dodać testy regresyjne dla HTML injection, client `system` role, limitu 30 wiadomości i timeoutu Furgonetki, także gdy mock ignoruje AbortSignal.
- [x] Wdrożyć escaping/allowlist/limit/deadline i abort; nie logować adresu odbiorcy przy braku konfiguracji Resend.
- [x] Uruchomić zakresowy Vitest oraz lint; 10 testów przeszło, lint bez błędów i ostrzeżeń.

#### T3.2 — Rate limiting i konfiguracja serverless

- **Pliki:** `server/config/rateLimiters.js`, `server/config/env.js`, `server/scripts/db.js`, `server.js`.
- **Kroki:** określić abuse cases per endpoint; dla limitów współdzielonych dobrać store dopiero po wyborze i konfiguracji (nie zakładać już dostępnego Redis); pool `pg` z `max`, idle/connect timeout i bezpiecznym SSL; health check readiness/liveness bez wycieku.
- **Odbiór:** dwa procesy testowe współdzielą limit jeśli wymagane; pod obciążeniem API nie wyczerpuje puli; env nie akceptuje przypadkowej produkcyjnej konfiguracji testów.

- [ ] Spisać threat/rate-limit matrix dla publicznych i auth endpointów.
- [ ] Dodać testy dwóch procesów i pool timeout na local fixture.
- [ ] Zatwierdzić store/config i limity przez ownera infrastruktury; brak Redis lub innej usługi wprowadzanej bez potwierdzonego środowiska.

#### T3.3 — Cookies/zgody i dane przekazywane dostawcom

- **Pliki:** `src/components/CookieBanner.jsx`, `src/utils/consent.js`, `src/components/VercelInsights.jsx`, `src/pages/legal/*`, `ChatWidget`, `chatController`.
- **Kroki:** inwentaryzacja storage/network przed zgodą, po odmowie i po zmianie decyzji; oddzielić wymagane od analitycznych/marketingowych; wyłączyć optional scripts do czasu opt-in; ograniczyć treść czatu do potrzebnej; uzgodnić z policy i umowami.
- **Odbiór:** network trace potwierdza odmowę; keyboard/focus/announce działają; policy odzwierciedla faktyczny request path i retencję.

- [ ] Zarejestrować network/storage w stanach fresh, accept, reject, customize i withdraw.
- [ ] Dodać testy, że opcjonalne requesty nie startują przed zgodą i po odmowie.
- [ ] Zsynchronizować faktyczny przepływ, politykę i treści banneru po legal/IOD review.

### Faza 4 — sklep, treść i dostępność (P1)

#### T4.1 — Pełny UI state matrix dla każdej trasy

- **Zakres trasy:** 16 tras w [route-audit](../../technical/route-audit.md): homepage, listing, product, checkout, login, register, dashboard, admin oraz info/legal/404.
- **Widoki:** desktop 1365/1440 px i telefon 360/390 px; 768 px/tablet jako dodatkowy breakpoint. Dla danych async: loading/success/empty/error/retry; długi tekst, nazwa i niedostępny obraz; konto guest/auth/admin tylko na fake data.
- **Dokumentowanie:** każda obserwacja ma plik źródłowy, viewport, precondition, screen/DOM, status faktu i priorytet. Nie wyciągać wniosków o conversion z renderu.
- **Odbiór:** wszystkie publiczne interakcje mają nazwę, efekt i błędy; statusy widoczne i zrozumiałe; brak duplikatów banner/empty state.

- [ ] Dla każdej trasy wykonać loading/success/empty/error na fixture oraz wskazać źródło i screen.
- [ ] Zweryfikować każdą interakcję myszą, dotykiem i klawiaturą; skontrolować focus po nawigacji i error.
- [ ] Poprawić route audit na podstawie obserwacji; oddzielić status obecny od hipotezy i decyzji wizualnej.

#### T4.2 — Krytyka kompozycji i systemu wizualnego

- **Wytyczne:** utrzymać czerń/zieleń, ale zieleń stosować do interakcji/stanu, nie jako bloom na całej powierzchni. `MouseGlow` jest usunięty; nie przywracać go jako dużej poświaty. Subtelna tekstura/ruch tylko jeśli test kontrastu, redukcji ruchu i renderu uzasadnia.
- **Pliki:** `src/index.css`, `src/App.css`, `tailwind.config.js`, komponenty stron. Nie robić migracji Tailwind v4 w tej iteracji.
- **Iteracje:** review hero → listing/product → checkout → info pages; celowo różne rytmy i hierarchy, nie identyczny zestaw kart. Zdjęcia wyłącznie z potwierdzoną licencją; do tego czasu nie maskować fixture zdjęciem produktu.
- **Handoff:** tokeny semantyczne, stany default/hover/focus/active/disabled/loading/error, zachowanie reduced motion, breakpointy, minimalna treść i overflow.
- **Odbiór:** porównanie lokalnych screenów przed/po w 2 viewportach oraz klawiatura; właściciel/client review później, jeśli dostępny.

- [ ] Zbudować baseline screen set dla homepage, listingu, produktu, checkoutu, informacji i konta.
- [ ] Iterować tokeny/kompozycję bez globalnej poświaty; sprawdzić tekst, motion, reduced motion oraz fallback zdjęcia.
- [ ] Zarejestrować zmianę w design handoff i przeglądzie branch; nie używać fake katalogu jako fotografia/claim produkcyjny.

#### T4.3 — Copy UX i zgodność claimów

- **Pliki:** każdy publiczny tekst z `Home`, `Shop`, `ProductDetail`, `CartDrawer`, `Checkout`, `FAQ`, `About`, `Contact`, `Login`, `Register`, `Dashboard`, legal pages oraz `storefrontData.js`.
- **Kroki:** arkusz tekstów z lokalizacją, odbiorcą/decyzją, claim/source, status faktyczny, wersja do badań. Przepisać błędy: przyczyna + kolejny krok; CTA: skutek kliknięcia; checkout: sumy i koszty przed zamówieniem; CTA nie powinno obiecywać tego, czego endpoint nie robi.
- **Język klienta:** dopiero po anonimizacji i uprawnieniu użyć tickets/powodów zwrotów; bez danych reprezentatywnych utrzymać propozycje jako hipotezy.
- **Odbiór:** każde twierdzenie konkretne/weryfikowalne; status firmy/zwrotów/dostawy zatwierdzony; zero sztucznej presji, fałszywych opinii i scarcity.

- [ ] Zmapować literalnie wszystkie teksty UI na arkusz claim/source/decision/action.
- [ ] Rewrite wyłącznie copy potwierdzonego i przetestować długości/komunikaty błędów na dwóch podróżach.
- [ ] Wykonać zanonimizowane usability testy; zapisać obserwacje/cytaty, nie dopisywać statystyki doboru bez próby ilościowej.

#### T4.4 — WCAG 2.2 AA i test manualny

- **Zakres:** kontrast, semantyka landmark/headings, focus visibility/order/trap/return, labels/hints/errors, status live regions, touch targets, alt text, keyboard-only, 200% browser zoom, NVDA (Windows), reduced motion, consent choice parity.
- **Automatyka:** dodać axe-core/Playwright tylko jako pomocniczy gate; automat nie zastępuje ręcznej oceny. Skontrolować modal admina i drawer odrębnie.
- **Odbiór:** zapisane scenariusze/rezultaty; brak blockerów WCAG; otwarte ograniczenia przypisane do planu.

- [ ] Uruchomić automatyczny axe scan na głównych trasach i zalogowanych stanach demo.
- [ ] Przejść całość keyboard-only oraz NVDA na Windows; zapisać czytnik/wersję/route.
- [ ] Zweryfikować browser zoom 200%, contrast i target size; przypisać każdy wyjątek lub naprawę.

### Faza 5 — SEO, obrazy, rendering, realne pomiary (P1)

#### T5.1 — Decyzja CSR vs prerender/SSR i crawl

- **Zakres:** `/product/:id`, kategorie, static info, sitemap, canonical, robots, status 404, OG, JSON-LD, noindex dla konto/koszyk/checkout/admin.
- **Pliki:** `src/App.jsx`, `ProductDetail.jsx`, `src/utils/jsonLd.js`, `public/sitemap.xml`, `robots.txt`, `vercel.json`, build configuration.
- **Metoda:** test raw HTTP HTML/headers przy direct deep link; porównać koszt migracji do SSR z Vite SSG/prerender. Dopiero benchmark po ustaleniu host/domain i prawdziwego feedu.
- **Odbiór:** każdy indexable URL ma unikalny dostępny HTML metadata/canonical; sitemap ma tylko aktualne kanoniczne URL; Product schema pokrywa widoczne dane i tylko prawdziwe price/availability.

- [ ] Testować bezpośredni GET raw HTML dla każdej trasy i produktu/kategorii z fixture.
- [ ] Porównać SSR/SSG/prerender w koszcie, hostingu, cache i freshness danych; zapisać ADR przed wyborem.
- [ ] Dodać testy canonical, sitemap, robots, 404 i JSON-LD zgodnego z renderowaną treścią.

#### T5.2 — Wydajność i media z baseline

- **Przed zmianą:** build analyzer z trasy/assetów; trace/network dla homepage, listy, karty, checkout; cache/throttle stałe i wynik mediany/percentyle lab. Field CWV p75 dopiero gdy analytics ma ruch i zgodę.
- **Kandydaci po dowodzie:** usunąć nieużywane assety startera, zoptymalizować hero/srcset, ograniczyć wagi i lazy load below-fold, wykonać preload tylko LCP asset; przejrzeć hydration/React rerenders i API waterfalls. Nie optymalizować render bez profilu.
- **Odbiór:** LCP/INP/CLS zapisane z lab/field odrębnie, porównane do web.dev p75 targets; brak degradacji jakości obrazu/kontrastu.

- [ ] Zapisać build ID, browser, hardware, viewport, cache i network throttle dla baseline.
- [ ] Wykonać trace + bundle/network analysis; wybrać tylko potwierdzony kosztowny problem.
- [ ] Wdrożyć pojedynczą optymalizację i powtórzyć test tą samą metodą; oddzielić lab od field p75.

### Faza 6 — badania użyteczności i release readiness (P1/P0 release gate)

#### T6.1 — Dwie iteracyjne rundy usability

- **Uczestnicy:** osoby pierwszy raz kompletujące terrarium i właściciele szukający konkretnych uzupełnień. Zacząć od 5–8 osób na rundę jakościową, traktować jako diagnostykę, nie statystykę reprezentatywną.
- **Zadania:** odnaleźć konkretną potrzebę; ocenić zastosowanie i zgodność parametrów; porównać produkt; zrozumieć cenę/dostawę/zwroty; kupić bez konta; później znaleźć historię zamówienia/wyjaśnić wyjątek.
- **Dane:** think-aloud, time-on-task i błędy/niepewność z anonimizacją/zgodą; raportuj cytaty bez PII i osobno obserwację versus interpretację.
- **Iteracja:** poprawić największe blokery, powtórzyć zadania; nie zakładać, że priorytety Baymard są lokalnym wynikiem.

- [ ] Przygotować moderator guide i consent/anonymization protocol.
- [ ] Przeprowadzić osobną pierwszą rundę dla obu segmentów i kodować obserwacje przyczynowe.
- [ ] Poprawić high-severity blockers i wykonać rundę retestu; wersjonować insight/evidence/recommendation.

#### T6.2 — Release checklist (wyłącznie odrębne polecenie uruchomienia)

- Legal content zatwierdzony; właściciel produktu, kontakt, ceny/stock, zdjęcia i logistykę podpisał.
- DB fresh/upgrade/backup/restore i migracje przećwiczone na kopii; production migration plan ma rollback/owner.
- Sandbox success/fail/cancel/retry/duplicate webhooks plus realne konta dostawców testowe, bez live opłat w testach.
- CI required checks green; secrets scan obejmuje diff i historię zgodnie z polityką.
- WCAG manual, privacy/network consent, mobile real device, SEO deep links i CWV evidence zakończone.
- Support/escalation/monitoring i incident runbook gotowe.
- Deployment i merge wymagają osobnego polecenia właściciela; plan sam nie uruchamia release.

## 4. Architektura docelowa — tylko po uzasadnieniu

Wybór jest stopniowy: zachować moduły React/Vite i Express, dopóki kontrakt nie wymaga zmiany. Po T2 ustalić seams według domen `catalog`, `cart`, `orders/payments`, `identity`, `shipping`, `consent`. Trasa odpowiada za HTTP/auth; schema za input contract; use-case za politykę i orkiestrację; repository za SQL/transaction; adapter za provider API. `adminRoutes` należy migrować małymi pionowymi plasterkami do tego modelu, a nie przepisywać całe API.

Nowy moduł powinien ukrywać złożoność za małym interfejsem, ujawniać kolejność/warunki/błędy oraz mieć test przez ten sam seam co caller. Nie dodawać abstrakcji dla jednego wariantu bez realnej wymienności. Każda decyzja trudna do odwrócenia (nowy framework SSR, ORM/migrator, store rate limit, nowa domena/hosting) wymaga krótkiego ADR z kontekstem, opcjami, kosztami i warunkami revisitu.

## 5. Kryteria jakości dokumentów i aktualizacji

- **Explanation:** `current-state-and-roadmap.md` wyjaśnia kontekst i tradeoffs.
- **Reference:** `codebase-reference.md` + `route-audit.md` mapują trasy, pliki i zachowania.
- **How-to:** osobne runbooki dla dev, testów, migracji, recovery i release.
- **Plan:** ten plik to uporządkowany, zależny plan pracy; oznaczaj status tasków z realnym dowodem.
- **Decision:** ADR tylko dla trwałych, kosztownych w zmianie decyzji.
- **Changes:** każdy istotny task zapisuje pliki, wynik dokładnych komend, limity testu, otwarte ryzyko i branch/PR. Nie kopiuje statusu `main` do opisu PR #2.

## 6. Kryteria zakończenia całości

1. Wszystkie aktualne trasy, teksty, stany, interakcje i breakpointy mają wskazany kod oraz faktyczny test/review evidence.
2. Referencja kodu odpowiada wszystkim tracked app/config/test plikom i jest sprawdzana przy zmianie.
3. Baza ma jedno potwierdzone źródło prawdy, migracje przechodzą świeżą i upgrade fixture oraz błędy/współbieżność.
4. Payment/order model zachowuje idempotencję, wyliczenia serwera, stock i prywatność w race/failure scenarios.
5. Każdy claim publiczny jest zatwierdzony lub wyraźnie usunięty/oznaczony; treści prawne przechodzą review.
6. UX jest oceniony na prawdziwych zdjęciach/danych oraz po testach z obu grup; żadnych dopowiadanych statystyk.
7. SEO i wydajność mają test raw HTML/deep links, kontrolę crawl i powtarzalne lab/field results (field tylko jeśli dane istnieją).
8. WCAG review obejmuje automated + manual, 200% zoom, czytnik ekranu i ograniczony ruch.
9. CI wymagane na PR, powtarzalne kontrole lokalne, jawny status deploymentu i dowód rollback/operacji.
10. Zmiany objęte PR #2 i PR #3 są scalone do `main`; dalsze zadania wymagają osobnego zakresu, review i weryfikacji. Nie wykonano niezamówionego deployu ani migracji produkcyjnej.
