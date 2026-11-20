# Shlip

Shlip is a social shopping marketplace where approved Instagram accounts become stores and their Instagram posts are automatically linked as marketplace products.

## Flow
1. User signs up.
2. User enters an Instagram username.
3. Admin reviews the request.
4. After approval, the user gets a secure **Connect Instagram** button.
5. The user authorizes your Meta/Instagram app through OAuth.
6. The server exchanges the authorization code for an access token.
7. The token is encrypted and saved in Neon against that marketplace user's Instagram connection.
8. The latest Instagram posts are synced automatically.
9. Every imported Instagram post is automatically represented as a marketplace product.
10. Hashtags on posts become searchable marketplace categories.

## Brand identity

The application brand is **Shlip**. The wordmark and interface use Plus Jakarta Sans with a crimson-to-charcoal palette. The brand identity is defined in the application so older deployment environment variables cannot restore the previous name.

## Instagram OAuth environment
Set these in Vercel/server environment variables:

```env
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=https://your-domain.com/api/instagram/callback
INSTAGRAM_GRAPH_API_VERSION=v24.0
INSTAGRAM_TOKEN_ENCRYPTION_KEY=
INSTAGRAM_APP_MODE=development
```

The App Secret is server-side only. Never expose it in browser code or commit it to Git. Set `INSTAGRAM_APP_MODE=development` while testing (the default when unset); only Meta app testers/roles can connect in development mode. Set `INSTAGRAM_APP_MODE=live` after Meta app review and production approval.

In your Meta app, register the exact callback URL:
`https://your-domain.com/api/instagram/callback`

## Database
```env
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

Run:

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Use a pooled Neon connection as DATABASE_URL and the direct connection as DIRECT_URL.

## Product model
Products are Instagram posts, not manually created catalog entries. The marketplace stores the Instagram media ID as the product identity and keeps the original Instagram permalink. Product title is derived from the first non-hashtag caption line, while hashtags are saved as categories.

## Likes
Instagram like counts are synced from Instagram where available. Marketplace likes are separate local likes because the Instagram API does not provide a general endpoint for this marketplace to programmatically like another user's Instagram post.

## Security
Access tokens are encrypted with AES-256-GCM before being stored in Neon. OAuth state is signed and expires quickly to protect the callback from CSRF/replay attempts.

## Automatic Instagram synchronization
The marketplace treats each Instagram post as the product identity. A scheduled reconciliation calls the connected Instagram accounts, follows pagination through the media list, updates changed captions/media/engagement/profile data, imports newly published posts, and removes marketplace products whose Instagram media IDs are no longer returned by Instagram. The deletion pass only runs after a complete successful media read, so a temporary Instagram API failure will not wipe the store.

Set `CRON_SECRET` in Vercel. The scheduled route `/api/cron/instagram-sync` requires `Authorization: Bearer <CRON_SECRET>`. The included schedule runs daily at 03:00 UTC (`0 3 * * *`), which is compatible with Vercel Hobby. Hourly sync requires a Vercel Pro plan. To enable hourly sync on Pro, change the single `schedule` line in `vercel.json` from `"schedule": "0 3 * * *"` to `"schedule": "0 * * * *"`, then redeploy. The cron route continues to require `Authorization: Bearer <CRON_SECRET>`.

Store owners and admins can also use **Sync now**. Manual sync is limited to once every 15 minutes per store and calls the same reconciliation function as the cron. A failed or incomplete media read never triggers the deletion pass. Instagram tokens are refreshed when they are within 10 days of expiry and at least 24 hours old; invalid/expired tokens are marked `NEEDS_RECONNECT`, skipped by sync, and their existing products are preserved. Owners see a reconnect prompt on their account dashboard.


## Shlip WhatsApp shopping assistant

The WhatsApp Cloud API webhook is available at `/api/whatsapp/webhook`. It searches existing Shlip product and service listings, sends up to three matching results, and sends each listing's image as a WhatsApp image message when a publicly reachable HTTPS image URL is available. Video listings use a thumbnail. If Meta cannot fetch an image, the bot falls back to listing text and a link.

Configure these server-side environment variables in local `.env.local` and in Vercel Project Settings → Environment Variables:

```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_GRAPH_API_VERSION=v24.0
NEXT_PUBLIC_SITE_URL=https://instagram-market-place.vercel.app
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

