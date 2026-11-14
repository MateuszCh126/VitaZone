# VitaZone — inwentarz skilli, workflow i narzędzi

> Stan sprawdzony 2026-11-14 w lokalnym worktree i bieżącej sesji Codexa. Dostępność narzędzia nie jest równoznaczna z jego użyciem ani uprawnieniem do zmiany zewnętrznego systemu.

## Środowisko pracy i GitHub/Vercel

| Element | Stan potwierdzony | Granica dowodu |
|---|---|---|
| Repozytorium | `MateuszCh126/VitaZone`; aktywny branch `codex/vitazone-visual-refresh`; HEAD bazowy `1157d38`; PR #2 jest otwarty jako draft z `CLEAN` względem `codex/vitazone-trust-checkout` (2026-11-14) | Zmiany tej iteracji są lokalne, niecommitowane; brak merge do `main` i wdrożenia. |
| Lokalny Git | checkout w `C:\Users\gamin\.codex\worktrees\vitazone-visual-refresh\vitazone-audit-2026-11-13` | Gałąź ma lokalne zmiany frontendowe, testy i dokumentację; odróżniać je od HEAD PR. |
| GitHub CLI | `gh` dostępne; PR/status/workflow można odczytać | PR #2 nie miał zgłoszonych checków; Actions API zwróciło zero workflow. Nie jest to dowód, że build poza GitHubem nie istnieje. |
| Vercel CLI | dostępne, wersja 65.5.0, konto CLI uwierzytelnione | Projekt `vitazone` i historyczny deployment READY z 2026-05-29; alias `animalsshop.vercel.app`. `project inspect` nie ujawnił wiarygodnego mapowania repo/commitu; UI zatrzymał Security Checkpoint. Nie przypisujemy tego deploymentu aktualnemu PR. |
| Package manager | `packageManager: pnpm@10.33.0`; `pnpm-lock.yaml` i `package-lock.json` są śledzone | README kieruje na pnpm; przed CI utrwalić jeden lockfile i sprawdzić instalację hosta. |
| Lokalny runtime | poprzedni audyt uruchomił fixture/mock API i Vite/Playwright na portach lokalnych | Nie łączył się z produkcyjną bazą ani realnymi providerami. Poprzedni proces zakończono; przed nowym testem sprawdzić porty. |
| Produkcyjny browser | próba HTTP/browser napotkała Vercel Security Checkpoint | Brak dowodu obecnego layoutu produkcji i brak aktualnego field CWV. |

## Narzędzia dostępne w tej sesji

Aktualny spis narzędzi sesji wyliczył **498 narzędzi** (migawka 2026-11-14; poprzedni odczyt miał 494). Wśród nich **89 funkcji** należało do connectora GitHub. Nazwy i zakres są dynamiczne. Poniżej jest inwentarz podsystemów przydatnych do tego repo; nie należy traktować całej listy jako związanej z VitaZone.

