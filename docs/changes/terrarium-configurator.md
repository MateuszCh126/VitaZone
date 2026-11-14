# Terrarium configurator implementation

- Status: implemented locally on `codex/terrarium-configurator-3d`; review and merge remain pending.
- Scope: lazy 3D builder, SKU metadata contract, project submission/review, quote acceptance and Stripe checkout integration.
- Data: no live inventory or GLB models were supplied. The local development catalog is clearly marked demo-only and cannot be submitted. Production displays an empty catalog state until real SKUs are configured.
- Database: additive migration `server/scripts/migrations/006_create_terrarium_projects.sql`; not applied. Apply using `pnpm migrate:terrarium` only in the intended environment after review.
- Pricing: initial estimate is server-calculated from current SKU data; final offer stores a per-SKU price snapshot and is charged through Stripe. Delivery remains a separate configured line; labor is not included.

## Verification

- `pnpm test --run`: 48 unit and controller/middleware integration tests passed. Vitest selects unit/integration suites explicitly so it does not execute Playwright E2E specs. SKU dimensions are revalidated server-side, and estimates/quotes/order totals reject values outside PostgreSQL `INTEGER` cents.
- `pnpm build`: passed. Three.js remains in the lazy `TerrariumScene` chunk and is absent from the entry HTML's module preloads; its 1,066.54 KB chunk (287.90 KB gzip) is fetched only on the configurator route. Vite still warns about the size; profile on target devices with calibrated models.
- `pnpm exec playwright test --config playwright.terrarium.config.js`: 3 browser scenarios passed: demo safety, full mocked customer/admin/quote/Stripe flow, and mobile touch/keyboard with WebGL disabled and unavailable model asset.
- `pnpm exec playwright test --config playwright.terrarium-production.config.js`: 1 production-preview scenario passed: storefront does not load the 3D scene chunk and an empty SKU catalog shows no demo products.
- Read-only GPT-6 Luna reviews found and helped close the race between a paid webhook and attaching its order to a project; checkout now reconciles the order after attachment. Delayed payment success and failure events are handled explicitly. Reviews also found a malformed-SKU metadata trust gap and possible PostgreSQL integer overflow; both are guarded and covered by regression tests.
- The controller/middleware integration tests use mocked repositories and Stripe. Actual SQL execution, migration application, Stripe API/webhooks and live WebGL/model calibration have not been exercised because no database service, credentials, production SKUs or GLB assets are available in this workspace.

## Operational prerequisites

1. Create real SKU records with integer millimeter dimensions and allowed interior surfaces.
2. Supply versioned GLB files under `public/models/terrarium/`; model origin and bounds must match the SKU metadata.
3. Set `TERRARIUM_ADMIN_EMAIL` and existing email/Stripe/shipping settings.
4. Review and apply migration 006, then exercise the full customer/admin flow in a non-production environment before enabling product SKUs.

## Related decision

See [ADR 0001](../adr/0001-terrarium-projects-and-price-snapshots.md).

## Follow-up interaction polish (2026-11-14)

- Products can be dragged directly in the 3D view while staying on their selected mounting plane. The axis gizmo and directional nudge buttons are both available; nudge directions follow the selected floor or wall plane.
- Transform changes are committed when the drag ends. The current design is autosaved to the browser session, including demo designs; demo products remain local-only and cannot be submitted.
- The demo cork shelf supports the back and side walls, and its preview rotates to match the selected wall.
- Follow-up verification: ESLint passed for the changed interaction files and `pnpm build` passed. Vite still reports the lazy-loaded 3D scene chunk above 500 kB; evaluate it again with production models and target devices.
