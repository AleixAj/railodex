export function money(value: number | string | null | undefined, currency = "EUR") {
  if (value === null || value === undefined || value === "") return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    Number(value),
  );
}

export function shortDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(`${value.slice(0, 10)}T12:00:00`),
  );
}

export function longToday() {
  return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
}

/** Porcentaje de campos útiles rellenos, para el indicador "ficha completa". */
export function completeness(item: {
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
}, photoCount = 0) {
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
