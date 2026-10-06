import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/prisma";

const V = () => process.env.INSTAGRAM_GRAPH_API_VERSION || "v24.0";
const key = () =>
  createHash("sha256")
    .update(process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY || "change-me")
    .digest();

export function enc(t: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const x = Buffer.concat([c.update(t, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), x].map((v) => v.toString("base64url")).join(".");
}

export function dec(v: string) {
  const [a, b, c] = v.split(".");
  const d = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(a, "base64url")
  );
  d.setAuthTag(Buffer.from(b, "base64url"));
  return Buffer.concat([
    d.update(Buffer.from(c, "base64url")),
    d.final(),
  ]).toString("utf8");
}

export async function ig<T>(
  token: string,
  path: string,
  params: Record<string, string> = {}
) {
  const u = new URL("https://graph.instagram.com/" + V() + "/" + path);
  u.searchParams.set("access_token", token);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));

  const r = await fetch(u, { cache: "no-store" });
  const d = (await r.json()) as T & {
    error?: { message?: string };
  };

  if (!r.ok || d.error) {
    throw new Error(d.error?.message || "Instagram request failed.");
  }

  return d;
}

async function igNext<T>(url: string, token: string) {
  const u = new URL(url);
  if (!u.searchParams.get("access_token")) {
    u.searchParams.set("access_token", token);
  }

  const r = await fetch(u, { cache: "no-store" });
  const d = (await r.json()) as T & {
    error?: { message?: string };
  };

  if (!r.ok || d.error) {
    throw new Error(d.error?.message || "Instagram request failed.");
  }

  return d;
}

export function instagramOAuthUrl(state: string) {
  const app = process.env.INSTAGRAM_APP_ID;
  const redirect = process.env.INSTAGRAM_REDIRECT_URI;

  if (!app || !redirect) {
    throw new Error(
      "Instagram OAuth is not configured. Add INSTAGRAM_APP_ID and INSTAGRAM_REDIRECT_URI."
    );
  }

  const u = new URL("https://www.instagram.com/oauth/authorize");
  u.searchParams.set("client_id", app);
  u.searchParams.set("redirect_uri", redirect);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "instagram_business_basic");
  u.searchParams.set("state", state);
  return u.toString();
}

type TokenResult = {
  access_token: string;
  expires_in?: number;
};

function expiry(expiresIn?: number) {
  return expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
}

async function refreshLongLivedToken(token: string) {
  const u = new URL("https://graph.instagram.com/refresh_access_token");
  u.searchParams.set("grant_type", "ig_refresh_token");
  u.searchParams.set("access_token", token);

  const r = await fetch(u, { cache: "no-store" });
  const d = (await r.json()) as TokenResult & {
    error?: { message?: string };
  };

  if (!r.ok || !d.access_token) {
    throw new Error(d.error?.message || "Instagram token refresh failed.");
  }

  return d;
}

async function tokenForStorage(token: string) {
  try {
    const r = await refreshLongLivedToken(token);
    return {
      token: r.access_token,
      expiresAt: expiry(r.expires_in),
    };
  } catch {
    return {
      token,
      expiresAt: null as Date | null,
    };
  }
}

export async function exchangeInstagramCode(code: string) {
  const app = process.env.INSTAGRAM_APP_ID;
  const secret = process.env.INSTAGRAM_APP_SECRET;
  const redirect = process.env.INSTAGRAM_REDIRECT_URI;

  if (!app || !secret || !redirect) {
    throw new Error("Instagram OAuth is not configured.");
  }

  const body = new URLSearchParams({
    client_id: app,
    client_secret: secret,
    grant_type: "authorization_code",
    redirect_uri: redirect,
    code,
  });

  const r = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const d = (await r.json()) as {
    access_token?: string;
    user_id?: string;
    error_message?: string;
  };

  if (!r.ok || !d.access_token) {
    throw new Error(d.error_message || "Instagram authorization failed.");
  }

  const u = new URL("https://graph.instagram.com/access_token");
  u.searchParams.set("grant_type", "ig_exchange_token");
  u.searchParams.set("client_secret", secret);
  u.searchParams.set("access_token", d.access_token);

  const lr = await fetch(u, { cache: "no-store" });
  const ld = (await lr.json()) as TokenResult & {
    error?: { message?: string };
  };

  if (!lr.ok || !ld.access_token) {
    throw new Error(
      ld.error?.message || "Instagram long-lived token exchange failed."
    );
  }

  return {
    accessToken: ld.access_token,
    expiresAt: expiry(ld.expires_in),
  };
}

