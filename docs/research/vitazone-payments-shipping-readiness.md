---
title: "VitaZone — gotowość płatności i dostawy"
status: awaiting-provider-accounts-and-sandbox-credentials
owner: Codex
updated: 2026-11-13
---

# Płatności i dostawa — gotowość integracji

## Uzgodniony kierunek

- Płatności: karty, BLIK i Przelewy24 (P24), o ile metody są dostępne i aktywne na koncie Stripe sprzedawcy.
- Dostawa: rozważane InPost i DPD, ale właściciel potwierdził, że nie ma jeszcze zawartych umów z przewoźnikami.
- Nie używać prawdziwych sekretów w repozytorium, promptach ani testach. Konfigurację kont i środowisk testowych przeprowadzić później przez bezpieczne zmienne środowiskowe.

## Płatności

Sklep już tworzy hostowaną sesję Stripe Checkout bez przypinania `payment_method_types`. API Stripe pozwala wtedy na dynamiczny wybór metod aktywnych w ustawieniach płatności konta. Nie ma potrzeby budować osobnej formularzowej integracji P24/BLIK w przeglądarce. BLIK jest dokumentowany dla klientów z Polski i PLN oraz Stripe Checkout; wymaga dostępności na koncie. [Stripe Checkout](https://docs.stripe.com/payments/checkout) · [Stripe BLIK](https://docs.stripe.com/payments/blik) · [Stripe API: `payment_method_types`](https://docs.stripe.com/api/checkout/sessions/object)

P24 wymaga osobnej weryfikacji kwalifikowalności firmy i konta. Stripe opublikował zmienione wymagania onboardingowe dla nowych włączeń P24 od 6 sierpnia 2026 r.; obejmują ograniczenia typów podmiotów i wymagane dane firmy/strony. Użytkownik powinien najpierw sprawdzić Dashboard lub support Stripe — kod nie może obejść ich weryfikacji. [Wymagania Stripe dla P24](https://support.stripe.com/questions/przelewy24-%28p24%29-onboarding-requirements?locale=en-GB)

Kod obsługuje już webhooki `checkout.session.completed`, `checkout.session.expired` oraz zdarzenia PaymentIntent. Dodano obsługę `checkout.session.async_payment_succeeded` i `checkout.session.async_payment_failed`, aby opłacenie lub zwolnienie rezerwacji następowało według podpisanego zdarzenia Stripe. Dodany test kontraktowy potwierdza, że sesja nie ogranicza listy metod na sztywno, a dwa kolejne testy sprawdzają opóźnione powodzenie i niepowodzenie. Nie przeprowadzono płatności w sandboxie ani przez konto produkcyjne.

## Dostawa

Brak własnych umów bezpośrednio z InPost/DPD nie musi blokować wysyłki **akcesoriów**. Sprawdzone w oficjalnych warunkach agregatorów (13.11.2026):

- **Apaczka** deklaruje bezpłatne konto bez umowy z przewoźnikiem i bez minimalnej liczby przesyłek; obsługuje m.in. InPost, DPD i API do własnego sklepu. Rozliczenie może być prepaid albo postpaid; postpaid zależy od przyznania limitu. Publiczna stawka „od 7,32 zł netto” nie jest wyceną dla VitaZone i nie obejmuje wskazanych opłat paliwowej/drogowej. Klucze API wymagają konta w panelu. [Apaczka — oferta i FAQ](https://www.apaczka.pl/) · [klucze API](https://www.apaczka.pl/centrum_pomocy/klucze-api/) · [indeks regulaminów](https://www.apaczka.pl/regulaminy/)
- **Furgonetka** deklaruje ofertę dla firm bez stałej umowy/abonamentu i płatność za nadane przesyłki. API udostępnia sandbox, mapę punktów i proces wyceny, zamówienia oraz śledzenia. Wymaga konta i rejestracji aplikacji OAuth (`Client ID`/`Client Secret`), przechowywanych wyłącznie po stronie serwera. Stawka zależy od usługi i paczki; publiczne „od” i opłata 0,23 zł dla niektórych przesyłek na własnych umowach nie są ceną standardowej usługi brokerskiej. [Furgonetka — oferta dla firm](https://furgonetka.pl/narzedzia-biznes) · [OAuth](https://furgonetka.pl/api/oauth) · [API: przesyłki](https://furgonetka.pl/api/rest/packages-instruction) · [sandbox](https://furgonetka.pl/api/rest) · [mapa punktów](https://furgonetka.pl/api/mapa)

Są to alternatywy, które warto porównać — nadal wymagają założenia konta u agregatora, konfiguracji rozliczeń, akceptacji jego aktualnych warunków oraz otrzymania kluczy/API. Nie utworzono kont ani nie aktywowano usług. Nie ustawiono cen w checkoutcie na podstawie reklamowanych stawek „od”.

### Furgonetka — wycena w sandboxie, bez fulfillmentu

PR #1 podłącza credential-gated adapter `server/services/shipping/furgonetkaClient.js` do pobierania wycen w checkoutcie. Backend pobiera usługi dostępne na koncie, pozwala wyłącznie na broker-owned InPost/DPD, buduje paczki z profili zapisanych w katalogu i sam przekazuje `service_id` do `/packages/calculate-price`. Przeglądarka nie wybiera identyfikatora taryfy ani kwoty: backend ponawia wycenę przed rezerwacją produktu i utworzeniem sesji Stripe. Zmieniona lub niedostępna cena wymaga ponownego zatwierdzenia przez klienta. Zamówienie zapisuje migawkę wybranej metody, kwoty, pośrednika i usługi. Kategorie żywych zwierząt oraz niesklasyfikowane produkty są odrzucane po stronie serwera.

To nadal wyłącznie wycena w oficjalnym sandboxie, nie aktywna metoda dostawy. Bez tokena, danych nadawcy lub zmierzonych profili produktowych checkout fail-closed i nie pokazuje atrapowych cen. Kod nie tworzy paczek, nie zamawia przewozu/odbioru i nie wystawia etykiet. Obecny kod przyjmuje statyczny `FURGONETKA_ACCESS_TOKEN`; nie implementuje OAuth ani odnawiania tokenów, więc nie jest gotowy do produkcji. Oficjalny OAuth wymaga zarejestrowanej aplikacji (`Client ID`/`Client Secret`); token access z authorization-code jest ważny 30 dni, a refresh token jest jednorazowy, zwracany ponownie po każdym odświeżeniu i ważny do 3 miesięcy. Integracja produkcyjna musi bezpiecznie przechowywać i atomowo rotować odświeżany token, obsłużyć równoległe żądania i ponowną autoryzację po wygaśnięciu. Nie wybierać `client_credentials` w ciemno — dokumentacja podaje dla niego 60-minutowy token bez możliwości odświeżenia; dostęp do usług nadawczych trzeba potwierdzić dla konta. [Oficjalna dokumentacja OAuth2](https://furgonetka.pl/api/oauth)

Przed włączeniem rzeczywistych wycen trzeba założyć konto u wybranego agregatora, uzyskać właściwą zgodę konta/API, skonfigurować trwałe przechowywanie rotowanych tokenów oraz potwierdzić dane nadawcy i odbiorcy, role podmiotów i wymaganą informację o przekazaniu danych. Następny zakres fulfillmentu musi osobno wdrożyć wybór punktu/konkretnej usługi, idempotentne utworzenie przesyłki po potwierdzonym webhooku Stripe, walidację, błędy/ponowienia, anulowanie, tracking i bezpieczne generowanie etykiet.

### Ograniczenia wysyłki żywych zwierząt

- Zasady InPost zakazują w sieci przewozu żywych i martwych zwierząt, w tym owadów. [InPost — zasady pakowania, obowiązujące od 16.03.2026](https://inpost.pl/sites/default/files/docs/regulaminy/zasady-przygotowania-i-pakowania-przesylek-inpost-obowiazujacy-od-16032026-2268544.pdf)
- DPD wyklucza zwierzęta i owady ze standardowych usług kurierskich. [DPD — towary wykluczone](https://www.dpd.com/pl/pl/2025/07/09/czego-nie-wolno-wysylac-towary-wykluczone-z-transportu/) · [szczegółowe warunki usług](https://www.dpd.com/wp-content/uploads/sites/260/2026/02/Szczegolowe-Warunki-Swiadczenia-Uslug_02.2026_PL.pdf)
- Pocztex dopuszcza tylko wąskie, warunkowe wyjątki, które nie stanowią ogólnego rozwiązania dla gadów i pajęczaków. Kwalifikację konkretnego gatunku, usługę i wymagania opakowania trzeba potwierdzić z operatorem przed ofertowaniem. [Pocztex — regulamin obrotu krajowego](https://www.poczta-polska.pl/wp-content/uploads/2025/02/regulamin-swiadczenia-uslugi-pocztex-w-obrocie-krajowym_27-04-2026.pdf)

Nie oferować przy żywym zwierzęciu standardowej usługi lub punktu odbioru tylko dlatego, że agregator wyświetla ją dla zwykłych paczek. Właściciel musi wskazać potwierdzoną metodę — np. specjalistyczny przewóz lub odbiór osobisty — oraz zasady pakowania i ceny. Dopóki ich nie poda, żywe zwierzęta nie mają potwierdzonej ścieżki dostawy w tym projekcie.

### Bezpośrednie integracje przewoźników

Jeżeli właściciel wybierze umowę bezpośrednią po jej zawarciu i otrzymaniu danych sandbox, można rozważyć:

- [InPost Developers](https://developers.inpost-group.com/) — REST API dla przesyłek/etykiet i tracking; [Geowidget](https://developers.inpost-group.com/geowidget-integration) dla wyboru punktu odbioru.
- [DPD Polska Web Services](https://www.dpd.com/pl/pl/oferta-dla-firm/rozwiazania-it-dpd-polska/implementacja-wtyczek-web-service-dpd-polska/) — usługi przewozowe, etykiety i tracking; dokumentacja API jest osobna od DPD Online: [Swagger](https://dpdservices.dpd.com.pl/swagger-ui/index.html).

W kodzie jest wybór InPost/DPD według aktualnej wyceny, ale nadal nie ma punktów odbioru, kodu punktu, numeru przesyłki, etykiety, API tracking ani refundowania etykiet. Adapter nie jest jeszcze zintegrowany z fulfillmentem. Przed właściwym wdrożeniem trzeba zaprojektować idempotentne tworzenie przesyłek po potwierdzonej płatności, ponowienia/błędy, anulowanie i zwroty oraz bezpieczne przechowywanie danych nadawcy/kluczy. Nie uruchamiać wysyłki na podstawie samego przekierowania klienta z Checkout.

Do czasu potwierdzenia wyboru Furgonetki lub innego agregatora, założenia konta i otrzymania danych testowych nie dodano nieprawdziwych metod dostawy ani atrapowych cen. Punktów odbioru nie oferować dla żywych zwierząt. Właściciel powinien potwierdzić wybór usługi dla akcesoriów, sprawdzić rzeczywiste ceny i zasięg oraz dostarczyć dostęp sandbox przez bezpieczne środowisko; osobno potwierdzić dostawę żywych zwierząt.

## Następne kroki

1. W Stripe Dashboard sprawdzić dostępność i aktywować karty, BLIK, a dla P24 zakończyć wymagany onboarding.
2. Wysłuchać/wykonać pełny sandbox dla każdej metody: powodzenie, anulowanie, opóźnione potwierdzenie, niepowodzenie, wygaśnięcie i webhook ponowiony.
3. Porównać Apaczkę i Furgonetkę dla akcesoriów; wybrać brokera lub zawrzeć umowę bezpośrednią, założyć konto i uzyskać sandbox, taryfy, dane punktów oraz warunki paczek/zwrotów.
4. Dla Furgonetki zarejestrować OAuth app, uzgodnić bezpieczne trwałe miejsce na rotujące tokeny i skonfigurować sandbox. Nie przekazywać sekretów w repozytorium ani czacie.
5. Przed aktywacją wycen ukończyć OAuth i prywatnościową weryfikację przekazywania danych. Następnie po potwierdzeniu konta i profili produktów zaimplementować fulfillment: utworzenie przesyłki i zapis shipment reference idempotentnie po zdarzeniu płatności.
