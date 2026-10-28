# SokoLink AI Promotion Studio

The seller-facing Studio is at `/account/promotion-studio`. Video creation is **pay before generation**: the API calculates a KSh quote, sends an M-Pesa STK Push, and submits the video job only after the server receives a matching successful Daraja callback. The callback must match a known checkout request, exact expected amount, expected phone number, and a receipt number. Duplicate callbacks cannot mark the same payment paid twice or claim the project twice.

## Required setup

1. In fal.ai, create an API key and enable credits/access for **Kling Video v3 Pro image-to-video**.
2. In Vercel → Project → Settings → Environment Variables, add `FAL_KEY` (server-side only).
3. Create a Safaricom Daraja app at https://developer.safaricom.co.ke/ and enable **Lipa Na M-Pesa Online / STK Push**. Configure the consumer key/secret, shortcode, passkey, and transaction type for the selected sandbox/production environment.
4. Set these Vercel environment variables for the same environment: `MPESA_ENVIRONMENT` (`sandbox` initially), `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_TRANSACTION_TYPE` (usually `CustomerPayBillOnline` for a PayBill shortcode), and `MPESA_CALLBACK_URL`. The callback must be a publicly reachable HTTPS URL ending in `/api/payments/mpesa/callback`. Do not use localhost or expose credentials with `NEXT_PUBLIC_`.
5. Apply the Prisma migration to the same Neon database used by Vercel and regenerate the Prisma client: `npx prisma migrate deploy`, `npx prisma generate`. Do not reset Neon.
6. Deploy, then test with Safaricom sandbox credentials and a supported test MSISDN before switching `MPESA_ENVIRONMENT=production`. Production requires valid live Daraja credentials and a configured business shortcode/passkey.
7. Visit `/admin/ai-promotion-pricing` as an admin to configure the USD/KSh exchange rate, profit margin, operating fee, minimum price, optional per-duration/audio fixed price overrides, and payment enable/disable switch.

## Pricing

- Provider rates default to `FAL_KLING_V3_PRO_SILENT_USD_PER_SECOND=0.112` and `FAL_KLING_V3_PRO_AUDIO_USD_PER_SECOND=0.168`; keep them updated against current fal.ai pricing.
- Automatic price = provider cost in KSh × (1 + margin %) + operating fee, rounded up to the next KSh 10, with the configured minimum applied. Admin-set price overrides take precedence for each duration/audio combination.
- The quote is calculated on the server and saved as a price snapshot with the payment before the STK request. The browser cannot choose the amount.
- The Studio displays provider-cost estimates and the exact KSh amount submitted to M-Pesa. No video job is submitted before a valid payment callback.

## Failure, duplicate requests and refunds

- Project/payment idempotency keys and unique checkout/receipt identifiers protect against ordinary repeat submissions and duplicate callbacks.
- If payment is declined, the project is marked failed and no video is generated.
- If payment succeeds but video submission/provider generation fails, the payment is marked `REFUND_PENDING` for admin review. This is intentional: this implementation does not automatically disburse refunds. Issue the refund through your approved M-Pesa business process, then record its transaction/reference using the admin-only refund reconciliation endpoint.
- A failed project whose provider request may already have been accepted is **not** automatically resubmitted, to avoid charging the provider twice. Investigate provider status before any retry or refund.
- Callback matching reduces spoofing risk, but production launch should include Daraja transaction-status reconciliation and monitoring for callbacks that are delayed or never arrive.

## Provider and retention notes

- Generation is asynchronous and may take seconds to minutes. The page polls the project list while open.
- Kling's image-to-video aspect ratio is inferred from the source image; the UI's vertical 9:16 setting cannot guarantee every input image renders vertically.
- The selected AI/Hybrid/Motion creative modes currently use Kling v3 Pro; they do not route to separate renderers.
- The generated MP4 is currently stored as the fal.ai-hosted URL, not copied into SokoLink-owned object storage. Configure durable private storage and signed playback/download before promising long-term retention.
- This feature charges for the AI video only; it does not activate a paid placement campaign.

## Troubleshooting

- `M-Pesa payments are not configured yet`: set all required `MPESA_*` values in Vercel and redeploy.
- Daraja authentication or STK errors: check environment, credentials, shortcode/passkey, transaction type, account status, and callback URL.
- Payment remains pending: check Daraja callback delivery and the matching checkout request. Do not manually mark a payment paid.
- `AiPromotionProject does not exist`: apply migrations to the same Neon database configured in Vercel; never reset the database.
- Video provider quota/authentication errors: check `FAL_KEY`, model access, and fal.ai credits.
