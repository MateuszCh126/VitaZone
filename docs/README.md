# Dokumentacja VitaZone

Dokumentacja odróżnia stan widoczny w bieżącym kodzie od planu, hipotez badawczych i danych do potwierdzenia przez właściciela.

## Utrzymanie i rozwój

- [Stan techniczny i plan rozwoju](technical/current-state-and-roadmap.md) — architektura, przepływy, mapa modułów, baza danych, ryzyka, kolejność prac i kryteria odbioru.
- [Referencja kodu i architektury](technical/codebase-reference.md) — kontenery, przepływy, odpowiedzialności i katalog plików źródłowych.
- [Inwentarz skilli i narzędzi](technical/engineering-tooling-inventory.md) — możliwości sesji, wykorzystane workflowy oraz integracje nieadekwatne/niepotwierdzone.
- [ADR 0001 — workflow migracji PostgreSQL](adr/0001-postgresql-migration-governance.md) — propozycja jawnych, wersjonowanych migracji; decyzja pozostaje otwarta do sprawdzenia środowiska.
- [Szczegółowy plan techniczny](superpowers/plans/2026-11-14-vitazone-engineering-roadmap.md) — zależności, taski, pliki, testy i release gates.
- [Notatki robocze audytu](technical/working-notes.md) — dziennik tej iteracji, wyniki kontroli i otwarte zadania.
- [Audyt tras, treści i widoków](technical/route-audit.md) — przegląd wszystkich tras na lokalnych renderach desktop/mobile, twierdzeń w copy i stanów interfejsu.
- [Pogłębiony audyt sklepu i plan napraw](technical/storefront-deep-audit-and-plan.md) — route-by-route copy, wizualia, dostępność, zaufanie, owner/legal gates i priorytety wdrożenia.
- [Design system i handoff](design-system/vitazone.md) — tokeny, responsywność, interakcje i checklisty dostępności.
- [Zmiany zaufania i checkoutu](changes/vitazone-trust-checkout.md) — status i weryfikacja pierwszego etapu.
- [Zmiany warstwy wizualnej](changes/vitazone-visual-refresh.md) — status PR #2 oraz ograniczenia renderu i danych.
- [Audyt inżynierski i status](changes/vitazone-engineering-audit.md) — zakres, dowody weryfikacji i nadal niepotwierdzone obszary.

## Badania i warunki uruchomienia

- [Plan badań UX](research/vitazone-ux-research.md) — pytania badawcze i dwie ścieżki klienta.
- [Przegląd płatności i dostawy](research/vitazone-payments-shipping-readiness.md) — zależności operatorów i przewoźników.
- [Przegląd prawa polskiego](research/vitazone-polish-consumer-law-review.md) — lista zagadnień do sprawdzenia z prawnikiem i właścicielem, nie opinia prawna.

## Status źródeł

`DOCUMENTATION.md` zachowano jako materiał historyczny. Jego status „Production Ready” i część opisów architektury nie zostały potwierdzone w kodzie; nie należy go używać do wdrożeń ani podejmowania decyzji bez porównania z dokumentami powyżej.
