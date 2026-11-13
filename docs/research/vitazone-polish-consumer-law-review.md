---
title: "VitaZone — przegląd prawny ścieżki sprzedaży (Polska)"
status: owner-and-legal-review-required
owner: Codex
updated: 2026-11-13
---

# Przegląd prawny sklepu VitaZone — Polska

To jest przegląd ryzyk interfejsu i listy kontrolnej na podstawie publicznych aktów oraz wytycznych, nie opinia prawna. Nie sprawdzałem dokumentów firmy, umów z dostawcami ani konfiguracji produkcyjnej. Przed publikacją regulamin, polityki i proces sprzedaży powinien zatwierdzić właściciel z kompetentnym prawnikiem.

## Wymogi i ryzyka widoczne w ścieżce

1. **Informacja przed zakupem.** Przed złożeniem zamówienia klient powinien dostać jasne informacje m.in. o sprzedawcy i kontakcie, głównych cechach towaru, łącznej cenie i kosztach dostawy, sposobie płatności i realizacji, reklamacjach oraz prawie odstąpienia i jego wyjątkach. UOKiK opisuje obowiązki sprzedaży na odległość; dane firmy i kanał kontaktu w witrynie trzeba potwierdzić z właścicielem. [Ustawa o prawach konsumenta, aktualny tekst jednolity](https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20260001244) · [UOKiK — sprzedaż na odległość](https://prawakonsumenta.uokik.gov.pl/prawo-do-informacji/sprzedaz-poza-lokalem-i-na-odleglosc/)
2. **Cena i dostawa.** Frontend wcześniej zakładał stałą kwotę domyślną, a serwer mógł użyć nadpisania środowiskowego. Checkout pobiera teraz kwotę dostawy z serwera i nie pozwala rozpocząć płatności przed uzyskaniem tej wartości. Nie sprawdzałem rzeczywistego ustawienia produkcyjnego. Właściciel powinien potwierdzić metodę, zasięg, wyjątki i kwotę dostawy oraz spójność podsumowania z Stripe.
3. **Przycisk finalizacji.** Przed publikacją prawnik powinien potwierdzić, że ostatni krok checkoutu jasno informuje o obowiązku zapłaty i spełnia wymogi dla przycisku zamówienia. Obecny tekst „Przejdź do Stripe Checkout” mówi o przejściu do płatności, ale wymaga oceny w pełnym, rzeczywistym przepływie po stronie Stripe.
4. **Odstąpienie.** Zasadą dla umowy konsumenckiej zawieranej online jest 14 dni, z wyjątkami określonymi ustawą. Nie przesądzam, czy i kiedy wyjątek dotyczy żywych zwierząt w tym sklepie. Nie stosować jednego automatycznego wyłączenia dla żywych zwierząt lub wszystkich produktów bez oceny prawnej dla konkretnego towaru i sposobu dostawy. [UOKiK — terminy odstąpienia](https://prawakonsumenta.uokik.gov.pl/prawo-odstapienia-od-umowy/terminy-odstapienie/)
5. **Oświadczenie 18+ i zwierzęta.** Checkout wymaga obecnie deklaracji pełnoletności i akceptacji zasad wydania żywych zwierząt w każdym koszyku, także z samymi akcesoriami. Właściciel z prawnikiem powinien potwierdzić podstawę, zakres i treść; nie zmieniono jej automatycznie. Przed sprzedażą każdego żywego gatunku trzeba osobno potwierdzić legalne pochodzenie, wymagane dokumenty i ograniczenia posiadania/obrotu. Ustawa o ochronie przyrody ogranicza obrót gatunkami niebezpiecznymi, a zasady CITES i rejestracji zależą od gatunku oraz pochodzenia. [Ustawa o ochronie przyrody, Dz.U. 2026 poz. 1315](https://isap.sejm.gov.pl/isap.nsf/download.xsp/WDU20260001315/O/D20261315.pdf) · [Gov.pl — CITES i przywóz](https://www.gov.pl/web/gov/sprawdz-czy-mozesz-legalnie-przywiezc-do-polski-rosliny-zwierzeta-albo-produkty-z-nich-wykonane) · [Gov.pl — rejestracja gatunków objętych ograniczeniami](https://www.gov.pl/web/gov/zarejestruj-lub-wykresl-z-rejestru-zwierze-ktorego-przewozenie-podlega-ograniczeniom)
6. **Cookies i analityka.** Prawo komunikacji elektronicznej wymaga uprzedniej, zrozumiałej informacji i zgody na przechowywanie informacji lub dostęp do niej na urządzeniu, poza przewidzianymi wyjątkami. Jeżeli przetwarzanie danych opiera się na zgodzie, RODO wymaga możliwości jej wycofania. Wprowadzono dostępne ponownie ustawienia w stopce; polityka nie wymienia fikcyjnych kategorii jako potwierdzonej inwentaryzacji. Usunięto też trwały cache profilu adresowego użytkownika z `localStorage`; sesja jest weryfikowana przez cookie i `/api/auth/me`. Właściciel/IOD nadal powinien zweryfikować rzeczywiste pliki, pozostałe wpisy local/session storage, requesty oraz zachowanie Vercel Analytics i Speed Insights w produkcji, a następnie zatwierdzić treść informacji. [PKE, art. 399–400](https://isap.sejm.gov.pl/isap.nsf/download.xsp/WDU20240001221/O/D20241221.pdf) · [RODO, art. 7](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679)

## Blokady przed publikacją

- Potwierdzić pełną nazwę i dane sprzedawcy, adres, e-mail, telefon lub inny wymagany kanał kontaktu. Nie traktować obecnych danych w stopce jako zweryfikowanych.
- Zweryfikować regulamin, płatność, koszty i czasy dostawy, reklamacje, zwroty, wzór odstąpienia oraz każdą kategorię towarów wymagającą wyjątku.
- Dla każdego wystawionego żywego zwierzęcia zatwierdzić nazwę taksonomiczną, pochodzenie, dokumenty i ograniczenia sprzedaży/posiadania/wysyłki. Nie uruchamiać synchronizacji katalogu z niezweryfikowanymi deklaracjami o łatwości opieki, świeżości, czasie wysyłki lub kompletności zestawu.
- Wykonać inwentaryzację cookies i innych identyfikatorów na działającej produkcji, także przed zgodą, po odmowie i po zmianie decyzji; porównać ją z polityką i konsentem.
- Ocenić konieczność oraz podstawę oświadczenia 18+ dla poszczególnych towarów i zgodność ostatniego przycisku zamówienia z wymogami.

## Granice przeglądu

Stan prawny sprawdzono 2026-11-13 w wymienionych źródłach. Nie oceniano konkretnego gatunku, dokumentu importowego, podatków, obowiązków transportera ani kompletności obecnego regulaminu. Wnioski prawne pozostają do zatwierdzenia przez właściwą osobę.
