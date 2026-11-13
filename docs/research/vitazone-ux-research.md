# VitaZone — badania UX i rejestr dowodów

**Status:** plan badań oraz audyt kodu wykonane 13 listopada 2026. Badania z klientami nie zostały przeprowadzone. Nie otrzymaliśmy danych analitycznych ani zanonimizowanych zgłoszeń sklepu.

## Cel i miary

Pomóc dwóm grupom znaleźć produkt zgodny z potrzebą: osobom kompletującym pierwsze terrarium oraz opiekunom szukającym uzupełnień. Sukces oceniamy łącznie: ukończone, dopasowane zamówienia, anulowania, zwroty, kontakty do obsługi i zgłoszenia niedopasowania. Sam klik lub współczynnik konwersji nie potwierdza jakości wyboru.

## Co wiemy, a czego nie wiemy

| Obszar | Obserwacja | Źródło / status |
|---|---|---|
| Technologia | React 19, Vite, Express, PostgreSQL, Stripe Checkout; Tailwind 3 | package.json, konfiguracja, API i skrypty migracji w bieżącym checkoutcie |
| Zakup | przed zmianą router Stripe wymagał JWT; schemat zamówienia dopuszcza `user_id` NULL | `server.js`, `routes/stripeRoutes.js`, `schemas/stripeSchema.js`, schemat DB; przepływ gościa dopiero po tej gałęzi i wymaga weryfikacji płatności end-to-end |
| Katalog | wyszukiwanie tekstowe, kategoria, suwak ceny; brak sortowania i aktywnych chipów przed zmianą | `src/pages/Shop.jsx` |
| Merchandising | badge „Bestseller” i „Dobry na start” wynikały z nazwy/gatunku lub kategorii, nie z danych sprzedaży lub walidacji | `src/utils/productBadges.js`; kod zmieniono, by bez potwierdzonych danych nie pokazywać badge’y |
| Popularność | sekcja „Najczęściej wybierane produkty” miała ręcznie wskazaną listę; nie znaleziono dowodu sortowania po sprzedaży | `src/pages/Home.jsx`; tekst zmieniono na neutralny |
| Kontakt | w kodzie były przykładowe dane telefonu `+48 123 456 789` i adresu „Terrarystyczna 10” | `src/pages/Contact.jsx`, `src/components/Footer.jsx`, regulamin; usunięto z widoku. Faktyczne dane firmy nadal wymagają potwierdzenia przez właściciela |
| Adres e-mail | kod używa `kontakt@animalsshop.pl`, ale domena/adres nie zostały niezależnie zweryfikowane | stan nierozstrzygnięty; potwierdzić przed publikacją lub zmianą |
| Dane produktów | skrypt katalogu zawiera syntetyczne ceny, stany, obrazy i opisy; źródła zdjęć, prawdziwe specyfikacje, dostępność i pochodzenie każdego zdjęcia nie zostały zweryfikowane z właścicielem | `server/scripts/catalogData.js` jest oznaczony jako fixture demo; seed i sync katalogu wymagają jawnej zgody i odmawiają działania w produkcji. Nie traktować wartości fixture jako oferty |
| Produkcja — przegląd treści | wcześniejsza migawka przeglądarki z 13.11.2026 pokazywała przykładowy adres `ul. Terrarystyczna 10, 00-001 Warszawa`, telefon `+48 123 456 789`, „Polecane na start”, „Najczęściej wybierane” i deklarację wysyłki 24–48 h | wcześniejsza obserwacja nie potwierdza aktualnej treści; ponowny dostęp tego dnia został ograniczony wyzwaniem Vercel HTTP 429. Dane i obietnice nie zostały potwierdzone. Nie zmieniono produkcji |
| Deployment Vercel | `vercel list vitazone --limit 10 --json` 13.11.2026 wskazał najnowszy produkcyjny deployment Ready z 29.05.2026, commit `c20ff88` na `main`, z metadanymi źródłowego repozytorium `MateuszCh126/animalsshop`, a nie `MateuszCh126/VitaZone`. Oba repozytoria mają odrębne ID GitHub, choć ten sam commit `c20ff88` istnieje w obu. `vercel list vitazone --environment preview` nie zwrócił preview deploymentów. | oba draft PR-y są w repozytorium `VitaZone`; aktualne podpięcie Vercel nie generuje dla nich podglądów. Przed preview/produkcją trzeba ustalić, które repozytorium jest właścicielem wdrożenia. Produkcyjny build nie zawiera gałęzi PR. |
| Dostępność strony produkcyjnej | bieżące `curl -I -L` do `vitazone.vercel.app` i `animalsshop.vercel.app` 13.11.2026 zwróciło HTTP 429 z wyzwaniem Vercel; narzędzie web również nie otworzyło stron | nie weryfikowałem zawartości strony w tej kontroli; wcześniejsze obserwacje widocznych danych demo pozostają odrębną migawką z wcześniejszego przeglądu |
| Ruch i zachowania | brak dostarczonego dostępu do analityki, pytań, anulowań i zwrotów | brak danych; nie tworzyć person ani wyników konwersji |

## Hipotezy do walidacji

