/**
 * Reads an amount the way people type it in Spain: "289", "289,50", "1.289,50",
 * and also "289.50". Returns null for an empty field and NaN when it isn't a number.
 */
export function parseAmount(raw: string | null | undefined): number | null {
  const t = (raw ?? "").replace(/[€\s]/g, "");
  if (!t) return null;
  let normalised = t;
  if (t.includes(",")) {
    normalised = t.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    // "1.289" is a thousands separator, not a decimal point.
    normalised = t.replace(/\./g, "");
  }
  const n = Number(normalised);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
}
