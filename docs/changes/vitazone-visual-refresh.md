---
title: "VitaZone: calmer visual layer"
status: implemented-locally-awaiting-owner-facts-and-review
owner: Codex
updated: 2026-11-13
---

# VitaZone — warstwa wizualna

## Zakres

Gałąź `codex/vitazone-visual-refresh`, bazuje na etapie `codex/vitazone-trust-checkout` (`d9a3adf`). Zmiany wyłącznie lokalne; brak MR, pushu i wdrożenia. Szczegółowe tokeny oraz responsywne stany opisuje [handoff design systemu](../design-system/vitazone.md).

## Wykonane

- Halo kursora: z 600×600 px, `primary/20`, blur 140 px, `mix-blend-screen`, krycie 60% do 320×320 px, `primary/10`, blur 105 px i bez screen blend.
- Usunięto stale animowaną warstwę cząsteczek z `App`; nieużywany komponent usunięto.
- Zredukowano motion zoomu zdjęć do 1.03/220 ms.
- Zdjęciowe karty kategorii i listingu mają wspólny promień 16 px.
- Dodano spójne tokeny palety, czasu ruchu, powierzchni i focus ring; globalna obsługa reduced motion. Ambient effects nie ładują się przy aktywnym systemowym `prefers-reduced-motion`.
- Na dotyku akcja dodania do koszyka jest widoczna bez hover; na klawiaturze ujawnia się przez focus-within.
- Wyciszono powtarzalny pasek korzyści, usunięto niepotwierdzone „Polecane na start” i pokazano neutralne informacje o dziale oraz katalogu.
- Czat w widoku sklepu nie obiecuje doboru zwierząt. Backend nie promuje arbitralnych gatunków jako „łatwych na start”; odpowiedzi mają pozostać w granicach danych katalogu i jasno wykluczać diagnozowanie/porady weterynaryjne.
- Wyszukiwane podpowiedzi na stronie głównej są prawdziwymi przyciskami obsługiwanymi klawiaturą.
- Przyciski/CTA zachowują kontrast black-on-green, a stan fokusu jest widoczny.

## Weryfikacja

- `git diff --check` — przeszedł po normalizacji zakończeń wierszy.
- `pnpm test -- --run` — 22 testy w 6 plikach przeszły.
- `pnpm build` — przeszedł; Vite zgłosił tylko przestarzałą bazę Browserslist (11 miesięcy).
- `pnpm lint` — 0 błędów, 4 ostrzeżenia `no-undef process` w `playwright.config.js`.
- `pnpm check:secrets` — przeszedł.
- Impeccable detector — zwrócił `[]` na wskazanym zestawie UI przed końcową korektą wyszukiwanych podpowiedzi i copy; odczytuję to jako brak zgłoszeń w tej przebieżce, nie jako certyfikację.
- Otworzyłem statyczny build na `127.0.0.1:4173`; sprawdziłem dostępnościowy widok i zrzut strony głównej oraz listingu w mobilnym kadrze. CTA uruchomiło ścieżkę terrariów. Listing zwrócił 0 produktów i komunikat o błędzie pobrania, ponieważ lokalny backend/baza nie były uruchomione.
- `pnpm test:e2e` — Playwright nie wystartował. Dev server wymaga `DATABASE_URL` oraz `JWT_SECRET`, których checkout nie ma; Vite próbował słuchać na `0.0.0.0:5173` i otrzymał `EACCES`. Po starcie statycznego preview port `127.0.0.1:4173` działał, ale ten tryb nie weryfikuje API, płatności, prawdziwych danych ani całego checkoutu.

## Ograniczenia

Brak badań z klientami, danych analitycznych i potwierdzonych źródeł praw do zdjęć. Fotografia oraz produktowe fakty wymagają potwierdzenia z właścicielem. Kanał `kontakt@animalsshop.pl` pozostał w linkach z dotychczasowego kodu, bo nie otrzymałem zatwierdzonego adresu zastępczego; należy potwierdzić go przed publikacją. Legalne treści wymagają sprawdzenia przez kompetentną osobę. Zmiany są lokalne — nie są widoczne na produkcji.