| Narzędzie / rodzina | Możliwe użycie w projekcie | Użycie / ograniczenie |
|---|---|---|
| PowerShell przez `exec_command` | Git, pnpm, Vite, testy, inspekcja plików | Używane do lokalnego audytu. |
| `gh` / GitHub MCP (89 funkcji w migawce sesji) | Odczyt repo, PR, diff, issues, checks i workflows | Użyto read-only odczytów. Merge/komentarze/dispatch nie są częścią zadania. Liczba connectora zmienia się między sesjami. |
| Vercel CLI | Lista/inspekcja project/deployment | Użyte read-only; brak mapowania source commit. |
| Web search (`web__run`) | Dokumentacja i źródła prawne aktualne na datę | Użyto do źródeł pierwotnych: Diátaxis, C4, ELI i UOKiK. |
| MCP GitHub | Alternatywny odczyt repo/PR i workflow | Dostępny, ale CLI wystarczyło. |
| MCP Search Service | Wyszukiwanie internetu przez connected app | Dostępny; w tym audycie użyto bezpośrednio web tool. |
| MCP Supabase | Operacje Supabase | Nie używać: repo korzysta z `pg`; brak potwierdzonego połączenia projektu. Nie wykonywano query/reset/deploy. |
| MCP Codex app | Worktrees, status zadań/PR checks, pliki | Dostępne; kod repo edytowany lokalnie. |
| MCP Sites | Tworzenie/zmiana/hosting artefaktów Sites | Nieadekwatny do repozytorium React i nieużywany. |
| MCP node_repl | Izolowane wykonanie JavaScript | Dostępny, niepotrzebny wobec lokalnego Node/pnpm. |
| Browser/Playwright z repo | Test widoków lokalnych i flow | W tej iteracji `pnpm test:e2e` zakończył się wynikiem 21/21 na fixture/mockach. Brak dowodu działania produkcyjnych providerów. |
| Computer-use/CUA | Automatyzacja UI lokalnego Windows/browsera | Użyto do ręcznej kontroli homepage, FAQ i Kontakt na lokalnym renderze; nie zastępuje urządzenia fizycznego, czytnika ekranu ani pełnego audytu breakpointów. |
| Artifact Session | Edycja dokumentów arkuszy/prezentacji w kanwie | Narzędzie dostępne, lecz nie jest przeznaczone do wersjonowanych Markdown/źródeł repo; nieużyte. |
| MCP Figma | Projektowanie/inspekcja Figma | Connector nie był potwierdzony jako aktywny; Figma pojawiła się w katalogu zalecanych, nieinstalowanych pluginów. |
| MCP Stripe / przewoźnicy | Operacje kont/providerów | Brak potwierdzonego connectora; konta i umowy nie są skonfigurowane według odpowiedzi właściciela. Testy wyłącznie sandbox/mocks po uzyskaniu właściwego środowiska. |
| MCP Security | Analiza bezpieczeństwa | Dostępny zestaw 22 narzędzi, w tym skany/analiza; statyczne audyty w tej iteracji nie są pentestem. |
| Pozostałe MCP: Atlassian, Gmail, Linear, Pets, Wolfram, SciSpace, Roblox | Inne aplikacje/domeny | Nie mają związku z implementacją sklepu; nie użyto, nie wysyłano wiadomości. |
| Narzędzia bazowe: `apply_patch`, `view_image`, `clock`, zasoby MCP, cele | Zmiany plików, obrazy, czas, kontekst | Patch używany do dokumentacji; narzędzia resource nie wykazały dodatkowego źródła dla projektu. |

Podsystemy `codex_apps` obejmują dostępne connector-y GitHub, Atlassian, Gmail, Linear, Supabase, Sites, plugin management, safety settings, Wolfram, SciSpace, Pets, Hotline i dokumenty. Ilość funkcji MCP zmienia się pomiędzy sesjami; liczba 498 narzędzi i 89 funkcji GitHub to migawka, nie stałe SLA. Wcześniejsze robocze zdanie o 15 funkcjach GitHub było błędne.

## Inwentarz lokalnych skilli

W katalogu `C:\Users\gamin\.agents\skills` wykryto **149 katalogów skilli**. Ponadto katalog sesji zawiera superpowers, skills systemowe i pluginy. Lista nazw jest dostępna na dysku pod wskazaną ścieżką; dokładne wersje/instrukcje pozostają lokalne i mogą się zmieniać. To audyt przydatności i ścieżek, nie deklaracja przeczytania 149 niepowiązanych instrukcji.

Spis folderów znalezionych w tej konkretnej instalacji (alfabetyczny, wersje mogą się zmieniać):

