# SokoLink

SokoLink is a social shopping marketplace where approved Instagram accounts become stores and their Instagram posts are automatically linked as marketplace products.

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

## Brand identity environment

The visible brand name, gradient colours and wordmark font are configured with these environment variables (set them in `.env.local` and Vercel):

```env
NEXT_PUBLIC_BRAND_NAME="SokoLink"
NEXT_PUBLIC_BRAND_COLOR_START="#00C2A8"
NEXT_PUBLIC_BRAND_COLOR_END="#7C3AED"
NEXT_PUBLIC_BRAND_FONT_FAMILY="Space Grotesk"
```

The gradient runs from `NEXT_PUBLIC_BRAND_COLOR_START` to `NEXT_PUBLIC_BRAND_COLOR_END`. The font is loaded from Google Fonts using the family name configured in `NEXT_PUBLIC_BRAND_FONT_FAMILY`. Restart the dev server after changing local environment variables and redeploy after changing Vercel variables.

## Instagram OAuth environment
Set these in Vercel/server environment variables:

```env
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=https://your-domain.com/api/instagram/callback
INSTAGRAM_GRAPH_API_VERSION=v24.0
INSTAGRAM_TOKEN_ENCRYPTION_KEY=
```

The App Secret is server-side only. Never expose it in browser code or commit it to Git.

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

Set `CRON_SECRET` in Vercel. The scheduled route `/api/cron/instagram-sync` requires `Authorization: Bearer <CRON_SECRET>`. Vercel runs the reconciliation hourly with the included cron configuration. For more frequent synchronization, increase the cron frequency on a Vercel plan that supports it.
