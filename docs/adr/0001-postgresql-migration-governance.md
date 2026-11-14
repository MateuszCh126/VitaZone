# ADR 0001: Jawny, wersjonowany workflow migracji PostgreSQL

- **Status:** Proposed — do akceptacji po potwierdzeniu środowiska, schematu i wymagań wdrożeniowych.
- **Data:** 2026-11-14
- **Zakres:** ewolucja schematu PostgreSQL i uruchamianie migracji.

## Kontekst

Repozytorium ma co najmniej dwa historyczne pliki schematu, SQL migracje, kilka wrapperów JavaScript oraz skrypt `server/scripts/run-migrations.js`, który odkrywa pliki na podstawie prefiksu nazwy. Wzorce obejmują również stare skrypty migracyjne. Część błędów wrapperów może zakończyć proces kodem 0; ledger zapisuje głównie nazwę pliku, bez checksumy/serializacji runnerów. Część SQL (001–002) nie jest objęta aktywnym wrapperem.

Statyczne porównanie wskazuje także różnicę między kolumnami oczekiwanymi przez runtime a `schema.sql`. Nie ustalono, która wersja schematu działa na zewnętrznym środowisku. Nie łączono się z żadną bazą i nie uruchamiano migracji.

## Proponowana decyzja

1. Nie uruchamiać migracji przez automatyczne wyszukiwanie plików po nazwie. Każda migracja musi figurować w jawnej, uporządkowanej liście albo być odkrywana wyłącznie przez ustalony, wersjonowany format.
2. Traktować schemat jako append-only historię zmian; stare skrypty/reset zostawić wyłącznie jako odizolowane narzędzia lokalne, z blokadą przeciw środowiskom współdzielonym i produkcyjnym.
3. Ledger powinien zapisywać stabilny identyfikator, wersję/checksumę i czas; runner musi blokować równoległe wykonanie, weryfikować kolejność/checksumę i zwracać niezerowy kod przy każdym błędzie.
4. Przed migratorem wykonać tabelaryczny diff schematów, migracji i SQL używanego przez runtime oraz uzgodnić kanoniczny kontrakt. Bez tego nie zakładać, że reset `schema.sql` jest bezpieczną bazą.
5. Przetestować instalację na pustej, disposable bazie oraz upgrade syntetycznej reprezentatywnej wersji, błąd częściowy, ponowienie, checksum drift i dwa równoległe runnery. DDL i wpis ledgera powinny być atomowe, gdy PostgreSQL i rodzaj operacji na to pozwalają; operacje nieatomowe wymagają jawnej procedury naprawy.
6. Dopiero po porównaniu Node/PostgreSQL hosta, istniejącego deploymentu i ergonomii zespołu wybrać bibliotekę. `node-pg-migrate` jest kandydatem do oceny, nie zatwierdzoną zależnością: dokumentuje PostgreSQL, advisory lock i kontrolę transakcji, ale wersję należy dobrać do faktycznego Node/PG runtime.

## Rozważane opcje

| Opcja | Ocena |
|---|---|
| Zachować obecny prefix-based runner | Odrzucona jako docelowy model: za szerokie odkrywanie, niejednolite kody błędów i ledger bez wystarczającej identyfikacji treści. |
| Napisać własny runner i ledger | Możliwe, ale zespół sam utrzymuje lockowanie, transakcje, checksumy, rollback i obsługę awarii. Wymaga uzasadnienia, jeśli sprawdzona biblioteka spełni warunki. |
| Przyjąć istniejącą bibliotekę migracyjną | Preferowany kierunek po spike'u zgodności; konkretna biblioteka i wersja pozostają do decyzji. |

## Konsekwencje

- Przed wdrożeniem zmian schematu powstanie jawny spis tabel/kolumn/constraintów z runtime matrix i plan zgodności starej bazy.
- Testy integracyjne będą wymagać disposable PostgreSQL (np. CI service/container); dotąd wykonywane testy nie sprawdzały prawdziwego silnika.
- Legacy reset będzie wymagał osobnej intencji i nigdy nie zastąpi migracji na współdzielonej bazie.
- Każda operacja migracyjna musi mieć backup/restore runbook i weryfikację odtworzenia przed release.

## Warunki akceptacji ADR

- Potwierdzony Node/PostgreSQL oraz sposób podłączenia aplikacji w hostingu.
- Uzgodniona kanoniczna wersja schematu i bezpieczny plan upgrade.
- Spike biblioteki na disposable PostgreSQL: fresh, upgrade, failure, retry, checksum i concurrency.
- Właściciel bazy akceptuje strategię backupu, okno i rollback/forward-fix.

## Źródła

- [PostgreSQL: explicit locking](https://www.postgresql.org/docs/16/explicit-locking.html)
- [PostgreSQL: advisory lock functions](https://www.postgresql.org/docs/current/functions-admin.html)
- [node-pg-migrate](https://github.com/salsita/node-pg-migrate) — kandydat do oceny; brak decyzji o instalacji.
