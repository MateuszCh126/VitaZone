# ADR 0001: Terrarium projects and immutable quote snapshots

- Status: accepted for the isolated implementation branch; integration review pending.
- Date: 2026-11-13.

## Context

The configurator must represent individually purchasable shop SKUs at measured millimeter dimensions and preserve the exact submitted arrangement. Customers need an indicative SKU-price sum, followed by a store-reviewed final offer and payment. Normal catalog prices can change while a quote is being paid, and the current order path reads current catalog prices.

## Decision

- Store terrarium dimensions, inner dimensions, mounting surfaces and a versioned local GLB URL in each eligible product's `specs.terrariumDesigner` metadata.
- Serialize placements in millimeters and degrees with SKU IDs. The browser may show a provisional estimate, but the API resolves SKU stock and prices from the database.
- Store projects in an additive `terrarium_projects` table. Admin offers snapshot the per-SKU unit price and quantity; checkout consumes that snapshot through the existing order and Stripe flow.
- Keep sample SKUs explicitly local and non-purchasable. Do not configure product publication until real stock, measurements and calibrated models exist.
- Require models in `/models/terrarium/` as versioned GLB assets. Element and enclosure GLB models use the center of their measured bounding box as the origin; their extents must match `dimensionsMm` in meters. Scene code does not rescale models to compensate for incorrect asset dimensions.
- Keep the configurator route lazy and render the 3D canvas on demand with a device pixel ratio cap. Keep DOM controls available if WebGL is unavailable.

## Consequences

The checkout can preserve a reviewed price even if catalog prices change later. Product/model calibration is an operational prerequisite for the “what you see is what you get” promise. The additive migration must be applied before enabling real project submissions. The offer total currently covers products; delivery is charged separately by the existing configured shipping amount, and no build labor is included.

## Migration

Apply with `pnpm migrate:terrarium` in an explicitly configured environment after reviewing the SQL. This branch does not run the migration or connect to a database. Do not use the legacy schema recreation script as a migration.
