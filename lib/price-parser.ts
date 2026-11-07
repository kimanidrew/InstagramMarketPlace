export type ParsedPrice = { amount: number; currency: string };

/**
 * Extract only explicitly marked prices. Unmarked numbers are intentionally
 * ignored so phone numbers, years, sizes and quantities are not guessed as prices.
 */
function phoneLike(raw: string, remainder: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 9 || /^\s+\d{3,4}[\s-]\d{3,4}(?:[\s-]\d{2,4})?\b/.test(remainder);
}

export function parseCaptionPrice(caption: string | null | undefined): ParsedPrice | null {
  if (!caption) return null;

  const marker = /(?:\bKES\b|\bKSH\b|\bKsh\b|\bbei\s*:|\bprice\s*:|\/=|\$|@)\s*/gi;
  const number = /(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?\s*k?)/i;
  for (const match of caption.matchAll(marker)) {
    const index = (match.index || 0) + match[0].length;
    const found = number.exec(caption.slice(index));
    if (!found || found.index > 3) continue;
    const raw = found[1].replace(/,/g, "").replace(/\s+/g, "").toLowerCase();
    const remainder = caption.slice(index + found.index + found[0].length);
    if (phoneLike(raw, remainder)) continue;
    const amount = raw.endsWith("k") ? Number(raw.slice(0, -1)) * 1000 : Number(raw);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000) continue;
    if (/^\d{4}$/.test(raw) && amount >= 1900 && amount <= 2099) continue;

    const markerText = match[0].toLowerCase();
    const pricePrefix = caption.slice(index, index + found.index).toLowerCase();
    const currency = markerText.includes("$") || pricePrefix.includes("$") ? "USD" : "KES";
    return { amount, currency };
  }

  const trailingSlashPrice = /(?:^|\s)(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?\s*k?)\s*\/=\s*/gi;
  for (const match of caption.matchAll(trailingSlashPrice)) {
    const raw = match[1].replace(/,/g, "").replace(/\s+/g, "").toLowerCase();
    const remainder = caption.slice((match.index || 0) + match[0].length);
    if (phoneLike(raw, remainder)) continue;
    const amount = raw.endsWith("k") ? Number(raw.slice(0, -1)) * 1000 : Number(raw);
    if (Number.isFinite(amount) && amount > 0 && amount <= 10000000 && !(/^\d{4}$/.test(raw) && Number(raw) >= 1900 && Number(raw) <= 2099)) {
      return { amount, currency: "KES" };
    }
  }
  return null;
}
