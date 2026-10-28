export type PromotionScope = "PRODUCT" | "STORE";
export type PromotionMode = "MOTION" | "HYBRID" | "CINEMATIC";
export type PromotionFormat = "VERTICAL" | "SQUARE" | "LANDSCAPE";

export const DEFAULT_PROMOTION_PROMPT =
  "Create a stylish, premium promotion that highlights the product clearly and ends with a strong call to action.";

export const FORMAT_DIMENSIONS: Record<PromotionFormat, { width: number; height: number }> = {
  VERTICAL: { width: 1080, height: 1920 },
  SQUARE: { width: 1080, height: 1080 },
  LANDSCAPE: { width: 1920, height: 1080 },
};

export const ALLOWED_DURATIONS = [10, 15, 30] as const;
export const MAX_PROMPT_LENGTH = 1600;

export function isPromotionScope(value: unknown): value is PromotionScope {
  return value === "PRODUCT" || value === "STORE";
}

export function isPromotionMode(value: unknown): value is PromotionMode {
  return value === "MOTION" || value === "HYBRID" || value === "CINEMATIC";
}

export function isPromotionFormat(value: unknown): value is PromotionFormat {
  return value === "VERTICAL" || value === "SQUARE" || value === "LANDSCAPE";
}

export function validatePrompt(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const prompt = value.trim();
  if (!prompt || prompt.length > MAX_PROMPT_LENGTH) return null;
  return prompt;
}
