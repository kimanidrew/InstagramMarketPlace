const DEFAULT_NAME = "Shlip";
const DEFAULT_START = "#D7263D";
const DEFAULT_END = "#241D29";
const DEFAULT_FONT = "Plus Jakarta Sans";

export function BrandWordmark() {
  const name = DEFAULT_NAME;
  const start = DEFAULT_START;
  const end = DEFAULT_END;
  const font = DEFAULT_FONT;
  return (
    <span
      className="brand-wordmark"
      style={{ backgroundImage: `linear-gradient(105deg, ${start}, ${end})`, fontFamily: `"${font}", sans-serif`, fontStyle: "normal", fontWeight: 900 }}
    >
      {name}
    </span>
  );
}
