# VitaZone

React storefront for terrarium equipment and exotic animal products.

## Stack

- Vite + React 19 frontend
- Express 5 API exposed on Vercel via `api/index.js`
- PostgreSQL persistence
- Stripe Checkout + webhooks
- Google Gemini chatbot via `@ai-sdk/google`
- Vercel Analytics + Speed Insights
- Resend transactional emails

## Local Development

- Install dependencies with the pinned package manager: `pnpm install`
- Start frontend + API: `pnpm dev`
- Run lint: `pnpm lint`
- Run tests with coverage: `pnpm test:coverage`
- Build production bundle: `pnpm build`

`pnpm migrate` is a legacy, destructive schema reset and is blocked by default. It drops tables and must only be used with a disposable local database after explicitly setting `ALLOW_DESTRUCTIVE_SCHEMA_RESET=true`. A remote target needs a second opt-in, and production/Vercel targets are always refused. This command is not the routine forward-migration workflow; the migration system is documented for replacement in the technical roadmap.

## Deployment
- Production deploys are triggered from `origin/main` through Vercel Git Integration.
- Vercel uses `pnpm` deterministically via `packageManager` in `package.json` and `pnpm-lock.yaml`.

## Demo Data Safety

- `server/scripts/catalogData.js` contains synthetic development data, not a verified product catalog.
- `pnpm seed` deletes existing users, addresses, categories, products, orders, and order items before inserting demo records. `pnpm sync:catalog` can overwrite prices/stock and archive products. Both scripts are blocked by default and refuse Vercel/production environments.
- Use only a disposable local database. Explicitly set `ALLOW_DEMO_SEED=true` or `ALLOW_DEMO_CATALOG_SYNC=true` for the matching local operation. Remote database targets additionally require `ALLOW_REMOTE_DEMO_DATABASE=true`; never use demo data against the production database.

## Security: Secrets Policy

- Never commit runtime secrets to the repository.
- Use `.env.example` only as a template with placeholder values.
- Store real secrets only in deployment secret managers (for example Vercel project secrets).
- Run `npm run check:secrets` before pushing changes.

## Production Env Notes

- Configure `CORS_ALLOWED_ORIGINS` as a comma-separated list of trusted frontend origins.
- On Vercel the app now auto-falls back to `TRUST_PROXY_HOPS=1`; override it only if your proxy chain differs.
- Keep `NODE_ENV` out of `.env` files used by Vite builds to avoid Vite warnings.
- Set `PUBLIC_APP_URL` to the canonical frontend origin used in Stripe success/cancel redirects.
- Configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `VITE_STRIPE_PUBLISHABLE_KEY` in the deployment environment.
- Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` if you want transactional emails (paid order confirmation and status updates).
- Keep `ALLOW_MANUAL_ORDER_CREATION=false` in production so the legacy unpaid order endpoint cannot bypass Stripe.
- In Stripe Dashboard, the webhook should listen at `/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.expired`, `payment_intent.succeeded`, `payment_intent.payment_failed` and optionally `charge.refunded`.
- Chatbot production env now uses Google Gemini: prefer `GOOGLE_GENERATIVE_AI_API_KEY`, but the backend also accepts `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `GOOGLE_AI_API_KEY`, or `AI_GATEWAY_API_KEY` when it contains a Gemini key. `GOOGLE_GENERATIVE_AI_MODEL` stays optional (default `gemini-2.5-flash`).
- Launch analytics now includes custom events for product view, search, add/remove cart, checkout start, discount code use and purchase confirmation.
- The repo is pnpm-ready: `packageManager` is pinned in `package.json` and `pnpm-lock.yaml` is generated for deterministic Vercel installs.
- Before going live, replace placeholder legal/contact data with the real business operator details if they differ from the current storefront copy.