export async function connect(token: string, connectedByUserId?: string) {
  const stored = await tokenForStorage(token);
  const m = await ig<{
    user_id?: string;
    id?: string;
    username?: string;
    name?: string;
    biography?: string;
    profile_picture_url?: string;
    account_type?: string;
  }>(stored.token, "me", {
    fields:
      "user_id,username,name,biography,profile_picture_url,account_type",
  });

  const id = String(m.user_id || m.id || "");

  if (!id || !m.username) {
    throw new Error("Token was rejected by Instagram.");
  }

  if (String(m.account_type || "").toUpperCase() !== "BUSINESS") {
    throw new Error(
      `This Instagram account is ${String(
        m.account_type || "not a supported type"
      ).toLowerCase()}. Marketplace stores must use an Instagram Business account, not a Creator or Personal account.`
    );
  }

  const existing = await db().instagramConnection.findUnique({
    where: { igUserId: id },
  });

  if (
    existing &&
    connectedByUserId &&
    existing.connectedByUserId !== connectedByUserId
  ) {
    throw new Error(
      `Instagram @${m.username} is already connected to another marketplace store.`
    );
  }

  const data = {
    igUserId: id,
    username: m.username,
    name: m.name,
    biography: m.biography,
    profileImageUrl: m.profile_picture_url,
    encryptedToken: enc(stored.token),
    expiresAt: stored.expiresAt,
    ...(connectedByUserId
      ? { connectedBy: { connect: { id: connectedByUserId } } }
      : {}),
  };

  if (existing) {
    return db().instagramConnection.update({
      where: { id: existing.id },
      data,
    });
  }

  return db().instagramConnection.create({
    data: {
      id,
      ...data,
    },
  });
}

export async function replaceConnectionToken(
  connectionId: string,
  token: string
) {
  const connection = await db().instagramConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) {
    throw new Error("Instagram connection not found.");
  }

  const stored = await tokenForStorage(token);
  const m = await ig<{
    user_id?: string;
    id?: string;
    username?: string;
    name?: string;
    biography?: string;
    profile_picture_url?: string;
    account_type?: string;
  }>(stored.token, "me", {
    fields:
      "user_id,username,name,biography,profile_picture_url,account_type",
  });

  const id = String(m.user_id || m.id || "");

  if (!id || !m.username) {
    throw new Error("Token was rejected by Instagram.");
  }

  if (
    id !== connection.igUserId ||
    m.username.toLowerCase() !== connection.username.toLowerCase()
  ) {
    throw new Error(
      `This token belongs to @${m.username}, not @${connection.username}.`
    );
  }

  if (String(m.account_type || "").toUpperCase() !== "BUSINESS") {
    throw new Error(
      "The replacement token must belong to an Instagram Business account."
    );
  }

  return db().instagramConnection.update({
    where: { id: connectionId },
    data: {
      name: m.name,
      biography: m.biography,
      profileImageUrl: m.profile_picture_url,
      encryptedToken: enc(stored.token),
      expiresAt: stored.expiresAt,
    },
  });
}

export async function syncAllConnectionsForUser(userId: string) {
  const connections = await db().instagramConnection.findMany({
    where: { connectedByUserId: userId },
    select: { id: true },
  });

  let total = 0;

  for (const c of connections) {
    total += await sync(c.id);
  }

  return total;
}

