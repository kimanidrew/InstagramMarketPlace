# Instagram Market

A white, mobile-friendly marketplace where approved Instagram accounts become stores and posts tagged #InstagramMarket become products.

## Flow
1. User signs up.
2. User enters an Instagram username.
3. Admin reviews the request.
4. After approval the user is directed to Instagram Manage Access to accept the connection.
5. Admin pastes the approved account's access token in Admin -> Instagram connections.
6. The server validates and encrypts the token.
7. Sync imports eligible Instagram media.
8. Posts containing #InstagramMarket become products.
9. Other hashtags become searchable categories.
10. Customers can browse stores and save marketplace likes.

## Important API limitation
A username does not itself authorize Instagram API access. The actual Meta/Instagram authorization and a valid access token are still required.

The official Instagram API can expose eligible media and like counts, but it does not provide a general endpoint for a marketplace to programmatically like another user's Instagram post. Marketplace likes are therefore stored locally and each product links to its original Instagram post for real Instagram engagement.

## Environment
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
INSTAGRAM_TOKEN_ENCRYPTION_KEY=
INSTAGRAM_GRAPH_API_VERSION=v24.0

## Setup
npm install
npx prisma db push
npm run dev

Use a pooled Neon connection as DATABASE_URL and the direct connection as DIRECT_URL.