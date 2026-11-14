# VitaZone — pogłębiony audyt sklepu i plan napraw

**Status:** audyt źródeł i renderów lokalnych; działania wdrożeniowe oznaczone w tabelach. Praca na `codex/vitazone-visual-refresh` (PR #2), niczego nie scalono do `main`.
**Data przeglądu:** 2026-11-14.
**Cel:** katalog pomaga znaleźć odpowiedni produkt i zrozumieć warunki zakupu; mierzymy zamówienia dopasowane do potrzeb klienta wraz ze zwrotami, anulowaniami, problemami dostaw i zgłoszeniami do obsługi. Nie stosujemy fałszywej presji ani niepotwierdzonych obietnic.

## Jak oceniano stan

| Poziom dowodu | Znaczenie |
|---|---|
| **Kod** | Potwierdzone w źródłach, niezależnie od działania API. |
| **Render** | Widziane w lokalnej przeglądarce z fixture/demo albo w zrzucie użytkownika; nie jest to stan produkcji. |
| **Zewnętrzne** | Potwierdzone w aktualnej dokumentacji/źródle urzędowym; nie zastępuje opinii dla konkretnej działalności. |
| **Właściciel** | Wymaga danych firmy, realnej oferty, umów albo akceptacji prawnej. Nie uzupełniać przez zgadywanie. |

Audyt obejmuje wszystkie 15 jawnych tras i wildcard `*` z `src/App.jsx`, wspólne elementy, źródłowe teksty i najważniejsze stany. Render strony głównej i FAQ sprawdzono przez przeglądarkę IAB; zrzuty użytkownika pokazują wcześniejszy stan homepage oraz launcher czatu. Lokalny backend nie wystartował z powodu braku `DATABASE_URL` i `JWT_SECRET`; listing pokazał błąd pobrania katalogu. Ten stan lokalny nie dowodzi awarii produkcyjnej. Oddzielny detektor Impeccable wykrył gradient text w FAQ i `animate-bounce` w typing indicator; gradient jest potwierdzonym problemem systemowym, bounce ma uzasadnienie jako wskaźnik pisania, ale warto złagodzić.

Nie wykonano badań użytkowników, testu czytnika ekranu, fizycznego telefonu, rzeczywistego zoomu 200%, transakcji płatniczej, migracji bazy ani pomiarów polowych. Te braki nie są zaliczone jako pozytywne wyniki.

## Przegląd każdej trasy

| Trasa | Potwierdzony stan / problem | Plan |
|---|---|---|
| `/` | **Render + kod.** Dżunglowa fotografia jest najmocniejszym elementem marki. „Urządzam pierwsze terrarium” kieruje do filtra „Terraria i zestawy”, nie do przewodnika ani potwierdzonego kompletnego zestawu. Zielony nagłówek i launcher są bardzo jasne. | Nazwać odnośnik zgodnie z rzeczywistym celem („Terraria i zestawy”) albo później zbudować potwierdzony przewodnik. Umiarkować token zieleni. Cząsteczki przywrócić wyłącznie jako spokojną atmosferę hero, z obsługą `prefers-reduced-motion`. Nie dodawać ruchu do każdej sekcji. |
| `/shop` | **Render + kod.** Katalog na lokalnym uruchomieniu nie ma backendu; alert sugeruje „pełną ofertę”, chociaż fetch zwraca błąd i nie renderuje częściowego katalogu. Aktywna kategoria powtarza się w sidebarze i chipach oraz używa neonowego pełnego wypełnienia i cienia glow. | Komunikat: „Nie udało się wczytać katalogu” + ponowienie. Zostawić aktywny filtr w jednym subtelnym wariancie (ciemna zielona powierzchnia, obrys, czytelny tekst), bez glow; zachować pojedyncze zdejmowanie filtrów. Powtórzone kategorie zredukować po weryfikacji wygody na mobile. |
| `/product/:id` | **Kod.** Meta/JSON-LD produktu dodawane po client fetch. „Gotowe do zamówienia” oraz liczba sztuk pochodzą ze stocku odczytanego wcześniej, nie są rezerwacją. Brak zdjęcia może używać hero jako fallbacku produktu. | Wprowadzić neutralny placeholder i per-product parametry/zdjęcia ze źródłem. Nie przedstawiać odczytu stocku jako gwarancji rezerwacji. Przed publikacją sprawdzić surowy HTML, canonical, ceny, zdjęcia i schema aktywnego katalogu. |
| `/about` | **Render + kod.** Bieżąca strona opisuje katalog i sposób zakupu, nie historię ani tożsamość firmy. Nie ma niezweryfikowanej historii właściciela — to dobra granica prawdy, ale „O sklepie” obiecuje inny rodzaj treści. | Do czasu materiałów firmy zmienić tytuł/intro na zgodne z katalogowym opisem albo dodać zweryfikowane fakty po akceptacji. Zachować obecny redakcyjny układ bez powrotu do identycznych kart. |
| `/contact` | **Kod.** Jedyny kanał to `mailto:kontakt@animalsshop.pl`, niezweryfikowany przez właściciela. „Szybka ścieżka pomocy” może obiecywać szybkość reakcji bez danych. | Usunąć sugestię czasu reakcji; zweryfikować kanał, nazwę sprzedawcy i dostępność przed publikacją. Nie tworzyć fikcyjnych godzin ani SLA. |
| `/faq` | **Render + kod.** Gradientowy nagłówek, trzy duże zagnieżdżone powierzchnie i osiem pytań. Cztery odpowiedzi wprost mówią o braku potwierdzenia, mimo intro obiecującego szybką odpowiedź. Odpowiedź o wielu kategoriach w koszyku nie rozstrzyga, czy będą dostarczone razem. Link mailto powtarza niezweryfikowany adres. | Uporządkować jak czytelny help center: jeden mocny tytuł, krótki opis, nawigacja po sekcjach, spokojne wiersze `<details>` zamiast trzech ciężkich kart; bez gradient text. Przepisać odpowiedzi w granicach potwierdzonych faktów; wyraźnie odróżnić wspólny koszyk od wspólnej paczki. W przypadku warunków wymagających decyzji właściciela linkować do kontaktu, bez udawania gotowej odpowiedzi. |
| `/login` | **Kod.** Polski interfejs zawiera przykład adresu `you@example.com`. Nie ma linku resetu hasła i nie potwierdzono endpointu do takiej funkcji. | Zmienić placeholder na polski przykład (`np. jan@example.com`), zachować widoczne etykiety i autouzupełnianie. Nie dodawać nieistniejącej akcji resetu. |
| `/register` | **Kod.** Konto wymaga potwierdzenia 18+; zakres dla wszystkich kont i powiązanie z kategoriami sprzedaży wymagają sprawdzenia właściciela/prawnika. Newsletter jest oddzielny, dobrowolny wybór. Launcher czatu ukrywa się na mobile na tej trasie po wykrytej kolizji. | Nie zmieniać wymogu 18+ bez opinii. Utrzymać rozdzielenie zgody newslettera od regulaminu. Ponownie sprawdzić geometrię formularza i chat launcher po każdej zmianie. |
| `/checkout` | **Kod.** Checkout guest/account istnieje; płatność przekazuje do Stripe Checkout, a dostawa wyceniana jest przez adapter Furgonetka. Kod przekazuje przewoźnikowi dane adresowe. Konto/metody Stripe i umowy przewoźników nie są potwierdzone; 18+ checkbox i legalne teksty wymagają oceny. | Przed uruchomieniem potwierdzić dostępność metod płatności, operatora/kuriera, ceny całkowite, czas i zakres danych. Testować idempotency, timeout z niejednoznacznym wynikiem Stripe, cancel/expiry/duplicate webhook/stock race. Nie nazywać płatności „bezpieczną/szyfrowaną” bez zakresu i dowodu. |
| `/dashboard` | **Kod.** Akcje zwrotu/problem przygotowują e-mail, nie zakładają sprawy. Brak `created_at` renderuje „Dzisiaj”, co wymyśla datę. Pola adresu mają widoczne tekstowe etykiety, ale niepowiązane `htmlFor`/`id`. | Brak daty pokazać jako „Brak danych”/pominąć. Powiązać etykiety z inputami. Zachować jawne określenie, że CTA tworzy wiadomość, a nie automatyczny zwrot/reklamację. |
| `/admin` | **Kod.** Wyszukiwanie zamówień ma tylko placeholder i nie ma widocznej etykiety ani działania filtrowania. Sortowalne `<th onClick>` nie oferują przycisku/klawiatury. „Dodaj nowy gatunek” uruchamia modal dodawania produktu. Statystyki pobierają za szerokie dane i wymagają przeglądu PII/paginacji. | Dodać label i rzeczywiste filtrowanie albo usunąć nieaktywne pole. Nagłówki sortowania zmienić na klawiaturowe przyciski z `aria-sort`. Zmienić tekst na „Dodaj produkt”. Ograniczyć projekcję i paginować zapytania; nie pokazywać KPI bez definicji. |
| `/terms` | **Kod.** Widoczny draft notice; dane sprzedawcy, warunki i regulamin nie mają akceptacji prawnej w repo. | P0 bramka publikacji: dane firmy, cena całkowita, płatności/dostawa, reklamacje, odstąpienie, sprzedaż zwierząt — review przez kompetentną osobę. |
| `/privacy` | **Kod.** Projekt musi odzwierciedlać faktyczne odbiorniki: Stripe, Furgonetka, Resend, Gemini, Vercel/telemetria; przepływy i retencja nie mają pełnego potwierdzenia operacyjnego. | Zestawić politykę z faktycznym network/storage i umowami; nie deklarować retencji ani podstaw bez źródła. |
| `/cookies` | **Kod.** Wprowadzenie obiecuje wykaz cookies, a tekst przyznaje, że pełna inwentaryzacja jest do wykonania. | Albo przeprowadzić kompletny wykaz, albo zmienić intro. W preview sprawdzić requesty/skrypty/storage przed zgodą, po odmowie, po akceptacji i wycofaniu. |
| `/withdrawal` | **Kod.** Jest to wzór, który klient kopiuje/wysyła; nie wysyła on zgłoszenia sam. Wyjątki nie są rozstrzygnięte dla konkretnych kategorii. | Jawnie nazywać formularz wzorem, podać potwierdzony kanał, rozstrzygnąć tekst dla typów produktów z prawnikiem. |
| `*` (404) | **Kod.** Przyjazny widok i link do katalogu. HTTP status 404 hosta niepotwierdzony. | Sprawdzić status dla nieznanego path na preview; widok SPA może zwrócić 200. |

## Wspólny interfejs, mikrocopy i emocjonalny przebieg

| Element | Ustalenie | Plan |
|---|---|---|
| Paleta | `#00FF88` ma bardzo wysoką jasność/nasycenie; ekran sklepu, filtry, logo i launcher konkurują o wzrok. | Użyć jednego spokojniejszego, lecz nadal kontrastowego zielonego tokenu. Zielony jest akcentem, nie podłożem większości kontrolek. Zachować czerń i prawdziwe zdjęcia jako główną tożsamość. |
| Particle | Aktualny checkout nie ma warstwy particle. Użytkownik potwierdza, że wcześniejsze drobiny dodawały ruchu terrarium. | Przywrócić rzadkie drobiny wyłącznie w scenie hero; `aria-hidden`, `pointer-events:none`, transform/opacity, respektować `prefers-reduced-motion`, bez particles na treści/checkout. |
| Chat | Kod pokazuje kropkę, gdy widget zamknięty i `messages.length > 0`; wraca po przeczytaniu, obejmuje własną wiadomość i nie odróżnia odpowiedzi od błędu. | Stan unread wyłącznie dla nowej udanej odpowiedzi otrzymanej przy zamkniętym panelu; oznaczyć status dostępnie, wyczyścić po otwarciu i pokazaniu wiadomości; bez stałego/pulsującego badge po odczytaniu. |
| Koszyk | Kopia „Bezpieczna szyfrowana płatność” jest szersza niż dowody o całym checkout/providerze. | Usunąć niepotwierdzony claim; opisać wyłącznie faktyczną ścieżkę do Stripe bez gwarancji bezpieczeństwa niepopartej zakresem. |
| Kontakt | Footer „FAQ i wysyłka” sugeruje, że FAQ rozstrzyga dostawę. E-mail nie ma potwierdzenia właściciela. | Nazwać link neutralnie („Informacje o zamówieniu”) i uzyskać potwierdzony kontakt przed publikacją. |
| Błędy i oczekiwanie | Listing ma retry; App suspense pokazuje tylko spinner bez widocznej nazwy; błędy API lokalne nie są błędami produkcji. | Krótkie komunikaty problem + kolejny krok. Loading state oznaczyć `role=status`/`aria-live` z krótkim „Ładowanie…”. Nie pokazywać technicznych przyczyn użytkownikowi. |

## Stan po iteracji naprawczej w tej gałęzi

Zmiany są w toku na branchu PR #2 i nie są wdrożone. Poniższe punkty są potwierdzone diffem oraz testami celowanymi; nie oznaczają akceptacji biznesowej ani prawnej.

- **Wykonane:** akcent `#58C983` i spokojniejszy styl zaznaczonej kategorii, bez stałego glow; zachowany wspólny focus token.
- **Wykonane:** FAQ ma sekcyjne skróty, natywne rozwijane odpowiedzi, widoczny fokus i neutralny nagłówek bez gradientu. Odpowiedź rozróżnia wspólny koszyk i sposób wysyłki.
- **Wykonane:** cząsteczki wróciły tylko w hero jako dekoracja nieblokująca interakcji; respektują `prefers-reduced-motion`.
- **Wykonane:** status unread czatu dotyczy nowej udanej odpowiedzi, a otwarcie panelu czyści znacznik.
- **Wykonane:** copy koszyka nie obiecuje ogólnego bezpieczeństwa płatności; listing/login/produkt/cookies mają bardziej precyzyjne komunikaty.
- **W toku:** etykiety, sortowanie i kontakt na dashboardzie oraz adminie są naprawiane osobno; nie są jeszcze zaliczone.
- **Pozostaje blokadą publikacji:** prawdziwy kanał kontaktowy, dane sprzedawcy, konfiguracja cookies/storage, zasady i wyjątki prawne, metody płatności i przewoźnicy wymagają potwierdzenia właściciela. Z tego powodu publiczne linki nie mogą prowadzić do historycznego `kontakt@animalsshop.pl`.

Kontrola wizualna lokalna: homepage (desktopowy viewport ok. 720 px wysokości) pokazała przywrócone, subtelne punkty na zdjęciu hero; FAQ pokazało prostszy układ i linki sekcji. To ręczny przegląd renderu lokalnego, nie sprawdzenie urządzenia fizycznego ani pełnego zakresu responsywności.

## Priorytety wdrożenia

### P0 — prawda oferty, płatność i publikacja

1. Rejestr danych firmy, kontaktu, godzin, produktów, zdjęć/licencji, stocku, cen, podatku, metod płatności, usług przewoźnika i zwrotów. Właściciel i prawnik akceptują wymagane informacje przed publikacją.
2. Polskie obowiązki informacyjne: łączny koszt i dostawa, sprzedawca, płatność, reklamacja, odstąpienie oraz specyfika sprzedawanych kategorii. Obecne dokumenty legalne są draftem, nie potwierdzeniem zgodności.
3. Checkout: przekazać idempotency do Stripe, obsłużyć timeout z niejednoznacznym wynikiem, rezerwację stocku i reconciliation. Obecny stock jest zmniejszany przed sesją Stripe, a ścieżka checkoutu nie przekazuje klucza idempotency do repozytorium.
4. PostgreSQL: ustalić kanoniczny schemat, przestać automatycznie odkrywać historyczne migracje po prefixie, ledger/checksum/lock/nonzero exit. Szczegóły decyzji w [ADR 0001](../adr/0001-postgresql-migration-governance.md). Nie łączyć się z produkcyjną bazą bez kopii i akceptacji właściciela.

### P1 — UX, copy i dostępność

1. Złagodzić zielony token oraz aktywne filtry bez utraty czytelnego kontrastu; usunąć gradient FAQ i stały glow.
2. Przebudować FAQ jako sekcje do szybkiego skanowania z odpowiedziami opartymi na potwierdzonych faktach; oddzielić zamówienie wielu kategorii od wspólnej paczki.
3. Przywrócić subtelne particles tylko w hero; ruch nie może przesłaniać treści ani łamać ustawień reduced motion.
4. Naprawić kropkę czatu jako faktyczny stan unread i komunikat dla AT.
5. Poprawić label/search/keyboard sortowania, brakującą datę konta, copy placeholderów i nazwy przycisków.

### P2 — stan firmy, SEO i wydajność

1. Ograniczyć placeholdery/niepasujące obrazy; każdy asset ma przypisanie i licencję.
2. Ustalić domenę canonical; dynamiczny sitemap; status 404 i produkty widoczne w surowym HTML lub zaakceptować SSR/SSG/prerender na podstawie crawl.
3. Zmierzyć lab i field performance oddzielnie; sprawdzić obrazy, lazy-load i rozmiar assetów na prawdziwych trasach.
4. Usunąć/adresować śledzone artefakty build/test po sprawdzeniu, że CI ich nie wymaga. Utrwalić pnpm jako jeden package manager po odczycie ustawień Vercel/CI.

## Akceptacja iteracji

- Wszystkie 16 tras + wildcard: loading/error/empty/normal content według dostępności stanu; każde CTA ma zgodny cel i nazwę.
- Mobile 360/390/768 i desktop 1440: FAQ, katalog, produkt, koszyk, checkout, chat, długie polskie treści; zoom 200% jako właściwy browser zoom.
- Klawiatura/AT: skip link, kolejność fokusu, labels/errors, natywne disclosures, sortowanie tabeli, unread status, drawer/dialog i powrót fokusu.
- Reduced-motion: brak ciągłego ruchu particles i pulsu unread; focus/hover/selected mają czytelne, spójne stany.
- Checkout sandbox: guest/account, success/cancel/failure/expiry, powtórzony/out-of-order webhook, brak stocku, timeout/niejednoznaczna odpowiedź providerów.
- Legal/privacy: realny kontakt, metody, przewoźnicy, cena/dostawa/zwrot/zgoda cookies potwierdzone przez właściwego właściciela; zgodność treści z network i systemem.
- Nie publikować metryk konwersji, prawdziwych review, czasu wysyłki, popularności ani gwarancji gatunkowej bez danych źródłowych.

## Źródła i granice prawne

- [ELI: tekst jednolity ustawy o prawach konsumenta, Dz.U. 2026 poz. 1244](https://eli.gov.pl/api/acts/DU/2026/1244/text/U/D20261244Lj.pdf) — status obowiązujący według ELI; tekst stanu prawnego na 2026-09-02. ELI wskazuje także późniejszą zmianę od 2027-09-27, którą trzeba ponownie sprawdzić przed startem sprzedaży.
- [UOKiK: informacja przy sprzedaży na odległość](https://prawakonsumenta.uokik.gov.pl/prawo-do-informacji/sprzedaz-poza-lokalem-i-na-odleglosc/).
- [UOKiK: terminy odstąpienia](https://prawakonsumenta.uokik.gov.pl/prawo-odstapienia-od-umowy/terminy-odstapienie/).
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/).
- [Vercel Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) — pobrano 2026-11-14; stosowane reguły fokus/labels/reduced-motion/CTA.

Ten przegląd jest audytem produktu i listą kontrolną. Nie jest poradą prawną, badaniem użytkowników ani dowodem live działania operatorów.
