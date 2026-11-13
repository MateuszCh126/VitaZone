---
title: "VitaZone: trust and guest checkout"
status: draft-pr-open-awaiting-owner-facts-and-review
owner: Codex
updated: 2026-11-13
---

# VitaZone — zaufanie i zakup bez konta

## Zakres i status

Zmiany wypchnięte na gałęzi `codex/vitazone-trust-checkout`; [PR #1](https://github.com/MateuszCh126/VitaZone/pull/1) jest otwarty jako draft do `main`. Nie scalono ani nie wdrożono.

- Checkout: dopuszczono gościa w API i UI. Serwer wiąże konto wyłącznie z sesją uwierzytelnioną, a klient nie przesyła `userId`. Odpowiedź publicznego sprawdzenia sesji ograniczona do statusu płatności; nie zwraca identyfikatora zamówienia ani jego historii. Id sesji przyjmowane w body POST zamiast ścieżki GET. Webhook pozostaje osobnym mechanizmem finalizacji. Admin listuje zamówienia gości przez adres ze snapshotu wysyłki.
- Checkout UI: etykiety, autocomplete, typ e-mail, błędy przy polach, zakup bez logowania i bez przekierowania do panelu po zakupie gościa.
- Listing: sortowanie po cenie i `created_at` oraz kolejność katalogu; chipy aktywnych filtrów, liczba wyników, jasny reset; dwie ścieżki wejściowe.
- Niepotwierdzone badge'e i „Najczęściej wybierane” zastąpiono neutralnym oznaczeniem; bez danych nie pokazujemy bestsellerów i dopasowania na start.
- Kontakt: usunięto jawnie fikcyjny telefon i adres. Kanał email jest nadal wpisany w istniejącym kodzie, lecz wymaga potwierdzenia przez właściciela.
- Cookies: równorzędna akceptacja/odmowa analityki, dostępna klawiaturą kontrolka i opis zgodny z istniejącym przełączaniem analityki Vercel. Marketing nie jest oferowany jako kategoria zgody.
- SEO: poprawiona sitemap dla potwierdzonego aliasu i publicznych stron, wildcard kieruje do prawdziwej 404, istniejący Product JSON-LD nie dodaje opinii ani ocen.
- Badania i rejestr niepewności: [plan badań UX](../research/vitazone-ux-research.md).

## Weryfikacja

- `pnpm test -- --run` — 22 testy przeszły przed ostatnimi kosmetycznymi poprawkami tekstowymi i rozpoczęciem rozdzielania etapów; uruchomić ponownie na finalnym drzewie.
- `pnpm build` — build przeszedł przed ostatnimi kosmetycznymi poprawkami.
- `pnpm lint` — 0 błędów, 5 ostrzeżeń: 4 istniejące odwołania do `process` w `playwright.config.js` oraz brak `loading` w dependencies hooku Checkout (poprawiony po uruchomieniu, wymaga ponownego lint).
- `pnpm check:secrets` — przeszedł.
- `pnpm test:e2e` — nie wystartował: projekt nie ma `DATABASE_URL` i `JWT_SECRET`, a Vite próbuje nasłuchiwać na `0.0.0.0:5173` i dostaje `EACCES`. Nie odnotowano wyników Playwright.

## Otwarte zależności

- Właściciel musi potwierdzić dane firmy, email, zdjęcia/licencje, produktowe fakty, koszty i logistykę dostaw. Legalne dokumenty nadal wymagają weryfikacji przez kompetentną osobę.
- Brak dostępu do klientów, pytań do obsługi, zwrotów, anulowań i analityki. Nie wyciągnięto wniosków o zachowaniach ani konwersji.
- Checkout Stripe nie został przetestowany end-to-end z rzeczywistą transakcją w trybie testowym; brak konfiguracji środowiska wymaganej przez dev server. Webhook, ponowienia, wygaśnięcie/rezerwacja i niedostępny stan magazynu wymagają odrębnego testu integracyjnego.
- Link do e-maila `kontakt@animalsshop.pl` i branding nadawcy `RESEND_FROM_EMAIL` wymagają potwierdzenia przed publikacją.
- Konfiguracja sieciowa pozwala na właściwą origin allowlist oraz webhook; zmiana nie była wdrażana.
