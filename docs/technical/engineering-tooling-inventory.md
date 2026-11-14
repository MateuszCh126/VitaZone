# VitaZone — inwentarz skilli, workflow i narzędzi

> Audyt wykonany 2026-11-14 w checkoutcie `C:\Users\gamin\.codex\worktrees\vitazone-visual-refresh\vitazone-audit-2026-11-13`, branch `codex/vitazone-visual-refresh`, HEAD `e33917d38ec54813f3b58f8d0dcdf701d44dd89f` (`feat: refine storefront experience after audit`). To migawka tego commita; nie przypisuje mu późniejszych, niecommittowanych zmian. Dostępność narzędzia lub skilla nie dowodzi użycia, zalogowania ani uprawnienia do zewnętrznej operacji.

## Środowisko pracy i GitHub/Vercel

| Element | Stan potwierdzony | Granica dowodu |
|---|---|---|
| Repozytorium | `MateuszCh126/VitaZone`; branch i PR #2: `codex/vitazone-visual-refresh`; HEAD `e33917d38ec54813f3b58f8d0dcdf701d44dd89f`. PR otwarty jako draft, baza `codex/vitazone-trust-checkout`, stan GitHub `CLEAN`; odczyt `gh` 2026-11-14 | Lokalny HEAD odpowiadał HEAD PR w chwili odczytu. Brak merge/deploy potwierdzonego tym odczytem. Późniejsze zmiany worktree nie należą do tego snapshotu. |
| Lokalny Git | checkout w `C:\Users\gamin\.codex\worktrees\vitazone-visual-refresh\vitazone-audit-2026-11-13`; HEAD `e33917d` | Na początku audytu worktree było czyste. W trakcie pracy pojawiły się niezależne edycje poza tym plikiem; nie należą do opisanego commita ani tego inventory. |
| GitHub CLI | `gh` dostępne; `gh pr view 2` potwierdziło draft/open/CLEAN i 0 checks. `gh workflow list --all` nie zwróciło workflow; w HEAD brak `.github/workflows/`. | Brak workflow CI w tej gałęzi nie wyklucza zewnętrznej automatyzacji. Odczyt PR nie zmieniał GitHuba. |
| Vercel CLI | Poprzedni raport gałęzi zanotował wersję 65.5.0 i uwierzytelnione konto CLI; nie weryfikowano ponownie w tej iteracji | Historyczny raport wskazywał deployment READY z 2026-05-29 i alias `animalsshop.vercel.app`; aktualnego deployu ani mapowania źródłowego nie sprawdzano. Nie przypisywać starego deploymentu obecnemu PR. |
| Package manager | `packageManager: pnpm@10.33.0`; `pnpm-lock.yaml` i `package-lock.json` są śledzone | README kieruje na pnpm; przed CI utrwalić jeden lockfile i sprawdzić instalację hosta. |
| Lokalny runtime | Poprzednie raporty gałęzi opisują lokalny fixture/mock API i Vite/Playwright | Nie weryfikowano ich działania ponownie podczas aktualizacji inventory; to nie było połączenie do produkcyjnej bazy ani realnych providerów. |
| Produkcyjny browser / Vercel | Poprzedni raport zapisał historyczny Security Checkpoint i deployment z 2026-05-29 | Nie odświeżano stanu hostingu ani produkcyjnego layoutu w tym audycie; te informacje nie są aktualnym potwierdzeniem wdrożenia. |

## Narzędzia dostępne w tej sesji

Migawka `ALL_TOOLS` z 2026-11-14 wyliczyła **498 definicji narzędzi**. Z tego 89 to funkcje GitHub; inne większe rodziny MCP: 91 Linear, 36 Supabase, 26 Atlassian, 25 Sites, 22 Codex Security, 21 Gmail, 50 Roblox Studio, 36 Roblox Studio legacy, 47 Codex app, 3 Artifact Session i 3 Node REPL. Bezpośrednie namespaces, m.in. CUA i collaboration, nie wchodzą do tej sumy. Liczby odnoszą się do jednej sesji, zmieniają się i nie oznaczają aktywnego logowania, dostępu do projektu ani użycia. Poniżej są rodziny istotne dla VitaZone, nie katalog wszystkich nazw.

