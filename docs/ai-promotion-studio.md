# SokoLink AI Promotion Studio

## What is included

- Seller page: `/account/ai-promotions`
- Product/service and whole-store campaign creation.
- Default Hybrid mode, 15 seconds, vertical 1080 × 1920 and the requested premium creative prompt.
- Prisma models and an incremental SQL migration.
- Authenticated campaign list/create/detail/cancel/retry/download and credit APIs.
- Database-backed durable worker that polls the job table, claims jobs conditionally, retries transient failures and reconciles provider tasks.
- FFmpeg motion rendering, exact seller/product CTA overlays, private R2 storage and output metadata validation.
- Optional Runway image-to-video provider integration with a configurable daily estimated-cost cap and motion fallback.
- Contract tests for defaults, supported modes/formats and prompt validation.

## Deployment is intentionally split

The Next.js app must not render videos in a request handler. Run `worker/main.ts` as a separate long-lived Linux process. The worker requires FFmpeg and FFprobe installed on the host. The first deployment should use one worker instance; the daily provider budget is a database estimate and is not designed for multiple independently racing worker instances.

## Environment variables

Application and worker:
- `DATABASE_URL` or `POSTGRES_URL`: Neon PostgreSQL connection string.
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `AI_PROMOTION_STARTER_CREDITS` (default 1)
- `AI_PROMOTION_MAX_ACTIVE_PER_SELLER` (default 3)
- `AI_PROMOTION_MAX_CREDITS_PER_CAMPAIGN` (reserved for future policy enforcement; current release reserves at most one cinematic credit)
- `AI_PROMOTION_WORKER_POLL_MS` (default 2500)
- `AI_PROMOTION_FFMPEG_PATH` (default `ffmpeg`)
- `AI_PROMOTION_FFPROBE_PATH` (default `ffprobe`)
- `AI_PROMOTION_FONT_FILE` (default `/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`)

Optional cinematic provider:
- `AI_PROMOTION_CINEMATIC_ENABLED=true`
- `RUNWAYML_API_SECRET`
- `RUNWAY_MODEL` (default `wan3`; verify current model/duration/ratio support in your provider account)
- `AI_PROMOTION_CINEMATIC_ESTIMATED_COST_USD` (estimated cost per campaign; default is duration × $0.20 for WAN 3.0)
- `AI_PROMOTION_DAILY_PROVIDER_BUDGET_USD` (default $10)

Keep all secrets server-side. Do not set provider keys with a `NEXT_PUBLIC_` prefix.

## Neon migration on the existing database

The repository previously had no checked-in Prisma migration history; its current build generates Prisma Client but does not apply migrations. Therefore do not assume `prisma migrate deploy` can be run immediately against the existing non-empty Neon database.

1. Create a Neon branch/backup before modifying production.
2. Review and run `prisma/migrations/20261028180000_ai_promotion_studio/migration.sql` in the Neon SQL editor against the intended database.
3. Run `npx prisma generate` after the new schema is committed.
4. If adopting Prisma migration history for future deployments, reconcile the existing database's migration baseline with your established migration strategy before running `prisma migrate deploy`. Do not mark this migration as applied before its SQL has actually been applied.
5. Test the migration and app against a Neon development branch first.

The migration creates only new AI promotion types/tables and does not modify marketplace promotion/payment records.

## Worker setup

On a worker-capable Linux host such as Render, Fly.io or Railway:

1. Create a separate worker service from the feature branch after review.
2. Build with `npm ci && npx prisma generate`.
3. Start with `npm run worker:ai-promotions`.
4. Install FFmpeg and FFprobe on the worker host and configure the font path.
5. Add the Neon and R2 variables to the worker service's private environment.
6. Keep one worker instance until provider cost reservation and concurrency controls are tested under load.

Do not run the worker as a Vercel cron route; rendering and provider polling are long-running tasks.

## R2 setup

Create a private Cloudflare R2 bucket and an API token scoped to that bucket. Test signed GET and PUT requests in staging before enabling downloads. Keep object access private and use the app's authenticated download route to issue short-lived signed URLs.

## Runway setup

Create a Runway developer API key, set `RUNWAYML_API_SECRET`, choose a model that supports the desired 10- or 15-second output and portrait/square/landscape ratio, and test with a small budget. Provider pricing and model capabilities can change. The application records estimated cost, not a verified invoice amount; reconcile the estimate against provider usage before treating it as actual spend.

The cinematic provider is disabled unless both `AI_PROMOTION_CINEMATIC_ENABLED=true` and the API key are configured. If unavailable, Hybrid/Cinematic requests fall back to motion rendering, subject to the application's credit rules.

## Verification

Run:

```bash
npx prisma validate
npx prisma generate
npm run test:ai-promotions
npx tsc --noEmit
npm run build
```

Before public rollout, also test campaign ownership, credit races, cancellation during rendering, provider timeouts, R2 uploads/downloads, worker restarts, and cost reconciliation on a non-production database.
