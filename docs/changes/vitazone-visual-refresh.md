---
title: "VitaZone: calmer visual layer"
status: draft-pr-open-awaiting-owner-facts-and-review
owner: Codex
updated: 2026-11-13
---

# VitaZone — warstwa wizualna

## Zakres

Gałąź `codex/vitazone-visual-refresh` zawiera warstwę wizualną nad implementacją `codex/vitazone-trust-checkout` (synchronizacja do `e8fb7f3`). [PR #2](https://github.com/MateuszCh126/VitaZone/pull/2) jest otwarty jako draft względem gałęzi trust. PR #1 jest do `main`. Zmian nie scalono ani nie wdrożono. Szczegółowe tokeny oraz responsywne stany opisuje [handoff design systemu](../design-system/vitazone.md).

## Wykonane

- Halo kursora: z 600×600 px, `primary/20`, blur 140 px, `mix-blend-screen`, krycie 60% do 320×320 px, `primary/10`, blur 105 px i bez screen blend.
- Usunięto stale animowaną warstwę cząsteczek z `App`; nieużywany komponent usunięto.
- Podmieniono niedziałający adres zdjęcia okładkowego kategorii „Węże”; poprawiono też obraz i datę przykładowego produktu używanego przez testy, aby lokalny podgląd nie przedstawiał błędnego zdjęcia ani fałszywej etykiety nowości.
- Zredukowano motion zoomu zdjęć do 1.03/220 ms.
- Zdjęciowe karty kategorii i listingu mają wspólny promień 16 px.
- Dodano spójne tokeny palety, czasu ruchu, powierzchni i focus ring; globalna obsługa reduced motion. Ambient effects nie ładują się przy aktywnym systemowym `prefers-reduced-motion`.
- Na dotyku akcja dodania do koszyka jest widoczna bez hover; na klawiaturze ujawnia się przez focus-within.
- Wyciszono powtarzalny pasek korzyści, usunięto niepotwierdzone „Polecane na start” i pokazano neutralne informacje o dziale oraz katalogu.
- W opisie listingu usunięto niepotwierdzone odniesienie do „gotowych setupów”; licznik odróżnia teraz katalog od filtrowanych wyników, a przy błędzie pobierania nie przedstawia zera jako rzeczywistej liczby produktów.
- Czat informuje, że odpowiada na podstawie katalogu; usunięto stałe „Dostępny” niezależne od stanu API oraz doprecyzowano brak porad weterynaryjnych. Backend nie promuje arbitralnych gatunków jako „łatwych na start”.
- Z karty produktu i FAQ usunięto niepotwierdzoną obietnicę wysyłki w 24–48 godzin oraz szablonowe wymagania hodowlane. Koszyk nie przedstawia już ogólnego twierdzenia prawnego dla wszystkich produktów; link do zasad odstąpienia pojawia się przy produktach z kategorii żywych zwierząt.
- Opis strony „O sklepie”, etykiety kategorii i meta descriptions uproszczono do faktów wynikających z katalogu oraz kodu przepływu zakupowego; usunięto hasła o stabilnej opiece, suchych wybiegach, kontroli UVB i gotowym, dopasowanym zestawie bez potwierdzenia.
- Wyszukiwane podpowiedzi na stronie głównej są prawdziwymi przyciskami obsługiwanymi klawiaturą.
- Przyciski/CTA zachowują kontrast black-on-green, a stan fokusu jest widoczny.
- Zwiększono cele dotykowe ikon w nawigacji i koszyku oraz poprawiono kontrast drugorzędnych etykiet tekstowych, które na czarnym tle nie spełniały progu 4,5:1.
- Checkout pobiera aktualne wyceny InPost/DPD z backendu; backend ponownie sprawdza wybraną stawkę przed utworzeniem zamówienia i sesji Stripe, a zmiana ceny wymaga ponownego zatwierdzenia przez klienta.
- Płatności pozostają w hostowanym Stripe Checkout z dynamicznymi metodami konta (bez listy metod zakodowanej na stałe); dodano webhooki dla asynchronicznego sukcesu i niepowodzenia. Gotowość BLIK/P24 oraz przewoźników i wymagania kont opisuje [osobny przegląd integracji](../research/vitazone-payments-shipping-readiness.md).
- Integracja Furgonetki w PR #1 działa tylko przez sandbox i jedynie wycenia zweryfikowane profile paczek. Nie tworzy paczek ani etykiet i fail-closed wstrzymuje checkout bez tokena, danych nadawcy, wymiarów produktu lub jawnie obsługiwanej kategorii. Nie jest gotowa do aktywacji produkcyjnej: wymaga konta/usług, OAuth authorization-code z rotacją tokenów, weryfikacji danych nadawcy i odbiorcy oraz umów i informacji prywatności. Warunki i otwarte zależności opisuje [przegląd integracji](../research/vitazone-payments-shipping-readiness.md) oraz [PR #1](https://github.com/MateuszCh126/VitaZone/pull/1).
- Wartość zdarzenia `purchase` pochodzi teraz z `amount_total` zwróconego przez Stripe dla opłaconej sesji, a nie z sumy koszyka po stronie przeglądarki; zdarzenia rozpoczęcia checkoutu nie wysyłają szacowanej kwoty z klienta. Endpoint nadal nie zwraca gościowi identyfikatora zamówienia ani danych profilu.
- Dane `Product` JSON-LD pochodzą z aktualnie wyświetlanego produktu, używają ceny w groszach z API, jego rzeczywistych zdjęć i stanu magazynowego. Schema pomija brakujące zdjęcie/cenę i nie przedstawia ID rekordu jako SKU. Tekst jest escapowany przed wstawieniem do tagu `<script>`.
- Dodano `MotionConfig` respektujący systemowe ograniczenie ruchu dla animacji Framer Motion; dostosowano także copy prawne/FAQ, żeby nie orzekało zbiorczego wyjątku zwrotów dla żywych zwierząt.
- Zabezpieczono demo seed i synchronizację fikcyjnego katalogu: działają wyłącznie po jawnej zgodzie w środowisku nieprodukcyjnym; baza zdalna wymaga dodatkowego opt-in. Polityki prawne wyświetlają stan roboczy do czasu uzupełnienia faktów i akceptacji.
- Ustawienia analityki można ponownie otworzyć ze stopki; poprawiono etykietę pola czatu, zapowiedź nowych wiadomości, obsługę reduced motion w scrollowaniu oraz semantykę i fokus mobilnego menu. Koszyk otrzymał obsługę dialogu, Escape, pułapkę fokusu i przywrócenie fokusu.
- Po zapisaniu zgody cookies fokus wraca do trwałego przycisku ustawień prywatności, także po pierwszej decyzji z banera.
- Checkout używa jasnego nagłówka „Finalizacja zamówienia”, nie obiecuje niepotwierdzonej listy metod przed przejściem do Stripe i pokazuje polskie komunikaty o wygaśnięciu rezerwacji.
- Bieżący krok checkoutu ma semantyczne `aria-current="step"`; numery kroków są dekoracyjne dla czytnika ekranu.
- Galeria produktu ma nazwaną sekcję, ogłasza bieżące zdjęcie czytnikom ekranu i pozwala przełączać je strzałkami klawiatury bez utraty fokusu; zdjęcia nie zmieniają się automatycznie.
- Profil użytkownika nie jest już trwale kopiowany do `localStorage`; istniejący klucz `exotic_user` jest usuwany, a sesję przy odświeżeniu odtwarza endpoint `/api/auth/me` z cookie. Adres pozostaje dostępny w pamięci aplikacji do uzupełnienia checkoutu.
- Zdarzenie wyszukiwania przekazuje do analityki długość frazy zamiast jej treści, aby nie wysyłać tekstu wpisanego przez klienta do zewnętrznej analityki.
- Dodano osobny przegląd polskich obowiązków konsumenckich, prywatności oraz handlu zwierzętami i listę pytań blokujących publikację: [przegląd prawny](../research/vitazone-polish-consumer-law-review.md). To lista do weryfikacji z właścicielem i prawnikiem, nie zatwierdzenie regulaminu.

## Weryfikacja

- `git diff --check` — przeszedł po normalizacji zakończeń wierszy.
- `pnpm test -- --run` — po synchronizacji 72 testy w 15 plikach przeszły, w tym walidacja Product JSON-LD z błędnymi polami, serializacja bezpieczna dla HTML, galeria, gościnny checkout, wyceny dostawy i webhooki. Usunięto testy starego adaptera, który tworzył paczki; zastępuje je zakres wycen sandboxowych PR #1.
- `pnpm build` — przeszedł; Vite zgłosił tylko przestarzałą bazę Browserslist (11 miesięcy).
- `pnpm lint` — przeszedł bez błędów; poprawiono import `process` w konfiguracji Playwright. Pierwsza równoległa próba uruchomiona podczas E2E zakończyła się błędem odczytu tworzonego katalogu `test-results`; ponowne uruchomienie po zakończeniu E2E przeszło.
- `pnpm check:secrets` — przeszedł.
- Impeccable detector — zwrócił `[]` na wskazanym zestawie UI przed końcową korektą wyszukiwanych podpowiedzi i copy; odczytuję to jako brak zgłoszeń w tej przebieżce, nie jako certyfikację.
- W podglądzie lokalnym bez backendu listing zgłosił błąd pobrania, dlatego do dalszej oceny renderu użyłem jawnie mockowanego API i fixture demo (opis poniżej). Nie otwierałem ani nie modyfikowałem deploymentu produkcyjnego.
- Wykonałem aktualny przegląd zrzutów na danych demo: strona główna 1440 px przy normalnym i ograniczonym ruchu, listing 390 px, karta produktu 1440/390 px oraz koszyk i checkout 390 px. Zdjęcia demo zostały zdekodowane przed przechwyceniem; ocena układu nie potwierdza prawdziwych danych ani działania backendu.
- `$env:PLAYWRIGHT_PORT='4182'; pnpm test:e2e` — 12/12 scenariuszy Playwright na jawnych danych demo. Obejmują dwie ścieżki zakupowe, listing/koszyk, wyszukiwanie i reset pustych wyników, gościnny checkout z mockowaną wyceną InPost i Stripe bez `userId` w payloadzie, zakres czatu, focus management zgód, walidację checkoutu z fokusem pierwszego pola i checkboxa, przejście fokusu między krokami, etykiety i błędy formularzy, dialog koszyka, mobilne menu z pułapką fokusu/Escape, brak poziomego overflow przy szerokości 720 i 360 px podczas przejścia listing → produkt → koszyk → checkout oraz brak komunikatu o odstąpieniu dla żywych zwierząt przy koszyku zawierającym samo akcesorium. Szerokość 720 px jest przybliżeniem reflow przy powiększeniu, a nie testem powiększenia przeglądarki 200%. `playwright.config.js` domyślnie używa portu 4173 i pozwala zmienić go przez `PLAYWRIGHT_PORT`; API sklepu jest mockowane, więc testy nie dowodzą działania produkcyjnego backendu, webhooków ani prawdziwych płatności.
- Przegląd dostaw uzupełniono o oficjalne warunki Apaczki i Furgonetki oraz zakazy przewozu żywych zwierząt w standardowych usługach InPost/DPD. Nie aktywowano usług i nie zmieniano checkoutu bez kont, wycen i potwierdzonej metody dostawy żywych zwierząt.
- Testy Stripe są lokalnymi testami kontraktowymi; nie sprawdzają sieci, konfiguracji webhooka ani rzeczywistej transakcji Stripe.

## Ograniczenia

Brak badań z klientami, danych analitycznych i potwierdzonych źródeł praw do zdjęć. Fotografia, opisy/specyfikacje produktów, warunki dostaw, dane firmy i kontakt wymagają potwierdzenia z właścicielem. Kanał `kontakt@animalsshop.pl` pozostał w linkach z dotychczasowego kodu; należy go potwierdzić. Regulamin, zwroty i polityki prawne nadal wymagają sprawdzenia przez kompetentną osobę. Zmiany są w otwartych draft PR-ach w GitHubie i nie są widoczne na produkcji. Vercel wskazuje źródłowe repozytorium `MateuszCh126/animalsshop`, nie `MateuszCh126/VitaZone`; dla bieżących PR-ów nie ma podglądów Vercel. Przed przygotowaniem preview trzeba ustalić źródło wdrożenia.