1. Osobny punkt wejścia dla „pierwszego terrarium” ułatwi rozpoczęcie zadania — sprawdzić, czy użytkownicy rozumieją zakres zestawu i umieją wskazać brakujące elementy bez doradzania niezweryfikowanego doboru.
2. Opiekunowie zwierząt częściej potrzebują skrótu do jednego konkretnego działu niż ścieżki zestawu — sprawdzić, czy skróty do oświetlenia, podłoży i pokarmu są zgodne z ich językiem i zadaniem.
3. Widoczne kryteria produktu, skład zestawu, wyłączenia, cena końcowa i warunki dostawy zmniejszają niepewność. Nie zakładać, że poprawią sprzedaż bez danych.
4. Zakup jako gość ograniczy barierę checkoutu. Mierzyć ukończenie wraz z błędami, niedopasowaniem, anulowaniami i zwrotami.
5. Ograniczenie poświaty i animacji poprawi czytelność bez utraty charakteru marki. Sprawdzić na urządzeniu i w ruchu ograniczonym.

Hipotezy wynikają z przeglądu interfejsu oraz kierunkowych badań branżowych, nie są wynikami VitaZone.

## Badania z klientami

### Dostęp i prywatność

Przed rekrutacją właściciel zatwierdza kontakt z klientami, dobór uczestników, informację o celu i podstawie przetwarzania. Nie eksportować pełnych danych zamówień ani danych osobowych do repozytorium. Do planowania wystarczą zagregowane liczebności i zanonimizowane fragmenty zgłoszeń bez maili, nazw, adresów, numerów zamówień i danych o zdrowiu. Nagrywać tylko po wyraźnej zgodzie; domyślnie robić notatki bez danych identyfikujących. Usunąć surowe notatki zgodnie z uzgodnioną retencją.

### Próby i rundy

Zorganizować osobną, iteracyjną rundę dla każdej grupy. Jakościowo zacząć od 5 uczestników na rundę; liczba ta służy odkrywaniu problemów, nie estymacji rynku ani konwersji. Rekrutować osoby rzeczywiście kompletujące pierwsze terrarium oraz obecnych opiekunów rozbudowujących wyposażenie. Po pierwszej rundzie poprawić prototyp, a następnie powtórzyć test, jeśli ważne nieporozumienia zostają.

### Krótki wywiad kontekstowy

- Opowiedz o ostatnim zakupie lub planie urządzenia terrarium. Co uruchomiło potrzebę?
- Jak określiłeś/łaś, czego szukać? Jakich źródeł używasz?
- Co musisz wiedzieć, zanim uznasz produkt za odpowiedni?
- Która informacja o kosztach, zawartości zestawu lub dostawie jest trudna do znalezienia?
- Co sprawia, że przerywasz zakup albo pytasz obsługę?
- Po zakupie: co nie pasowało do oczekiwań? (bez proszenia o dane wrażliwe)

Nie podpowiadać odpowiedzi i nie pytać „czy podoba Ci się” jako substytutu obserwacji zachowania.

### Scenariusze użyteczności

**Pierwsze terrarium:** „Planujesz przygotować miejsce dla [gatunku wybranego przez uczestnika]. Znajdź informacje, które pomogą Ci ocenić, czy ten sklep ma potrzebne produkty. Opowiedz, czego brakuje Ci do decyzji.” Nie sugerować konkretnej specyfikacji hodowlanej.

**Uzupełnienie:** „Masz już terrarium i chcesz wymienić/dokupić [konkretny produkt z doświadczenia uczestnika]. Znajdź go, porównaj warianty i pokaż, co sprawdzasz przed dodaniem do koszyka.”

W obu grupach obserwować: pierwszy wybór, błędne interpretacje, użycie wyszukiwania/filtrów, odnajdywanie ceny i kosztu dostawy, pewność co do zawartości, moment przerwania oraz pytania. Sukces oznacza poprawne wyjaśnienie dopasowania z widocznych danych; czas i ukończenie są sygnałami pomocniczymi.

## Rynek — wzorce do obserwacji, bez kopiowania