- `WHATSAPP_ACCESS_TOKEN`: Meta WhatsApp Cloud API access token. Use a suitable long-lived/system-user token for production, not only the temporary quickstart token.
- `WHATSAPP_PHONE_NUMBER_ID`: the ID for the WhatsApp sender number, not the visible phone number.
- `WHATSAPP_VERIFY_TOKEN`: a long random string you create; use the exact same value when subscribing the webhook in Meta.
- `WHATSAPP_APP_SECRET`: the Meta app secret used to validate webhook signatures.
- `WHATSAPP_GRAPH_API_VERSION`: a Graph API version supported by your Meta app.
- `NEXT_PUBLIC_SITE_URL`: the canonical public Shlip origin used in listing links.
- `OPENAI_API_KEY` (optional): enables AI extraction of search terms and product/service intent. Without it, the assistant falls back to keyword search. Keep this key server-side only.

After setting the variables, redeploy on Vercel. In Meta for Developers, open your app → WhatsApp → Configuration, set the callback URL to `https://YOUR-DOMAIN/api/whatsapp/webhook`, enter the same verify token, verify the callback, and subscribe to the `messages` webhook field. Use the app's actual App Secret in Vercel. Send a message to the configured WhatsApp number to test.

An admin-only checklist and environment readiness view is available at `/admin/whatsapp`. It reports whether required variables are present without exposing their values. It cannot create Meta business assets, generate tokens, or change Meta dashboard settings on your behalf.

**Pricing:** Instagram captions are scanned for explicitly marked prices such as KES/Ksh, `/=`, `bei:`, `price:`, `@`, and `$`. The parser is deliberately conservative and ignores unmarked numbers. Store owners can correct a product or service price from the product card on their own public storefront while signed in; manual prices are never overwritten by later Instagram syncs. WhatsApp includes a saved price when available and otherwise asks customers to confirm pricing with the seller. Location is not currently stored as a structured field. The assistant does not take payments or place orders yet. WhatsApp messaging policies, customer-initiated messaging windows, template requirements, and Meta charges still apply.


## Instagram account requirements and Meta app readiness

Shlip accepts Instagram **Business** and **Creator** accounts. Personal accounts must be switched in the Instagram app: Profile → ☰ → Settings and privacy → Account type and tools → Switch to professional account → choose Business or Creator. The seller must confirm the account type before submitting a store request.

When `INSTAGRAM_APP_MODE` is unset, Shlip defaults to `development`. In development mode, only people invited as Instagram testers or added to app roles can authorize the app. The admin readiness checklist is at `/admin/instagram`; it shows environment-variable presence only (never secret values), the active redirect URI, app mode, and connection status counts.

### Before switching the Meta app to Live

1. **Permissions:** configure and request App Review for the Instagram API permissions used by the OAuth flow: `instagram_business_basic` and `instagram_business_manage_comments`. Confirm the current Meta product/API requirements for the app before submission.
2. **Privacy policy:** publish a public privacy policy URL describing the Instagram data accessed, how Shlip uses/stores it, retention, security, and user rights; add that URL in Meta App Settings → Basic.
3. **Data deletion:** implement and configure a publicly reachable Meta data deletion callback URL. It must verify Meta's signed request, identify the user, delete or anonymize associated Instagram-derived data and tokens, and return Meta's required confirmation response. Add the callback URL in Meta App Settings → Data deletion requests.
4. **App Review:** complete the Meta business/app details, provide screencast/test credentials and a clear explanation of the Instagram connection and marketplace sync, submit the required permissions for review, and wait for approval.
5. **Go live:** after Meta approves the app and all production URLs/legal pages are in place, set `INSTAGRAM_APP_MODE=live` in Vercel and redeploy.

> The data-deletion callback and public privacy policy are Meta launch prerequisites; the checklist above documents the required work and does not imply that Meta has approved the app.

## Database updates

The Instagram token lifecycle and structured pricing fields are additive. Existing connections/posts remain intact and old `expiresAt` values remain supported during rollout. Apply the updated Prisma schema with:

```bash
npx prisma db push
npx prisma generate
```

No destructive migration is required. The new nullable expiry/refresh/profile/price columns and defaulted status/source fields are safe for existing rows. Run the helper tests with:

```bash
npm test
```
