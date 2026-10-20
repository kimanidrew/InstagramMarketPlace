# SokoLink WhatsApp shopping assistant setup

This repository now contains the first WhatsApp Cloud API integration: webhook verification, signed-webhook validation, conversation/message logging, keyword-based listing search across SokoLink products and services, and image messages with listing captions and links.

## 1. Apply the database schema

After pulling the code locally, run:

```bash
npx prisma db push
npx prisma generate
```

Then commit/push the code and let Vercel deploy it. Do not skip the database push: the webhook stores conversations and messages in the new tables.

## 2. Create the Meta WhatsApp app

1. Visit https://developers.facebook.com/ and sign in.
2. Create or choose a Meta app and add the **WhatsApp** product.
3. In WhatsApp > API Setup / Getting Started, use the test phone number initially.
4. Copy the **Phone Number ID** and **temporary access token**. Add your own WhatsApp number as a test recipient if Meta asks you to.
5. Send the sample test message from Meta's setup screen before connecting SokoLink.

Meta's official overview: https://developers.facebook.com/docs/whatsapp/cloud-api/overview

## 3. Add Vercel environment variables

In Vercel > SokoLink project > Settings > Environment Variables, add these for Preview first (and Production when ready):

- `WHATSAPP_ACCESS_TOKEN`: token from Meta. The temporary token expires; replace it with a System User token before launch.
- `WHATSAPP_PHONE_NUMBER_ID`: the phone number ID, not the visible phone number.
- `WHATSAPP_VERIFY_TOKEN`: create your own long random string, e.g. with `openssl rand -hex 32`. This is not the Meta access token.
- `WHATSAPP_APP_SECRET`: App Secret from Meta app Settings > Basic. Never put this in a `NEXT_PUBLIC_*` variable.
- `WHATSAPP_GRAPH_API_VERSION`: `v24.0` by default; use a Graph API version currently supported for your Meta app.
- `NEXT_PUBLIC_SITE_URL`: `https://instagram-market-place.vercel.app` (change if your canonical production domain differs).

Redeploy after adding or changing environment variables.

## 4. Register the webhook in Meta

After the Vercel deployment is live, set the callback URL to:

`https://instagram-market-place.vercel.app/api/whatsapp/webhook`

Set Verify Token to exactly the value of `WHATSAPP_VERIFY_TOKEN`. Verify and save. Then subscribe the app to the **messages** webhook field for the WhatsApp product/WABA.

The GET route handles Meta's verification challenge. The POST route validates `X-Hub-Signature-256` against `WHATSAPP_APP_SECRET` before processing messages.

## 5. Test the shopper experience

1. Send “Hi” to the Meta test number. You should get a SokoLink welcome message.
2. Send a query such as “red dress”, “birthday cake”, “plumber Nairobi”, or a shop username.
3. Matching listings should arrive as individual WhatsApp image messages with a caption, seller username, category, and direct SokoLink listing link. If an image cannot be delivered, the assistant sends the listing details and link as text.
4. Check Vercel function logs if a reply is missing.

## Image delivery notes

WhatsApp's Cloud API accepts a publicly reachable HTTPS image URL. SokoLink sends the existing listing's image URL (or video thumbnail) directly, so Meta can retrieve it. Some Instagram-hosted media URLs can expire or become inaccessible. For reliable production delivery, the next hardening step is copying eligible listing images into durable public object storage (for example, S3/R2) and using those stable HTTPS URLs. Listings without a valid image URL are sent as text instead.

## What is not configured automatically

Only you can create/verify Meta business assets, accept Meta permissions/terms, supply tokens/secrets, configure the callback in Meta, and test using your WhatsApp account. This integration currently uses deterministic keyword search, not an external LLM; AI intent extraction, persistent shopper handoff, templates, opt-in capture, rate limiting, and checkout/M-Pesa are follow-up phases. It does not make payments or confirm stock/prices.

Before production, replace the temporary token with a properly permissioned System User token, ensure the business number and display name are approved as required by Meta, configure billing/messaging settings if prompted, and test opt-in, template, and customer-service-window rules.