| Sklep / publiczna strona | Obserwacja w dniu przeglądu | Możliwy kierunek dla VitaZone |
|---|---|---|
| [Gekonowa Pasja — zestawy](https://www.gekonowapasja.pl/sklep/zestawy) | strona ma 9 zestawów w poddziałach, ceny i sygnał dostępności; prowadzi też do kreatora krok po kroku i pokazuje jawne progi rabatowe | hipoteza do testu: kreator lub lista zawartości może ułatwić kompletowanie; rabat stosować wyłącznie przy zatwierdzonej ekonomii i prawdziwym koszyku |
| [Terran Polska](https://terranpolska.pl/) | bardzo rozbudowana taksonomia kategorii (m.in. typy terrariów, ogrzewanie, filtracja, pomiary, pokarmy) oraz widoczny kanał telefonu i e-maila | sprawdzić w badaniu, czy węższe, zadaniowe wejścia VitaZone pomagają nowym klientom; nie kopiować szerokości katalogu bez danych |
| [Zmiennocieplne — strona kontaktu](https://zmiennocieplne.pl/kontakt/) | komunikaty o progu darmowej dostawy i godzinie granicznej nadania są widoczne już w górnej warstwie sklepu; strona zawiera też osobne wejścia do zestawów, gatunków i poradników | warunki i godziny VitaZone wymagają niezależnego potwierdzenia; nie publikować analogicznych obietnic bez operacyjnych danych |
| [TerraRex — zestaw tropikalny](https://www.terrarex.pl/terrarium-tropikalne-gotowe-do-zamieszkania-bogaty-zestaw-kartapdf-422.html) | karta podaje wymiar i listę elementów, ale dokument wskazuje „Niedostępny”; jednocześnie obiecuje szeroką przydatność dla wielu gatunków i bezpieczeństwo zestawu | pokazywać skład i dostępność jako osobne, konkretne pola; ostrożnie traktować uniwersalne deklaracje kompatybilności, które wymagają dowodu |

Migawka publicznych stron odczytana 13.11.2026; to nie pełny audyt konkurencji ani dowód, że dane mechanizmy zwiększają sprzedaż. Deklaracje konkurentów nie potwierdzają ich jakości ani nie stanowią podstawy do przejęcia obietnic w VitaZone.

## Rejestr twierdzeń wymagających dowodu / decyzji właściciela

- pełna nazwa firmy, NIP, adres rejestrowy i adres zwrotów;
- działający e-mail, telefon, godziny i realny zakres obsługi;
- ceny, stany, terminy, metody i koszty dostawy (oddzielnie zwierzęta/akcesoria);
- źródło, licencja i zgodność zdjęcia z konkretnym wariantem/zwierzęciem;
- pochodzenie, wiek, płeć, karmienie, zdrowie i dostępność konkretnego zwierzęcia;
- specyfikacje i kompatybilność zestawów, lamp, podłoży i wyposażenia;
- znaczenie etykiet „nowość”, „bestseller”, rekomendacji i opinii;
- warunki odstąpienia, reklamacji i dostawy zwierząt — do oceny przez kompetentną osobę prawną;
- retencja zgód i logowanie adresu IP w endpointzie zgód — do oceny prywatności/prawnej;
- czy skróty zakupowe odpowiadają językowi i zadaniom kupujących.

## Źródła zewnętrzne i granice wnioskowania

- [NN/g, Usability 101](https://www.nngroup.com/articles/usability-101-introduction-to-usability/): iteracyjne testy jakościowe; pięciu uczestników często ujawnia główne problemy użyteczności, nie reprezentuje całej populacji.
- [Baymard, product lists and filtering](https://baymard.com/research/ecommerce-product-lists) oraz [stan filtrowania i sortowania](https://baymard.com/research-articles/current-state-product-list-and-filtering): filtry, sortowanie i widoczność użytych filtrów są istotnymi wzorcami odkrywania produktów.
- [Baymard, checkout UX 2026](https://baymard.com/research-articles/current-state-of-checkout-ux): benchmark branżowy wspiera badanie zakupów bez konta, klarownego podsumowania i ograniczenia przerwań; nie mierzy VitaZone.
- [Google Search Central, dane produktowe](https://developers.google.com/search/docs/specialty/ecommerce/include-structured-data-relevant-to-ecommerce): schema powinna odpowiadać aktualnym, widocznym danym produktu.
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/): minimum celu 24×24 CSS px z wyjątkami; praktyczne cele mobilne powinny być większe, gdy układ na to pozwala.
- [FTC, Bringing Dark Patterns to Light](https://www.ftc.gov/system/files/ftc_gov/pdf/P214800%20Dark%20Patterns%20Report%209.14.2022%20-%20FINAL.pdf): ostrzeżenie przed fałszywą presją, aktywnością i dowodem społecznym.
- [Core Web Vitals](https://web.dev/articles/defining-core-web-vitals-thresholds): orientacyjne progi p75: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1.

## Kolejność prac i pomiar

1. Potwierdzić tożsamość firmy, prawną treść, zasady logistyki i specyfikacje produktów.
2. Zebrać bazę zagregowanych etapów: listing/wyszukiwanie → produkt → koszyk → checkout → płatność; osobno ścieżki nowego terrarium i uzupełnienia.
3. Kodować zanonimizowane powody anulowania, zwrotu, kontaktu i niedopasowania. Uzgodnić słownik i retencję.
4. Przeprowadzić dwie rundy badań jakościowych; udokumentować obserwacje, cytaty bez danych osobowych, przeciwprzykłady i niepewność.
5. Priorytetyzować według wpływu na dopasowanie i ryzyko, częstości zgłaszanej w dostępnych źródłach oraz kosztu wdrożenia. Nie ważyć wniosków według liczby kliknięć.
6. Porównać funnel przed/po dopiero, gdy analityka i zgody pozwalają na zgodny z prywatnością pomiar; łączyć go z anulowaniami, zwrotami, kontaktami i zgłoszeniami niedopasowania. Wartość `purchase` pochodzi z opłaconej sesji Stripe, a nie koszyka w przeglądarce. Bez wystarczającego ruchu nie uruchamiać testów A/B.