function tags(c: string) {
  return [...c.matchAll(/#[\p{L}\p{N}_]+/gu)].map((x) =>
    x[0].slice(1).toLowerCase()
  );
}

function title(c: string) {
  return (
    c
      .replace(/#[\p{L}\p{N}_]+/gu, "")
      .split("\n")
      .map((x) => x.trim())
      .find(Boolean) || "Instagram post"
  ).slice(0, 90);
}

type MediaResponse = {
  data?: any[];
  paging?: {
    next?: string;
  };
};

export async function sync(id: string) {
  const p = db();
  const c = await p.instagramConnection.findUnique({ where: { id } });

  if (!c) {
    throw new Error("Connection not found.");
  }

  let token = dec(c.encryptedToken);
  let expiresAt = c.expiresAt;

  if (
    expiresAt &&
    expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
  ) {
    const currentExpiresAt = expiresAt;

    try {
      const r = await refreshLongLivedToken(token);
      token = r.access_token;
      expiresAt = expiry(r.expires_in);

      await p.instagramConnection.update({
        where: { id },
        data: {
          encryptedToken: enc(token),
          expiresAt,
        },
      });
    } catch {
      if (currentExpiresAt.getTime() <= Date.now()) {
        throw new Error(
          "Instagram access has expired. Please reconnect the Instagram account."
        );
      }
    }
  }

  // Refresh the connected profile too, so name, bio and profile image changes
  // on Instagram are reflected in the marketplace on the next reconciliation.
  const profile = await ig<{
    username?: string;
    name?: string;
    biography?: string;
    profile_picture_url?: string;
  }>(token, "me", {
    fields: "username,name,biography,profile_picture_url",
  });

  await p.instagramConnection.update({
    where: { id },
    data: {
      name: profile.name,
      biography: profile.biography,
      profileImageUrl: profile.profile_picture_url,
    },
  });

  // Walk every media page, not just the first 100 posts. This is important
  // because the database must be able to detect a post that was deleted from
  // Instagram and remove its marketplace product too.
  const seenIds = new Set<string>();
  let next: string | null = null;
  let page = 0;
  let total = 0;

  do {
    const r: MediaResponse = next
      ? await igNext<MediaResponse>(next, token)
      : await ig<MediaResponse>(token, "me/media", {
          fields:
            "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username,like_count,comments_count",
          limit: "100",
        });

    for (const x of r.data || []) {
      if (!x?.id) continue;

      seenIds.add(String(x.id));
      const hs = tags(x.caption || "");
      const t = title(x.caption || "");
      const slug =
        t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") +
        "-" +
        String(x.id).slice(-8);

      const post = await p.instagramPost.upsert({
        where: { id: x.id },
        create: {
          id: x.id,
          connectionId: id,
          caption: x.caption || null,
          mediaType: x.media_type || "IMAGE",
          mediaUrl: x.media_url,
          thumbnailUrl: x.thumbnail_url,
          permalink: x.permalink,
          timestamp: x.timestamp ? new Date(x.timestamp) : null,
          instagramLikeCount: x.like_count || 0,
          instagramCommentCount: x.comments_count || 0,
          isProduct: true,
          productTitle: t,
          productSlug: slug,
        },
        update: {
          caption: x.caption || null,
          mediaType: x.media_type || "IMAGE",
          mediaUrl: x.media_url,
          thumbnailUrl: x.thumbnail_url,
          permalink: x.permalink,
          timestamp: x.timestamp ? new Date(x.timestamp) : null,
          instagramLikeCount: x.like_count || 0,
          instagramCommentCount: x.comments_count || 0,
          isProduct: true,
          productTitle: t,
          productSlug: slug,
        },
      });

      await p.productTag.deleteMany({ where: { postId: post.id } });

      if (hs.length) {
        await p.productTag.createMany({
          data: [...new Set(hs)].map((name) => ({
            name,
            postId: post.id,
          })),
        });
      }

      total++;
    }

    next = r.paging?.next || null;
    page++;

    if (page >= 100) {
      throw new Error(
        "Instagram returned too many media pages. Reconciliation stopped before deleting any database posts."
      );
    }
  } while (next);

  // Only delete after every Instagram media page was successfully read.
  // This prevents a temporary API failure from wiping valid marketplace data.
  const existing = await p.instagramPost.findMany({
    where: { connectionId: id },
    select: { id: true },
  });

  const deletedIds = existing
    .map((post) => post.id)
    .filter((postId) => !seenIds.has(postId));

  if (deletedIds.length) {
    await p.instagramPost.deleteMany({
      where: {
        connectionId: id,
        id: { in: deletedIds },
      },
    });
  }

  await p.instagramConnection.update({
    where: { id },
    data: {
      lastSyncedAt: new Date(),
      expiresAt,
    },
  });

  return total;
}
