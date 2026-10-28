# SokoLink AI Promotion Studio
Implemented foundation: authenticated seller UI at `/account/promotion-studio`; authenticated project list/create/detail APIs; separate Prisma project/job/asset records; cron-protected renderer dispatcher with retries; and SQL migration.

## Manual setup required for rendered video
1. Review/apply `prisma/migrations/20261028220000_ai_promotion_studio/migration.sql` to Neon, then run `npx prisma generate`. Check migration history before `npx prisma migrate deploy`.
2. Deploy a trusted renderer and configure Vercel env vars `SOKOLINK_PROMOTION_RENDERER_URL` and `SOKOLINK_PROMOTION_RENDERER_SECRET`. It must return completed assets, e.g. `{ "provider": "renderer", "assets": [{ "type": "VIDEO", "storageKey": "private/object/key.mp4", "contentType": "video/mp4", "width": 1080, "height": 1920, "durationMs": 15000 }] }`. Do not return arbitrary public URLs as storage keys.
3. Configure Vercel Cron to POST `/api/ai-promotions/worker` with `Authorization: Bearer <CRON_SECRET>`.
4. Configure private object storage and a signed-download route before serving assets. The app stores metadata, not media bytes.
5. The current worker supports synchronous completed-renderer responses only; asynchronous provider job polling/callbacks are not implemented.
6. Run `npm run build` and integration tests against the configured Neon DB and renderer. This editing session cannot run Vercel, the database migration, or a real render.

Default creative settings: product scope, hybrid mode, 15 seconds, vertical 9:16 at 1080×1920, premium promotion prompt. Project creation never charges money or activates paid placement.