| Narzędzie / rodzina | Możliwe użycie w projekcie | Użycie / ograniczenie |
|---|---|---|
| PowerShell przez `exec_command` | Git, pnpm, Vite, testy, inspekcja plików | Używane do lokalnego audytu. |
| `gh` / GitHub MCP (89 funkcji w migawce) | Odczyt repo, PR, diff, issues, checks i workflows | W tym audycie użyto wyłącznie `gh` read-only do PR/workflow. GitHub MCP był dostępny, ale nieużyty. Merge/komentarze/dispatch nie były wykonywane. |
| Vercel CLI | Lista/inspekcja project/deployment | Użyte read-only; brak mapowania source commit. |
| Web search (`web__run`) i Search Service MCP | Internet i dokumentacja | Dostępne; nieużyte w bieżącym tooling/animation review. Źródła zapisane wcześniej w repo nie dowodzą użycia tych narzędzi w tej iteracji. |
| MCP GitHub | Alternatywny odczyt repo/PR i workflow | Dostępny, ale CLI wystarczyło. |
| MCP Search Service | Wyszukiwanie internetu przez connected app | Dostępny; nieużyty w tym audycie. |
| MCP Supabase (36 funkcji) | Projekty Supabase, schemat i SQL | Dostępny, ale nieadekwatny: kod używa `pg` i PostgreSQL/Express; nie potwierdzono aktywnego projektu Supabase. Nie wykonano query/migracji/resetu/deployu. |
| MCP Codex app (47 funkcji) | Worktrees, status zadań/PR checks, pliki | Dostępny; nieużyty. Repo edytowano lokalnie. |
| MCP Sites (25 funkcji) | Usługa Codex Sites, D1, deploy | Nie jest hostingiem tego repo w Vercel; nieużyty. |
| MCP Node REPL / Artifact Session | JavaScript w trwałej sesji / edycja canvasów | Dostępne, nieużyte; lokalny Node i wersjonowany plik Markdown wystarczyły. |
| Browser/Playwright z repo | Test widoków lokalnych i flow | Repo ma Playwright/E2E. Poprzedni raport gałęzi zapisał 21/21 na fixture/mockach, ale tego wyniku nie odtworzono na HEAD `e33917d` w tym audycie. Brak dowodu działania produkcyjnych providerów. |
| Computer-use/CUA | Automatyzacja UI lokalnego Windows/browsera | Dostępny jako osobny namespace, ale nie jest wliczony do migawki `ALL_TOOLS`. Poprzedni raport gałęzi odnotował ręczną kontrolę homepage, FAQ i Kontakt; aktualnie nieużyty. Nie zastępuje urządzenia fizycznego, czytnika ekranu ani pełnego audytu breakpointów. |
| Artifact Session | Edycja dokumentów arkuszy/prezentacji w kanwie | Narzędzie dostępne, lecz nie jest przeznaczone do wersjonowanych Markdown/źródeł repo; nieużyte. |
| MCP Figma | Projektowanie/inspekcja Figma | Brak rodziny Figma w bieżącym `ALL_TOOLS`; dostępność skilla `figma` nie oznacza connectora. |
| MCP Stripe / przewoźnicy | Operacje kont/providerów | Brak potwierdzonego connectora; konta i umowy nie są skonfigurowane według odpowiedzi właściciela. Testy wyłącznie sandbox/mocks po uzyskaniu właściwego środowiska. |
| MCP Codex Security (22 funkcje) | Skany i analiza bezpieczeństwa | Dostępne; nieuruchomione. Nie są dowodem pentestu ani częścią tego inventory review. |
| Pozostałe MCP: Atlassian, Gmail, Linear, Pets, Wolfram, SciSpace, Roblox | Inne aplikacje/domeny | Nie mają związku z implementacją sklepu; nie użyto, nie wysyłano wiadomości. |
| Narzędzia bazowe: `apply_patch`, `exec_command`, `view_image`, `clock`, zasoby MCP, cele | Zmiany plików, inspekcja lokalna, obrazy, czas, kontekst | Użyto PowerShell/`exec_command`, `ALL_TOOLS` i `apply_patch` tylko do dokumentu. `view_image`, clock, cele i MCP resources nieużyte. |

