# SokoLink AI Promotion Studio

The seller-facing Studio is at `/account/promotion-studio`. When a seller clicks **Create promotional video**, the API creates the project and submits an image-to-video job to fal.ai's Kling Video v3 Pro queue immediately. The page refreshes the job status every six seconds and displays a preview/download link when the provider reports completion.

## Required setup

1. In fal.ai, create an API key and enable access/credits for **Kling Video v3 Pro image-to-video**.
2. In Vercel → Project → Settings → Environment Variables, add `FAL_KEY` with that secret for Production (and Preview if needed). Never expose it as a `NEXT_PUBLIC_*` variable.
3. Ensure the AI Promotion Studio Prisma migration is applied to the same Neon database used by Vercel, then run `npx prisma generate` locally and deploy.
4. Deploy and test `/account/promotion-studio` with a connected Instagram Business shop and a product image URL that is publicly accessible over HTTPS.

## Provider, timing and cost

- Generation starts as soon as the user submits; completion is asynchronous and may take seconds to a few minutes depending on provider queue/load.
- Audio is optional via the **Generate video with audio** checkbox. When checked, the provider generates native audio; when unchecked, the video is silent. At the currently listed rates, a 15-second generation is estimated at **US$2.52 with audio** (US$0.168/second) or **US$1.68 without audio** (US$0.112/second). Check fal.ai pricing before launch; rates and model availability can change. Failed/duplicate attempts may still incur provider charges.
- Kling image-to-video infers aspect ratio from the source image. The UI's vertical 9:16 setting is not a guarantee that every square source image will render vertically.
- The current integration uses Kling v3 Pro for every creative mode selection. The Hybrid/Motion labels do not yet route to a separate free renderer.
- The resulting MP4 URL is stored as the video asset's storage key and shown to the signed-in project owner. This first integration does **not** copy the MP4 into SokoLink-owned object storage; configure durable private object storage and a signed playback/download endpoint before promising long-term retention.
- This creates a video asset only. It does not charge SokoLink for paid placement or activate a promotion campaign.

## Troubleshooting

- `Video generation is not configured`: set `FAL_KEY` in Vercel and redeploy.
- Provider authentication, quota or billing error: check the fal.ai API key, model access, account balance and usage limits.
- Product image cannot be fetched: verify the Instagram image URL is public, HTTPS and still valid.
- A project remains `PROCESSING`: refresh the page and inspect the provider queue/request in fal.ai. The page checks provider status while open.
- If the Neon table error `AiPromotionProject does not exist` appears, deploy the existing Prisma migration to the same database configured in Vercel; do not reset the database.

## Defaults

Product scope, Hybrid mode, 15 seconds, vertical 9:16 UI, and the premium promotion prompt. Project creation is authenticated and tied to the connected shop owner.
