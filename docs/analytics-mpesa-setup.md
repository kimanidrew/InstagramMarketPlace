# Seller analytics and paid promotions setup

## What is included

- Seller-only analytics at `/account/analytics`, with per-shop product impressions, product-detail views, listing clicks, marketplace likes and 30-day graphs.
- Viewport-based listing and featured-store impressions, product/store detail views, and listing clicks are written to `AnalyticsEvent`.
- Paid product and shop campaigns with target reach packages, campaign delivery tracking, payment records and an M-Pesa STK Push checkout.
- A campaign is activated only after a successful Daraja callback, STK query verification, amount validation and receipt validation. Product campaigns stop being featured when their unique-visitor target is reached.

Analytics reflect Instagram Market activity only. They are not Instagram-native Insights data. Reach is measured as distinct browser visitor IDs that actually see the campaign placement; it is not a promise that a given number of people will be reached instantly.

## 1. Apply the database schema

The Prisma schema has new analytics, campaign and payment models. Against the correct Neon database, run:

```bash
npm install
npx prisma db push
npx prisma generate
```

Back up production data before applying schema changes. Do not add `prisma db push` to the production build command.

## 2. Configure M-Pesa Daraja in Vercel

Create/configure a Safaricom Daraja app for STK Push and add these **server-side** environment variables in Vercel Project Settings → Environment Variables:

- `MPESA_CONSUMER_KEY` — Daraja consumer key
- `MPESA_CONSUMER_SECRET` — Daraja consumer secret
- `MPESA_SHORTCODE` — business shortcode/paybill configured for STK Push
- `MPESA_PASSKEY` — the matching Lipa Na M-Pesa passkey
- `MPESA_ENVIRONMENT` — `sandbox` for testing or `production` for live payments
- `MPESA_CALLBACK_URL` — public HTTPS URL ending in `/api/payments/mpesa/callback`

For this deployment, the callback URL will normally be:

`https://instagram-market-place.vercel.app/api/payments/mpesa/callback`

Use the exact callback URL registered/accepted for your Daraja app. Test end-to-end in sandbox first, then switch to production credentials and environment after Safaricom onboarding. Never expose these credentials with an `NEXT_PUBLIC_` prefix.

## 3. Pricing packages

The current starter packages are configured in both `app/api/promotions/route.ts` (server-authoritative prices) and `components/seller-analytics.tsx` (display):

| Target unique visitors | Price |
| ---: | ---: |
| 500 | KSh 100 |
| 1,000 | KSh 180 |
| 2,500 | KSh 400 |
| 5,000 | KSh 750 |
| 10,000 | KSh 1,300 |

These are initial marketplace pricing defaults; confirm your commercial pricing before taking live payments. If prices change, update the server-side map first and keep the dashboard labels in sync.

## 4. Delivery notes

- Product impressions are counted when a product listing card is at least 30% visible in the browser viewport.
- Store impressions are counted when a featured store card is visible. Active paid store campaigns are prioritized in the Discover stores section.
- Repeated impressions by the same browser are deduplicated for campaign reach; analytics uses a pseudonymous browser ID stored locally.
- Campaigns remain active until their target is delivered; they can take time depending on marketplace traffic.
- Safaricom must be able to reach the callback URL publicly over HTTPS. If a user completes payment but the callback cannot be reached, payment status may remain pending and should be reconciled before treating the campaign as paid.