Podsystemy `codex_apps` obejmują GitHub (89), Atlassian (26), Gmail (21), Linear (91), Supabase (36), Sites (25), plugin management (6), safety settings (5), Wolfram (3), SciSpace (6), Pets (11), Hotline (1), Search Service (1) i Codex Document Control (3). To bieżąca migawka nazw z `ALL_TOOLS`, nie potwierdzenie konfiguracji czy autoryzacji każdego connectora.

## Inwentarz lokalnych skilli

Skan rootów na Windows: `C:\Users\gamin\.agents\skills`, `C:\Users\gamin\.codex\skills\.system`, `C:\Users\gamin\.codex\plugins\cache\openai-bundled`, `...\openai-curated-remote` i `...\openai-primary-runtime`. Wykryto **149/149** katalogów globalnych ze `SKILL.md`; ponadto 5 systemowych, 2 bundled, 67 z cache curated-remote i 6 primary-runtime. Razem: **229 plików `SKILL.md` w 227 nazwanych katalogach** (nazwy `pdf` i `visualize` występują po dwa razy). Pliki cache nie są równoznaczne z aktywnymi skillami bieżącego promptu. Wczytano pełne instrukcje czterech wskazanych poniżej skilli motion/UI; pozostałe 225 plików nie były wczytywane jako część tego audytu.

Spis folderów znalezionych w tej konkretnej instalacji (alfabetyczny, wersje mogą się zmieniać):

```text
accessibility-review, agents-sdk, algorand-vulnerability-scanner, algorithmic-art, analytics, analytics-dashboard, animate, animate-expo, audit-prep-assistant, basin, build-awwwards-quality-sites, cairo-vulnerability-scanner, canvas-design, cf-cli, cloudflare, cloudflare-email-service, cloudflare-one, cloudflare-one-migrations, code-maturity-assessor, codebase-design, cold-email, content-matrix, content-strategy, copywriting, cosmos-vulnerability-scanner, cro, deploy-to-vercel, design-critique, design-handoff, design-system, design-taste-frontend, domain-modeling, durable-objects, emil-design-eng, figma, figma-implement-design, figma-use, find-skills, frontend-design, gateway-workers, gemini-carousel, gemini-infographic, gh-fix-ci, graphic-designer, guidelines-advisor, hf-cli, hook-generator, huggingface-community-evals, huggingface-datasets, huggingface-llm-trainer, huggingface-trackio, hyperframes-animation, impeccable, jupyter-notebook, k2, mcp-builder, modern-python, newsletter-voice, nextjs-on-cloudflare, niche-research, offers, pdf, pinned-comment, post-formatter, post-scorer, post-writer, profile-optimizer, prospecting, quote-post, reels-scripting, remotion-best-practices, research-synthesis, sales-enablement, sandbox-migrate-to-next, sandbox-next, sandbox-stable, schema, secure-workflow-guide, security-best-practices, seo, seo-agentic, seo-audit, seo-backlinks, seo-cluster, seo-competitor-pages, seo-content, seo-content-brief, seo-dataforseo, seo-drift, seo-ecommerce, seo-flow, seo-geo, seo-google, seo-hreflang, seo-image-gen, seo-images, seo-local, seo-maps, seo-page, seo-plan, seo-programmatic, seo-schema, seo-sitemap, seo-sxo, seo-technical, shadcn, solana-vulnerability-scanner, substrate-vulnerability-scanner, tailwind-design-system, theme-factory, threejs-asset-pipeline, threejs-interaction, threejs-loaders, threejs-performance, threejs-react-three-fiber, token-integration-analyzer, ton-vulnerability-scanner, trigger-realtime, trigger-setup, trigger-tasks, turnstile-spin, ui-ux-pro-max, user-research, ux-copy, vercel-react-best-practices, vercel-react-view-transitions, voice-builder, web-artifacts-builder, web-design-engineer, web-design-guidelines, web-perf, webapp-testing, workers-best-practices, workers-profiling, wp-block-development, wp-block-themes, wrangler, youtube-thumbnail, yt-audit, yt-chapters, yt-comment, yt-edit, yt-package, yt-plan, yt-retention, yt-script, yt-seo, yt-shorts, yt-viral
```

