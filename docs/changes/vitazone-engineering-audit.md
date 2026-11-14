# VitaZone engineering audit and implementation plan

**Status:** Storefront audit and implementation are integrated through PR #2 squash commit `005f272` on `main`. The configurator implementation and its separate verification record are in [terrarium-configurator.md](terrarium-configurator.md). No deployment or production migration is authorized.
**Date:** 2026-11-14
**Branch / MR:** PR #2 merged to `main` on 2026-11-14; configurator changes and verification are recorded separately.
**Task:** project owner requested a fact-based technical description and detailed implementation roadmap, including modules/files, data architecture, every route and user-facing copy, visual quality, workflows/tools and research.

## Scope completed in this iteration

- Added [codebase reference](../technical/codebase-reference.md) with system context, containers/data flow, domain definitions, responsibilities for tracked app/config/test files, and source-level risks.
- Added [engineering/tool inventory](../technical/engineering-tooling-inventory.md) documenting the 149 local skill folders, relevant and non-relevant skill selection, session tools, GitHub/Vercel inspection boundaries, and project workflows.
- Added [implementation roadmap](../superpowers/plans/2026-11-14-vitazone-engineering-roadmap.md) with phased tasks, files, dependencies, tests, exit criteria, legal/product owner gates, and release criteria.
- Updated [documentation index](../README.md), [route audit](../technical/route-audit.md), [current-state report](../technical/current-state-and-roadmap.md), [working notes](../technical/working-notes.md), and legal-source verification date.
- Researched primary engineering documentation conventions (Diátaxis, C4, PostgreSQL) and official Polish legal sources (ELI and UOKiK); links and limits are retained in the relevant documents.

## Verification evidence

- `git status --short --branch` — correct branch is `codex/vitazone-visual-refresh`; preexisting local documentation edits were preserved.
- File-coverage script — 175 tracked app/config/asset files selected by extension; 0 missing from the code reference.
- Route comparison — 16 route entries in the route audit, matching 15 explicit routes plus wildcard route in `src/App.jsx`.
- Relative Markdown link check under `docs/` — 0 broken file links.
- `git diff --check` — passed; Git emitted only LF-to-CRLF conversion warnings for existing edited Markdown files.
- Added a scoped backend fix after discovering concrete risks: email HTML escaping/PII log reduction, chat role allowlist, and Furgonetka request timeout. Targeted tests: 4 files / 10 tests passed; `pnpm lint` passed without warnings.
- Reworked `/about` from repeated feature cards and duplicated checkout steps into a catalog index and one concise purchase path, using only existing catalog facts. Added one app-wide main landmark target and keyboard skip link; targeted E2E proved focus and activation.
- Earlier full verification snapshot (before resumed CTA/chat and documentation work): `pnpm exec vitest run` 20 files / 89 passed; `pnpm build` passed (Browserslist data warning says caniuse-lite is 11 months old); `pnpm lint` passed without warnings; `pnpm check:secrets` passed; Playwright 18/18. These historical counts do not substitute for the updated run below.
- Updated full verification after resumed changes: `pnpm exec vitest run` 20 files / 89 passed (after wrapping the ChatWidget test in `MemoryRouter`); `pnpm build` passed with the same Browserslist warning; `pnpm lint` passed when run alone after Playwright completed; `pnpm check:secrets` passed; Playwright 21/21 passed. E2E logs include ECONNREFUSED proxy messages for `/api/cart` and `/api/categories` before mock handlers, so E2E does not verify a live backend.
- Local visual review of `/about` at 1440×900 and 390×844 — no `pageerror`, body `scrollWidth` equals viewport; consent was pre-set to necessary-only in isolated test browsers. The global `overflow-x-hidden` caveat remains for broader overflow checks.
- Relative Markdown file links under `docs/` — 0 broken; route rows 16 match router; `git diff --check` passed with CRLF normalization warnings.
- No database, external provider account, production environment, or deployment was changed.

## Limits / remaining work

- The skill inventory is an enumeration/relevance review; it does not claim all 149 `SKILL.md` files were read or all skills executed. Only task-relevant workflows were applied.
- Tool count 494 is a session snapshot and may change; available tools are not evidence of connected service accounts or permission to use them.
- Live production rendering hit Vercel Security Checkpoint. Historical CLI deployment data does not identify the current source commit. No production UI, database, payment, carrier account, analytics or email behavior is verified.
- Visual review evidence is local, using fixture/demo data. It does not include screen reader, actual browser zoom at 200%, physical device, field CWV or customer study results.
- Customer interviews and owner/legal facts remain outstanding. All user-impact, marketing, product-compatibility and legal conclusions that depend on those facts remain hypotheses or release gates.
- Database migration and checkout recommendations have not been implemented by this documentation change; they must follow the detailed plan with disposable Postgres and provider test accounts only.
- At the first audit snapshot these changes belonged to the PR #2 feature branch and were not merged. The owner later authorized integration to `main` after the remaining review, tests, and conflict checks. Verify live GitHub state before claiming a merge; deployment remains outside scope.

## Resumed audit and integration gate (2026-11-14)

- Reviewed the animation-specific guidance and code inventory. The project uses Framer Motion and CSS; no GSAP dependency or multi-step animation requirement was found. Recommendation is to keep the existing eight hero particles (reduced-motion aware) and avoid adding GSAP or ambient cursor glow.
- Expanded the code reference to map 191 selected source/config candidates and distinguish code, mock-test evidence, and owner/environment-dependent unknowns. Expanded the route audit to 16 routes, with explicit limits for historic renders and mock-based observations.
- Updated skill/tool inventory with the five scanned skill roots, exact snapshot counts, and a clear distinction between skills fully read and workflows only inventoried.
- Corrected an FAQ answer that implied an unverified contact channel; added a regression assertion.
- PR #2 had no GitHub checks. After reconciling 19 conflicts with `main`, the branch passed the full local suite and merged to `main` via squash as `005f272be5d7e4d868490058f37848ef224d752c`.
- PR #3's independent review found code conflicts and an abandoned checkout retry edge case. Recovery and conflict fixes were verified and merged via squash commit `6713a14`; full evidence is in [terrarium-configurator.md](terrarium-configurator.md). The migration and live services remain untouched.
- Verification for PR #2 before its merge: `pnpm exec vitest run` — 26 files / 112 tests passed; `pnpm lint` passed; `pnpm build` passed with the existing 11-month-old Browserslist data warning; `pnpm check:secrets` passed; `$env:PLAYWRIGHT_PORT='4182'; pnpm test:e2e` — 21/21 passed on demo/mock data.

## Sources

- [Diátaxis](https://diataxis.fr/start-here/)
- [C4 model diagrams](https://c4model.com/diagrams)
- [PostgreSQL locking](https://www.postgresql.org/docs/16/explicit-locking.html) and [advisory locks](https://www.postgresql.org/docs/current/functions-admin.html)
- [ELI: Consumer Rights Act consolidated text, Dz.U. 2026 item 1244](https://eli.gov.pl/api/acts/DU/2026/1244/text/U/D20261244Lj.pdf)
- [UOKiK: distance sale information duties](https://prawakonsumenta.uokik.gov.pl/prawo-do-informacji/sprzedaz-poza-lokalem-i-na-odleglosc/)
