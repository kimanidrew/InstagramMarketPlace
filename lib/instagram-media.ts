const MEDIA_CACHE_TTL = 5 * 60 * 1000;

type CachedResult = { ok: boolean; expiresAt: number };
const cache = new Map<string, CachedResult>();

export async function isInstagramMediaAvailable(url?: string | null): Promise<boolean> {
  if (!url) return false;

  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.ok;

  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });

    const ok = response.ok;
    cache.set(url, { ok, expiresAt: Date.now() + MEDIA_CACHE_TTL });
    return ok;
  } catch {
    // Treat an unreachable media URL as unavailable for this render.
    cache.set(url, { ok: false, expiresAt: Date.now() + 30_000 });
    return false;
  }
}

export async function filterAvailableInstagramMedia<T extends { mediaUrl?: string | null }>(
  items: T[],
): Promise<T[]> {
  const checks = await Promise.all(
    items.map(async (item) => ({
      item,
      available: await isInstagramMediaAvailable(item.mediaUrl),
    })),
  );

  return checks.filter((x) => x.available).map((x) => x.item);
}
