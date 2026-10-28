# AI Promotion media storage

The worker and download endpoint use private Cloudflare R2 S3-compatible storage.

Required environment variables:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

Create a private bucket and an API token scoped only to that bucket. Do not use a public bucket for generated seller media. Signed URLs expire and are generated server-side.

The S3 SigV4 implementation uses region `auto` for Cloudflare R2 and signs the `host` header. Validate this against your R2 account in staging before enabling the feature flag.
