# SokoLink AI Promotion worker

Run as a separate long-lived Linux Node.js process. The repository already includes `tsx`; no web request waits for a render.

## Start

```bash
npx tsx worker/main.ts
```

The worker requires:
- The same Neon `DATABASE_URL` (or `POSTGRES_URL`) used by the application.
- Private R2 storage variables documented in `lib/ai-promotions/storage.README.md`.
- FFmpeg installed on the worker host and available as `ffmpeg`, or set `AI_PROMOTION_FFMPEG_PATH`.
- A Linux font file at `AI_PROMOTION_FONT_FILE` or the default DejaVu Sans Bold font path.
- Optional cinematic generation: `AI_PROMOTION_CINEMATIC_ENABLED=true`, `RUNWAYML_API_SECRET`, and a Runway model that supports the selected duration and ratio via `RUNWAY_MODEL`.

The worker polls the database-backed durable job table and claims jobs with a conditional update. This intentionally avoids requiring a Redis service in the first deployment. Run one worker process initially; the claim update prevents two workers from processing the same queued job. Scale out only after observing Neon connection and FFmpeg resource usage.

The first release renders a single selected source image into a motion-designed video. If a cinematic provider is enabled, it attempts image-to-video generation and overlays exact shop/product CTA text in FFmpeg. Provider failure falls back to motion rendering when possible. Cinematic cost is configurable using `AI_PROMOTION_CINEMATIC_ESTIMATED_COST_USD`; reconcile this estimate against actual provider usage before charging sellers.
