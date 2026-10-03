# Instagram Market

A white, mobile-friendly marketplace where approved Instagram accounts become stores and their Instagram posts are automatically linked as marketplace products.

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