```text
accessibility-review, agents-sdk, algorand-vulnerability-scanner, algorithmic-art, analytics, analytics-dashboard, animate, animate-expo, audit-prep-assistant, basin, build-awwwards-quality-sites, cairo-vulnerability-scanner, canvas-design, cf-cli, cloudflare, cloudflare-email-service, cloudflare-one, cloudflare-one-migrations, code-maturity-assessor, codebase-design, cold-email, content-matrix, content-strategy, copywriting, cosmos-vulnerability-scanner, cro, deploy-to-vercel, design-critique, design-handoff, design-system, design-taste-frontend, domain-modeling, durable-objects, emil-design-eng, figma, figma-implement-design, figma-use, find-skills, frontend-design, gateway-workers, gemini-carousel, gemini-infographic, gh-fix-ci, graphic-designer, guidelines-advisor, hf-cli, hook-generator, huggingface-community-evals, huggingface-datasets, huggingface-llm-trainer, huggingface-trackio, hyperframes-animation, impeccable, jupyter-notebook, k2, mcp-builder, modern-python, newsletter-voice, nextjs-on-cloudflare, niche-research, offers, pdf, pinned-comment, post-formatter, post-scorer, post-writer, profile-optimizer, prospecting, quote-post, reels-scripting, remotion-best-practices, research-synthesis, sales-enablement, sandbox-migrate-to-next, sandbox-next, sandbox-stable, schema, secure-workflow-guide, security-best-practices, seo, seo-agentic, seo-audit, seo-backlinks, seo-cluster, seo-competitor-pages, seo-content, seo-content-brief, seo-dataforseo, seo-drift, seo-ecommerce, seo-flow, seo-geo, seo-google, seo-hreflang, seo-image-gen, seo-images, seo-local, seo-maps, seo-page, seo-plan, seo-programmatic, seo-schema, seo-sitemap, seo-sxo, seo-technical, shadcn, solana-vulnerability-scanner, substrate-vulnerability-scanner, tailwind-design-system, theme-factory, threejs-asset-pipeline, threejs-interaction, threejs-loaders, threejs-performance, threejs-react-three-fiber, token-integration-analyzer, ton-vulnerability-scanner, trigger-realtime, trigger-setup, trigger-tasks, turnstile-spin, ui-ux-pro-max, user-research, ux-copy, vercel-react-best-practices, vercel-react-view-transitions, voice-builder, web-artifacts-builder, web-design-engineer, web-design-guidelines, web-perf, webapp-testing, workers-best-practices, workers-profiling, wp-block-development, wp-block-themes, wrangler, youtube-thumbnail, yt-audit, yt-chapters, yt-comment, yt-edit, yt-package, yt-plan, yt-retention, yt-script, yt-seo, yt-shorts, yt-viral
```

### Zastosowane i właściwe dla VitaZone

| Skill/workflow | Zastosowanie w tym zadaniu |
|---|---|
| `superpowers:using-superpowers` | Ustala wymagane workflow i kontrolę kolejnych skilli. |
| `superpowers:writing-plans` | Rozpisanie małych, zależnych, weryfikowalnych zadań. |
| `superpowers:executing-plans` | Wykonanie planu w branchu i aktualizacja statusu. |
| `superpowers:dispatching-parallel-agents` | Uzgodnienie rozłącznych audytów, kryteriów i przeglądu orkiestratora. |
| `superpowers:subagent-driven-development` | Delegowane, read-only audyty kodu; agenci nie edytowali wspólnych plików. |
| `superpowers:test-driven-development` | Używany jako workflow dla ewentualnych poprawek: test opisuje kontrakt przed implementacją. |
| `superpowers:verification-before-completion` | Wyniki poleceń i ograniczenia muszą pochodzić z aktualnego drzewa. |
| `superpowers:requesting-code-review` | Własny review diffów i agentowe read-only przeglądy. |
| `codebase-design` | Głębokie moduły, seam/interface/adapters, testowalność i lokalność zmian. |
| `domain-modeling` | Precyzyjne znaczenie Product, Cart, Order, payment, User, consent; dokumentować decyzje. |
| `user-research` + `research-synthesis` | Dwie grupy zakupowe i jakościowa synteza; realne wnioski wymagają danych klientów. |
| `design-critique`, `frontend-design`, `design-taste-frontend` | Ocena hierarchii/copy i ograniczania „AI slop”; prawdziwe assety i krytyka renderu. |
| `design-system`, `design-handoff`, `tailwind-design-system` | Tokeny, warianty, stan komponentów i handoff; skill Tailwind celuje w v4, repo pozostaje v3.4. |
| `accessibility-review` | WCAG, semantyka, klawiatura, fokus, zoom i czytnik ekranu; część kontroli nadal do wykonania. |
| `ux-copy`, `copywriting` | Teksty opisujące następny skutek, błędy i fakty oferty bez presji i niepotwierdzonych twierdzeń. |
| `vercel-react-best-practices` | Bundle, lazy routes, waterfalls, rerender i ładowanie integracji. |
| `webapp-testing` | Playwright i obserwacja UI z rzeczywistego DOM; zgodnie ze skill wymaga uruchomienia `with_server.py --help`, jeśli helper ma być użyty. |
| `web-perf` | Plan trace, network, accessibility snapshot; runtime/field pomiary niedostępne w aktualnym produkcyjnym renderze. |
| `seo-ecommerce`, `seo-technical`, `seo-schema`, `seo-sitemap` | Widoczna oferta, crawl, canonicale, schema, dynamiczny sitemap. |
| `security-best-practices` | Front/backend security references, input validation, XSS, CSRF, role, webhook i timeout. |
| `schema` | Zgodność danych strukturalnych z treścią widoczną. |
| `cro` | Tylko jako metodologia z miernikami jakości zakupów; brak optymalizacji „konwersji za wszelką cenę”. |
| `design-handoff` | Specyfikacja breakpointów, wszystkich stanów i klawiatury. |

