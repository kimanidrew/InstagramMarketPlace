import { createHash, createHmac } from "node:crypto";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required storage configuration: ${name}`);
  return value;
}

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function signingKey(secret: string, date: string) {
  const dateKey = hmac("AWS4" + secret, date);
  const regionKey = hmac(dateKey, "auto");
  const serviceKey = hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
}

function encodePath(value: string) {
  return value.split("/").map((part) => encodeURIComponent(part).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())).join("/");
}

function r2Config() {
  const account = required("R2_ACCOUNT_ID");
  const bucket = required("R2_BUCKET_NAME");
  const host = `${account}.r2.cloudflarestorage.com`;
  return { bucket, host, accessKey: required("R2_ACCESS_KEY_ID"), secretKey: required("R2_SECRET_ACCESS_KEY") };
}

export function createR2SignedUrl(key: string, method: "GET" | "PUT" = "GET", expiresSeconds = 900, contentType?: string) {
  const cfg = r2Config();
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const scope = `${date}/auto/s3/aws4_request`;
  const uri = `/${encodePath(cfg.bucket)}/${encodePath(key)}`;
  const params: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${cfg.accessKey}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(Math.max(60, Math.min(expiresSeconds, 604800))),
    "X-Amz-SignedHeaders": "host",
  };
  const canonicalQuery = Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  const canonicalRequest = [method, uri, canonicalQuery, `host:${cfg.host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
  const signature = createHmac("sha256", signingKey(cfg.secretKey, date)).update(stringToSign).digest("hex");
  const url = `https://${cfg.host}${uri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  return { url, headers: method === "PUT" && contentType ? { "content-type": contentType } : {} };
}

export async function uploadR2Object(key: string, body: Buffer, contentType: string) {
  const signed = createR2SignedUrl(key, "PUT", 900, contentType);
  const response = await fetch(signed.url, { method: "PUT", headers: { ...signed.headers, "content-length": String(body.byteLength) }, body: body as unknown as BodyInit, signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`Object storage upload failed with status ${response.status}`);
}

export function safeAssetKey(campaignId: string, suffix: string) {
  const clean = suffix.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
  return `ai-promotions/${campaignId}/${clean}`;
}
