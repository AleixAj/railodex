import { TIME_ZONE } from "./dates";

/**
 * 289 € / 66,50 € / 1.289 €. Cents only when there are any, and always a thousands
 * dot (Spanish formatting leaves it out on 4-digit numbers otherwise: "1289 €").
 */
export function money(value: number | string | null | undefined, currency = "EUR") {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const cents = !Number.isInteger(Math.round(n * 100) / 100);
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    useGrouping: "always",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(n);
}

export function shortDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(`${value.slice(0, 10)}T12:00:00`),
  );
}

export function longToday() {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
  }).format(new Date());
}

/** Rough percentage of useful fields filled in, for the completeness bar. */
export function completeness(
  item: {
    catalog_ref: string | null;
    epoch: string | null;
    railway: string | null;
    road_number: string | null;
    condition: string | null;
    purchase_price: number | null;
    purchase_date: string | null;
    location: string | null;
    system: string | null;
    details: Record<string, unknown>;
  },
  photoCount = 0,
) {
  const checks = [
    item.catalog_ref,
    item.epoch,
    item.railway,
    item.road_number,
    item.condition,
    item.purchase_price,
    item.purchase_date,
    item.location,
    item.system,
    item.details?.wheelArrangement ?? item.details?.wagonSubtype,
    item.details?.origin,
    photoCount > 0 ? true : null,
  ];
  const filled = checks.filter((v) => v !== null && v !== undefined && v !== "").length;
  return Math.round((filled / checks.length) * 100);
}
