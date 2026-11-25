const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Guards ids taken from the URL before they reach a query. */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}
