import "server-only";
import sharp from "sharp";

/** Extracts the most common quantized color from an Instagram profile image. */
export async function getProfileAccentColor(imageUrl?: string | null): Promise<string> {
  if (!imageUrl) return "#a78bfa";
  try {
    const response = await fetch(imageUrl, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) return "#a78bfa";
    const bytes = Buffer.from(await response.arrayBuffer());
    const { data, info } = await sharp(bytes).resize(36, 36, { fit: "cover" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      // Ignore near-black/near-white pixels so the accent reflects the image's color.
      if ((max < 32) || (min > 238) || (max - min < 14 && (max < 70 || min > 200))) continue;
      const qr = r >> 4, qg = g >> 4, qb = b >> 4;
      const key = (qr << 8) | (qg << 4) | qb;
      const bucket = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0 };
      bucket.count++; bucket.r += r; bucket.g += g; bucket.b += b;
      buckets.set(key, bucket);
    }
    const winner = [...buckets.values()].sort((a, b) => b.count - a.count)[0];
    if (!winner) return "#a78bfa";
    return "#" + [winner.r / winner.count, winner.g / winner.count, winner.b / winner.count]
      .map((value) => Math.round(value).toString(16).padStart(2, "0")).join("");
  } catch {
    return "#a78bfa";
  }
}
