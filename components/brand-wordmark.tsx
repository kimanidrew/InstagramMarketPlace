const DEFAULT_NAME = "SokoLink";
const DEFAULT_START = "#00C2A8";
const DEFAULT_END = "#7C3AED";
const DEFAULT_FONT = "Plus Jakarta Sans";

function safeColor(value: string | undefined, fallback: string) {
  return value && /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : fallback;
}

export function BrandWordmark() {
  const name = process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || DEFAULT_NAME;
  const start = safeColor(process.env.NEXT_PUBLIC_BRAND_COLOR_START, DEFAULT_START);
  const end = safeColor(process.env.NEXT_PUBLIC_BRAND_COLOR_END, DEFAULT_END);
  const font = (process.env.NEXT_PUBLIC_BRAND_FONT_FAMILY || DEFAULT_FONT).replace(/[^a-zA-Z0-9 -]/g, "").trim() || DEFAULT_FONT;
  return (
    <span
      className="brand-wordmark"
      style={{ backgroundImage: `linear-gradient(105deg, ${start}, ${end})`, fontFamily: `"${font}", sans-serif`, fontStyle: "normal", fontWeight: 900 }}
    >
      {name}
    </span>
  );
}