### Przydatność i dowód użycia

Poniższe statusy odnoszą się do aktualizacji inventory na HEAD `e33917d`, a nie do retrospektywnego przypisywania skilli wcześniejszym commitom. Artefakty w kodzie/testach potwierdzają ich zawartość, nie to, że autor wczytał konkretną instrukcję lub wykonał wszystkie kroki skillu.

| Skill/workflow | Zastosowanie w tym zadaniu |
|---|---|
| `animate`, `emil-design-eng`, `design-taste-frontend`, `impeccable` | **Zastosowano jako źródła audytowe**: przeczytano pełne instrukcje i sprawdzono Motion/CSS/reduced motion w zależnościach i kodzie. Nie wykonano redesignu ani nie dodano animacji. |
| `verification-before-completion` | **Skatalogowano; instrukcji nie wczytywano**. Weryfikację wymagają zasady repo; nie należy wnioskować z tego o aktywacji skillu w tej lub poprzednich pracach. |
| `superpowers:using-superpowers`, `writing-plans`, `executing-plans`, `dispatching-parallel-agents`, `subagent-driven-development`, `test-driven-development`, `requesting-code-review` | **Skatalogowano jako dostępne**. Nie oznacza, że workflow tych instrukcji wykonano w tej iteracji inventory. |
| `codebase-design`, `domain-modeling` | Przydatne dla domeny sklepu i granic Express/PostgreSQL; **skatalogowane**, nieużyte w tym audycie narzędzi. |
| `design-critique`, `frontend-design`, `design-taste-frontend`, `impeccable`, `design-system`, `tailwind-design-system`, `design-handoff` | Relewantne dla React/Tailwind UI; zastosowano wyłącznie cztery wskazane instrukcje jako materiał do rekomendacji motion. Nie wykonano pełnego critique/handoff/build. Tailwind skill celuje w v4, repo ma v3.4. |
| `accessibility-review`, `ux-copy`, `copywriting` | Relewantne, **skatalogowane**; ten inventory nie jest pełnym audytem WCAG ani copy. |
| `vercel-react-best-practices`, `webapp-testing`, `web-perf` | Przydatne dla React runtime, Playwright i wydajności; **skatalogowane**, ich workflow nie uruchomiono w tej pracy. |
| `seo-ecommerce`, `seo-technical`, `seo-schema`, `seo-sitemap`, `schema` | Przydatne warunkowo dla sklepu; **skatalogowane**, bez bieżącego crawl/SEO review. |
| `security-best-practices`, `cro`, `user-research`, `research-synthesis` | Przydatne warunkowo; **skatalogowane**, brak pentestu, badań klientów i danych konwersji w tej pracy. |

### Workflowy faktycznie użyte w tej iteracji

- Lokalnie: Git `status`/branch/HEAD/log, PowerShell `Get-ChildItem`/`Select-String`, `rg`, odczyt `package.json`/lockfile i kodu animacji.
- Skill review: pełna lektura `animate/SKILL.md`, `emil-design-eng/SKILL.md`, `design-taste-frontend/SKILL.md`, `impeccable/SKILL.md`; użyte jako źródła rekomendacji, bez uruchamiania ich implementacyjnych bramek.
- Sesja: `ALL_TOOLS`; `gh pr view 2` i `gh workflow list --all` wyłącznie read-only; edycja ograniczona do tego inventory.
- Nie uruchamiano testów/lint/build, pnpm, browser/CUA, skanów bezpieczeństwa, SQL/migracji, deployu ani zewnętrznych zapisów. Nie przedstawiać ich jako wykonanych w tej iteracji.

### Dostępne, ale nieuruchamiane jako nieadekwatne

