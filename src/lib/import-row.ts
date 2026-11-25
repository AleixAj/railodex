// Converts spreadsheet rows into rows for the `items` table.
// Plain module so both the preview (browser) and the import (server) use the same rules.

import { CONDITIONS, KINDS, SCALES } from "./catalog";
import type { ColumnKey } from "./csv";

export type ImportRow = Partial<Record<ColumnKey, string>>;

const text = (v: string | undefined, max = 200) => {
  const t = (v ?? "").trim().slice(0, max);
  return t || null;
};

// Accepts "289", "289,50", "1.289,50" and "289.50".
function money(v: string | undefined) {
  const t = (v ?? "").replace(/[€\s]/g, "");
  if (!t) return null;
  const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Accepts 2025-11-18 and 18/11/2025.
function date(v: string | undefined) {
  const t = (v ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
}

function findId<T extends { id: string; label: string }>(list: readonly T[], v: string | undefined) {
  const t = (v ?? "").trim().toLowerCase();
  if (!t) return null;
  return list.find((x) => x.id === t || x.label.toLowerCase() === t || x.label.toLowerCase().startsWith(t))?.id ?? null;
}

/** Turns one spreadsheet row into a row for `items`, or null if the required fields are missing. */
export function toItemRow(r: ImportRow) {
  const manufacturer = text(r.manufacturer, 80);
  const scale = SCALES.find((s) => s.id.toLowerCase() === (r.scale ?? "").trim().toLowerCase())?.id;
  if (!manufacturer || !scale) return null;

  const kind = findId(KINDS, r.kind) ?? "locomotora";
  const system = /digit/i.test(r.system ?? "") ? "digital" : /anal/i.test(r.system ?? "") ? "analogico" : null;
  const address = Number((r.dcc_address ?? "").trim());
  const name =
    text(r.name) ?? ([text(r.railway), text(r.road_number)].filter(Boolean).join(" ") || `${manufacturer} ${r.catalog_ref ?? ""}`.trim());

  return {
    kind,
    name,
    manufacturer,
    catalog_ref: text(r.catalog_ref, 60),
    scale,
    railway: text(r.railway, 60),
    epoch: text(r.epoch, 10)?.toUpperCase() ?? null,
    road_number: text(r.road_number, 60),
    system: kind === "locomotora" || kind === "automotor" ? system : null,
    dcc_address: system === "digital" && Number.isInteger(address) && address >= 1 && address <= 10239 ? address : null,
    condition: findId(CONDITIONS, r.condition),
    purchase_price: money(r.purchase_price),
    purchase_date: date(r.purchase_date),
    estimated_value: money(r.estimated_value),
    location: text(r.location),
    notes: text(r.notes, 4000),
  };
}
