import "server-only";

const EXCLUDED_TAGS = new Set([
  "instamart",
  "instagrammarket",
  "instagrammarketplace",
  "nairobi",
  "kenya",
  "kenyan",
  "sale",
  "salealert",
  "shopnow",
  "buy now",
  "dm",
  "order",
  "delivery",
  "follow",
  "followme",
  "explore",
  "explorepage",
  "viral",
  "trending",
  "reels",
  "reelitfeelit",
]);

type ClassifiedTag = { name: string; type: "PRODUCT" | "CATEGORY" };

function normalizeTag(value: string) {
  return value.trim().toLowerCase().replace(/^#+/, "").replace(/[^a-z0-9_-]+/g, "");
}

export async function classifyProductTags(
  hashtags: string[],
  productTitle: string,
  caption: string,
): Promise<ClassifiedTag[]> {
  const candidates = [...new Set(hashtags.map(normalizeTag))]
    .filter(Boolean)
    .filter((tag) => !EXCLUDED_TAGS.has(tag));

  if (!candidates.length) return [];

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return [];
  }

  const model = process.env.OPENAI_TAG_MODEL || "gpt-6-luna";
  const prompt = [
    "You classify Instagram hashtags for a shopping marketplace.",
    "Keep ONLY hashtags that describe the product itself or its product category.",
    "Reject location, country, city, marketing, engagement, seasonal, generic, or marketplace hashtags.",
    "Classify kept hashtags as PRODUCT or CATEGORY.",
    "Return JSON only in exactly this shape: {"tags":[{"name":"...","type":"PRODUCT"|"CATEGORY"}]}",
    "Use lowercase names without #. Do not invent tags.",
    "",
    "Product title: " + productTitle,
    "Caption: " + caption.slice(0, 3000),
    "Candidate hashtags: " + candidates.map((x) => "#" + x).join(" "),
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: prompt,
        max_output_tokens: 500,
      }),
      cache: "no-store",
    });

    if (!response.ok) return [];

    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };

    const raw =
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content || [])
        .find((item) => item.type === "output_text")?.text ||
      "";

    const parsed = JSON.parse(raw) as { tags?: Array<{ name?: string; type?: string }> };
    const allowed = new Set(candidates);

    return (parsed.tags || [])
      .map((tag) => ({
        name: normalizeTag(tag.name || ""),
        type: tag.type === "CATEGORY" ? "CATEGORY" as const : "PRODUCT" as const,
      }))
      .filter((tag) => allowed.has(tag.name))
      .filter((tag) => !EXCLUDED_TAGS.has(tag.name))
      .slice(0, 8);
  } catch {
    return [];
  }
}
