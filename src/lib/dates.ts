// The app is aimed at Spain for now. Servers run in UTC, so without this "today"
// would be yesterday for anyone using it after 23:00/00:00.
export const TIME_ZONE = "Europe/Madrid";

/** Today as YYYY-MM-DD in the given time zone (the browser's own one if left out). */
export function todayISO(timeZone?: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** True for a real calendar date written as YYYY-MM-DD (rejects 2025-02-30 and the like). */
export function isISODate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