Nie wykonano ani nie wczytywano workflowów dla tematów: WordPress/Gutenberg (`wp-block-*`), Remotion/wideo (`remotion-best-practices`, `hyperframes-animation`), Roblox, Hugging Face/ML/datasetów, Solana/Algorand/Cairo/Cosmos/Substrate/TON vulnerability scanners, Cloudflare Workers/DO/Basin/K2, prezentacje/PDF, grafika social, YouTube, outreach/sprzedaż, spreadsheets, trading i Pets. Nie dotyczą aplikacji React/Vite, jej bazy ani zamówionego audytu. Nie wolno pozornie stosować ich wytycznych do sklepu.

Inne potencjalnie warunkowe skille (analytics, SEO research, Figma, image generation, security deep scan, supabase, wrangler) uruchamiać tylko, gdy zakres/connector/sources to uzasadnią. Nie włączono Supabase tylko dlatego, że narzędzie jest dostępne — repo używa PostgreSQL `pg`.

## Animacja w repo i ocena GSAP

`package.json`, `package-lock.json` i `pnpm-lock.yaml` zawierają `framer-motion` **12.23.26**; `gsap` nie występuje w żadnym z tych trzech plików. W źródłach są animacje przez `motion`/`AnimatePresence` (m.in. `CartDrawer`, `ChatWidget`, `CookieBanner` i kilka tras), `MotionConfig reducedMotion="user"` w `App.jsx`, a także CSS transitions/keyframes. `src/index.css` redukuje globalne CSS animations/transitions i smooth scrolling dla `prefers-reduced-motion: reduce`; homepage ma osiem particle dots w `src/pages/Home.css`, animowanych `transform`/`opacity` tylko w hero i wyłączanych przez media query. `CartDrawer` i `ChatWidget` dodatkowo czytają `useReducedMotion`. To statyczny odczyt źródeł, bez runtime/profile pomiarów.

**Wniosek:** delikatny GSAP nie ma uzasadnienia dla subtelnego hero ani mikrointerakcji. Repo ma już Motion dla wejść/wyjść/sprężyn i CSS dla prostych particles. Druga biblioteka doda koszt i ścieżkę utrzymania bez wykazanej potrzeby. Preferować istniejący CSS dla małego przewidywalnego ruchu, Motion dla obecnych interakcji/wyjść. GSAP rozważać dopiero przy konkretnym wieloetapowym timeline, którego obecny stack nie obsłuży prościej, i wtedy osobno uzasadnić bundle/perf.

Guardrails: animować `transform`/`opacity`, nie layout; zachować particles rzadkie i wyłącznie w hero; nie trzymać stale `will-change` bez pomiaru (obecny CSS particle ustawia je ciągle); hover ruchu ograniczać do `(hover: hover) and (pointer: fine)`; w `prefers-reduced-motion` zatrzymywać dekorację i usuwać translację, pozostawiając czytelny stan; warianty Motion powinny respektować `useReducedMotion`/globalne `MotionConfig`. Bez scroll-jackingu/parallax i ruchu na checkout/danych, które użytkownik czyta lub zmienia. Dopasowywać particles w `src/pages/Home.css`, globalny CSS fallback w `src/index.css`, a drawer/chat tylko w ich komponentach przy zmianie interakcji. Sprawdzać render z reduced-motion i na słabszym urządzeniu oraz mierzyć wydajność; tego nie zrobiono w tej iteracji.

## Metoda, pewność i ograniczenia

Wysoka pewność dla HEAD/branch, PR w chwili odczytu, liczby `SKILL.md` w pięciu wskazanych rootach, migawki `ALL_TOOLS`, zależności i fragmentów implementacji: bezpośrednie odczyty 2026-11-14. Średnia pewność dla dopasowania skilli do projektu: ocena opisów i czterech pełnych instrukcji przeczytanych w tym zadaniu. Nie zweryfikowano auth tooli poza udanym read-only `gh`, aktualnego deploymentu Vercel, runtime animacji, urządzeń ani integracji providerów. Spis umiejętności obejmuje tylko wymienione rooty, nie cały dysk.

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
