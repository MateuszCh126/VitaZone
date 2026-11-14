---
title: "VitaZone: trust and guest checkout"
status: merged-pr1-followups-in-pr2-owner-facts-pending
owner: Codex
updated: 2026-11-14
---

# VitaZone — zaufanie i zakup bez konta

## Zakres i status

[PR #1](https://github.com/MateuszCh126/VitaZone/pull/1) został scalony do `main`. Późniejsze poprawki zaufania, dostawy i warstwy wizualnej trafiły do `main` przez [PR #2](https://github.com/MateuszCh126/VitaZone/pull/2) (squash `005f272`). Historia niżej opisuje zakres i granice dowodów z tych iteracji; nie potwierdza wdrożenia produkcyjnego.

- Checkout: dopuszczono gościa w API i UI. Serwer wiąże konto wyłącznie z sesją uwierzytelnioną, a klient nie przesyła `userId`. Odpowiedź publicznego sprawdzenia sesji ograniczona do statusu płatności; nie zwraca identyfikatora zamówienia ani jego historii. Id sesji przyjmowane w body POST zamiast ścieżki GET. Webhook pozostaje osobnym mechanizmem finalizacji. Admin listuje zamówienia gości przez adres ze snapshotu wysyłki.
- Checkout UI: etykiety, autocomplete, typ e-mail, błędy przy polach, zakup bez logowania i bez przekierowania do panelu po zakupie gościa.
- Listing: sortowanie po cenie i `created_at` oraz kolejność katalogu; chipy aktywnych filtrów, liczba wyników, jasny reset; dwie ścieżki wejściowe.
- Niepotwierdzone badge'e i „Najczęściej wybierane” zastąpiono neutralnym oznaczeniem; bez danych nie pokazujemy bestsellerów i dopasowania na start.
- Kontakt: w PR #1 usunięto jawnie fikcyjny telefon i adres. Niezweryfikowany adres e-mail usunięto później w PR #2; działający kanał kontaktu nadal wymaga potwierdzenia przez właściciela.
- Cookies: równorzędna akceptacja/odmowa analityki, dostępna klawiaturą kontrolka i opis zgodny z istniejącym przełączaniem analityki Vercel. Marketing nie jest oferowany jako kategoria zgody.
- SEO: poprawiona sitemap dla potwierdzonego aliasu i publicznych stron, wildcard kieruje do prawdziwej 404, istniejący Product JSON-LD nie dodaje opinii ani ocen.
- Badania i rejestr niepewności: [plan badań UX](../research/vitazone-ux-research.md).

## Weryfikacja

- `pnpm test -- --run` — 39 testów w 10 plikach przeszło w bieżącym lokalnym stanie, w tym checkoutu gościa, walidacji dostawy, webhooków i edycji profilu paczki.
- `pnpm build` — przeszedł; Vite zgłasza przestarzałą bazę Browserslist (11 miesięcy).
- `pnpm lint` — przeszedł bez błędów i ostrzeżeń.
- `pnpm check:secrets` — przeszedł.
- `$env:PLAYWRIGHT_PORT='4181'; pnpm test:e2e` — 3/3 scenariusze Playwright przeszły na fixture demo: strona główna, wyszukiwanie/listing → produkt → koszyk oraz demonstracyjny czat. Port 4173 był już zajęty, a 4174 obsługuje lokalny podgląd użytkownika; testy uruchomiono więc na wolnym porcie 4181. Runner nie wymaga `DATABASE_URL` ani `JWT_SECRET`. To nie sprawdza prawdziwego backendu, płatności Stripe ani webhooków.

## Otwarte zależności

- Właściciel musi potwierdzić dane firmy, email, zdjęcia/licencje, produktowe fakty, koszty i logistykę dostaw. Legalne dokumenty nadal wymagają weryfikacji przez kompetentną osobę.
- Brak dostępu do klientów, pytań do obsługi, zwrotów, anulowań i analityki. Nie wyciągnięto wniosków o zachowaniach ani konwersji.
- Checkout Stripe nie został przetestowany end-to-end z rzeczywistą transakcją w trybie testowym; brak konfiguracji środowiska wymaganej przez dev server. Webhook, ponowienia, wygaśnięcie/rezerwacja i niedostępny stan magazynu wymagają odrębnego testu integracyjnego.
- Link do e-maila `kontakt@animalsshop.pl` i branding nadawcy `RESEND_FROM_EMAIL` wymagają potwierdzenia przed publikacją.
- Konfiguracja sieciowa pozwala na właściwą origin allowlist oraz webhook; zmiana nie była wdrażana.

## Status przeglądu

- PR #1 został scalony do `main`; PR #2 później usunął niezweryfikowany kanał e-mail. Brak potwierdzenia wdrożenia produkcyjnego.
- Runner Playwright działa lokalnie na loopbackie i używa wyłącznie mocków demo; prawdziwa transakcja i webhook Stripe pozostają niezweryfikowane.

## Dostawa InPost/DPD — przygotowanie integracji

- Checkout pyta backend o dostępne wyceny InPost i DPD. API pobiera listę usług przypisanych do konta Furgonetki, ogranicza się do usług pośrednika Furgonetka, a następnie wycenia tylko znalezione po stronie serwera `service_id`. Przeglądarka wysyła metodę (`inpost` albo `dpd`) i ostatnio pokazane grosze tylko jako oczekiwaną wartość porównawczą. Backend wycenia ponownie przed zamówieniem; jeśli cena się zmieniła albo metoda zniknęła, zwraca `409` z nowymi wycenami i nie rezerwuje produktu. Klient musi obejrzeć i jawnie zatwierdzić aktualną metodę/cenę. Po zgodności backend zapisuje świeżą metodę, kwotę, pośrednika i dokładne `service_id` w snapshotcie zamówienia. Stripe używa zapisanej kwoty, nie wartości z przeglądarki. Identyfikator usługi nigdy nie jest zwracany przeglądarce.
- Polityka prywatności roboczo opisuje, że przy wycenie Furgonetka otrzymuje dane odbiorcy i parametry paczki; przed aktywacją właściciel/IOD ma potwierdzić role podmiotów, zakres, retencję i właściwe umowy.
- Pośrednik działa wyłącznie na stałym hoście sandbox. Brakujące, zerowe i ujemne ceny są odrzucane. Kod nie przełącza się na produkcyjne API, nie tworzy paczek/etykiet i nie zamawia odbioru. Testy sieci używają podstawionego `fetch`, bez wysyłania żądań do Furgonetki.
- Żywe zwierzęta oraz kategorie niezaklasyfikowane jako akcesoria są odrzucane po stronie serwera. Do wyceny każdy towar musi mieć mierzalny profil `specs.shipping_parcels` wpisany w edycji produktu. Przykład (wymiary zapakowanego towaru w cm, masa w kg):

  ```json
  {
    "shipping_parcels": [
      { "width": 30, "depth": 20, "height": 10, "weight": 2 }
    ]
  }
  ```

- `/account/services` należy do API operującego na zalogowanym koncie. Dokumentacja Furgonetki wymaga zgody właściciela konta przez OAuth authorization-code; nie używamy `client_credentials`, które jest przeznaczone dla endpointów bez uprawnień użytkownika i nie obsługuje odświeżania. Kod PR1 akceptuje wyłącznie sekret `FURGONETKA_ACCESS_TOKEN` oraz stały sandbox host i odrzuca żądania bez tokena. `client_id`, `client_secret`, przekierowanie OAuth, walidacja `state`, trwały sejf tokenów oraz atomowe odświeżanie jednorazowego `refresh_token` nie są zaimplementowane. To blokuje aktywację produkcyjną; sam ręczny token sandbox nie jest trwałą konfiguracją.
- Po wdrożeniu authorization-code OAuth należy skonfigurować zarejestrowany URI callback, zgodę konta i bezpieczne przechowywanie rotowanych tokenów oraz dane nadawcy: `FURGONETKA_PICKUP_NAME`, `FURGONETKA_PICKUP_COMPANY`, `FURGONETKA_PICKUP_EMAIL`, `FURGONETKA_PICKUP_PHONE`, `FURGONETKA_PICKUP_STREET`, `FURGONETKA_PICKUP_CITY`, `FURGONETKA_PICKUP_COUNTRY_CODE=PL` i `FURGONETKA_PICKUP_POSTCODE`; `FURGONETKA_PICKUP_COUNTY` jest opcjonalne. Sekretów nie wpisuj do repozytorium. Ten PR nie tworzy ani nie weryfikuje danych konta.
- Obecnie nie przekazano poświadczeń konta, nie ma zweryfikowanych profili paczek produktów i nie wykonano żądań do sandboxu. Dlatego nie ma potwierdzonych metod, cen ani dostępności; checkout zatrzymuje się przy braku konfiguracji/profilu zamiast pokazywać zmyśloną stawkę. Zmiana istniejącego `ORDER_SHIPPING_CENTS=4500` nie jest używana do Stripe checkout.
- Przed uruchomieniem produkcyjnym właściciel musi dodać/weryfikować dane nadawcy, zmierzyć paczki właściwych produktów i skonfigurować usługę u pośrednika. Produkcyjne OAuth/API, test transakcji Stripe oraz nadanie i etykiety pozostają poza tym zakresem. Nie wdrażano ani nie zmieniano Vercel.
- Źródła: [Furgonetka REST API — lista usług i wycena](https://furgonetka.pl/api/rest/packages-instruction), [OAuth2 Furgonetki — authorization code, refresh token i ograniczenia client credentials](https://furgonetka.pl/api/oauth). Izolowany klient sandbox PR1 przenosi tylko listowanie usług i wycenę z wcześniejszego adaptera PR2; nie przenosi jego produkcyjnego hosta ani tworzenia paczek.

### Weryfikacja dostawy

- `pnpm test -- --run tests/unit/shippingQuotes.test.js tests/unit/stripeSchema.test.js src/tests/integration/Checkout.test.jsx src/tests/integration/ProductShippingProfile.test.jsx` — testy adaptera sandbox, walidacji wyceny, checkoutu i edycji profilu paczki.
- `pnpm lint` i `pnpm build` — wymagane przed końcowym przeglądem.
