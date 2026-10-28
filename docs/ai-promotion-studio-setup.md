# SokoLink AI Promotion Studio setup

## What is included

- Authenticated studio at `/account/ai-promotions`.
- Product and whole-shop campaign creation, creative prompt, mode, duration and aspect-ratio selection.
- Campaign/job records and a protected worker endpoint.
- Replicate prediction create/poll integration. The selected Replicate model must support the input contract documented below.
- Retry for failed jobs and a campaign history.

## Required environment variables

Add these to local `.env` and the production deployment environment (Vercel):

- `REPLICATE_API_TOKEN`: Replicate API token with permission to run the chosen model.
- `REPLICATE_MODEL_VERSION`: immutable version ID for a Replicate image-to-video model that accepts `prompt`, `duration`, and `aspect_ratio`; hybrid mode also passes `image`.
- `AI_PROMOTION_WORKER_SECRET`: long random secret used to authorize worker requests. If unset, the worker accepts `CRON_SECRET` as the secret.

Do not commit secrets. A model's input schema differs across providers/models. Before enabling generation, verify that the selected model accepts the input fields above and that its output contains an HTTPS video URL. If it uses different field names, adjust the input mapping in `app/api/internal/ai-promotions/worker/route.ts`.

## Database

Run `npx prisma migrate deploy` after the migration has been committed, then `npx prisma generate`. The current repository uses Prisma 6.19.3 and Neon; do not upgrade Prisma as part of this feature.

## Worker schedule

The worker is an authenticated HTTP endpoint at `POST /api/internal/ai-promotions/worker`. Schedule it every minute from a trusted external scheduler, sending:

```http
Authorization: Bearer <AI_PROMOTION_WORKER_SECRET>
```

It processes one due job per request. Repeated invocations start a prediction and poll its state. The worker secret must be kept private. Do not call this endpoint from browser code. A Vercel Cron can be used if the project's plan and cron limits permit it; otherwise use a trusted scheduler/worker service.

## Storage and production hardening

This first integration stores the provider's returned output URL directly. For production, add private object storage (e.g. Cloudflare R2), copy the completed video into your bucket, and issue short-lived signed download URLs. Also configure provider spend limits and rate limits before opening generation to all users. The worker is intentionally provider-neutral at the campaign/database layer, but the Replicate input mapping is model-specific.

## UI defaults

- Scope: PRODUCT
- Mode: HYBRID
- Duration: 15 seconds
- Format: VERTICAL (9:16)
- Prompt: `Create a stylish, premium promotion that highlights the product clearly and ends with a strong call to action.`
