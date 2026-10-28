const ENDPOINT = "fal-ai/kling-video/v3/pro/image-to-video";

function key() {
  const value = process.env.FAL_KEY;
  if (!value) throw new Error("Video generation is not configured. Add FAL_KEY to the Vercel environment variables.");
  return value;
}

async function falFetch(path: string, init?: RequestInit) {
  const response = await fetch(`https://queue.fal.run/${ENDPOINT}${path}`, {
    ...init,
    headers: { Authorization: `Key ${key()}`, "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data.detail === "string" ? data.detail : typeof data.error === "string" ? data.error : `Video provider returned HTTP ${response.status}`;
    throw new Error(message.slice(0, 350));
  }
  return data as Record<string, unknown>;
}

export async function submitPromotionVideo(input: {
  imageUrl: string;
  prompt: string;
  durationSeconds: number;
  title: string;
  shopUsername: string;
  productTitle?: string | null;
  generateAudio: boolean;
}) {
  const url = new URL(input.imageUrl);
  if (url.protocol !== "https:") throw new Error("The selected shop or product image must be an HTTPS URL.");
  const creativePrompt = [
    input.prompt,
    `Create a polished, premium ecommerce advertisement for ${input.productTitle ? `the product "${input.productTitle}"` : `the Instagram shop @${input.shopUsername}`}.`,
    "Preserve the real product's identity, shape, colors, label and packaging. Do not invent product features, prices, discounts, logos, or on-screen text.",
    "Use smooth cinematic camera movement, attractive commercial lighting, clean composition, realistic motion, and a clear visual ending suitable for a call to action.",
  ].join(" ");
  const data = await falFetch("", {
    method: "POST",
    body: JSON.stringify({
      start_image_url: input.imageUrl,
      prompt: creativePrompt.slice(0, 2400),
      duration: String(Math.min(15, Math.max(3, input.durationSeconds))),
      generate_audio: input.generateAudio,
      negative_prompt: "blurry, distorted product, warped packaging, extra objects, illegible text, watermark, low quality",
    }),
  });
  const requestId = typeof data.request_id === "string" ? data.request_id : typeof data.requestId === "string" ? data.requestId : null;
  if (!requestId) throw new Error("Video provider did not return a generation request ID.");
  return { requestId, provider: "fal.ai/kling-video-v3-pro" };
}

export async function getPromotionVideoStatus(requestId: string) {
  return falFetch(`/requests/${encodeURIComponent(requestId)}/status?logs=0`);
}

export async function getPromotionVideoResult(requestId: string) {
  return falFetch(`/requests/${encodeURIComponent(requestId)}`);
}