### Dostępne, ale nieuruchamiane jako nieadekwatne

Nie wykonano ani nie wczytywano workflowów dla tematów: WordPress/Gutenberg (`wp-block-*`), Remotion/wideo (`remotion-best-practices`, `hyperframes-animation`), Roblox, Hugging Face/ML/datasetów, Solana/Algorand/Cairo/Cosmos/Substrate/TON vulnerability scanners, Cloudflare Workers/DO/Basin/K2, prezentacje/PDF, grafika social, YouTube, outreach/sprzedaż, spreadsheets, trading i Pets. Nie dotyczą aplikacji React/Vite, jej bazy ani zamówionego audytu. Nie wolno pozornie stosować ich wytycznych do sklepu.

Inne potencjalnie warunkowe skille (analytics, SEO research, Figma, image generation, security deep scan, supabase, wrangler) uruchamiać tylko, gdy zakres/connector/sources to uzasadnią. Nie włączono Supabase tylko dlatego, że narzędzie jest dostępne — repo używa PostgreSQL `pg`.

## Workflow repozytorium — stan i brakujące bramki

| Przepływ | Obecny skrypt / evidence | Docelowe usprawnienie |
|---|---|---|
| Instalacja | `pnpm install`, packageManager przypięty | Pozostawić jeden lockfile i `pnpm install --frozen-lockfile` w CI. |
| Lokalny frontend/API | `pnpm dev`; Vite + Express | Jasno oddzielić fixture od konfiguracji realnego `.env`. |
| Unit/integration | `pnpm exec vitest run`; `pnpm test` uruchamia watch | Utrzymać stabilne polecenie CI i coverage dla ryzykownych domen. |
| E2E | `pnpm test:e2e`, Playwright fixture | Dodać scenariusze błędów płatności/cookies/klawiatury; nie podłączać live providerów. |
| Jakość | `pnpm lint`, `pnpm build`, `pnpm check:secrets` | Obowiązkowe PR checks i artefakty z sanitizacją. |
| DB | `pnpm migrate`, seed, sync | Legacy reset blokowany; nowy append-only migrator + fresh/upgrade fixture przed wdrożeniem. |
| Vercel | CLI i historyczny deployment | Zmapować repo, branch i commit z project settings; preview environment i health checks. |
| Release | Brak automatycznych Actions checks | CI na PR; deployment dalej osobnym, jawnie zatwierdzanym krokiem. |

Na branchu dodano regression tests dla escapowania HTML e-maili, odrzucania klientowskiej roli `system` i timeoutu Furgonetki. Nie są to testy integracyjne z prawdziwym Resend, Gemini ani Furgonetką.

## Źródła i jakość odniesień

- [Diátaxis — start here](https://diataxis.fr/start-here/): dokumentacja rozdziela tutorial, how-to, reference i explanation.
- [C4 model — diagrams](https://c4model.com/diagrams): używać poziomów, które wspierają onboarding i decyzje; nie rysować wszystkiego automatycznie.
- [PostgreSQL explicit locking](https://www.postgresql.org/docs/16/explicit-locking.html) oraz [advisory locks](https://www.postgresql.org/docs/current/functions-admin.html): materiał dla migratora i operacji konkurencyjnych.
- [ELI: tekst ustawy o prawach konsumenta, Dz.U. 2026 poz. 1244](https://eli.gov.pl/api/acts/DU/2026/1244/text/U/D20261244Lj.pdf) — status obowiązujący wskazany w ELI; ostatni przegląd 2026-11-14.
- [UOKiK: sprzedaż na odległość](https://prawakonsumenta.uokik.gov.pl/prawo-do-informacji/sprzedaz-poza-lokalem-i-na-odleglosc/) — obowiązek informacji, łączny koszt, dostawa i koszty dodatkowe.

Prawne źródła są checklistą do omówienia z prawnikiem dla rzeczywistego asortymentu/firmy. Ten dokument nie stanowi opinii prawnej. Aktualność prawa sprawdzić ponownie w dniu publikacji sklepu.
