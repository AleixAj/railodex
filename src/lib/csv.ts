// CSV in and out. We use ";" because that's what Excel expects with Spanish
// regional settings, and add a BOM so accents open correctly.

import type { Item } from "./types";
import { CONDITIONS, KINDS, labelOf } from "./catalog";

/** Columns shared by export and import, so a file we export can be imported back. */
export const COLUMNS = [
  { header: "Nombre", key: "name" },
  { header: "Tipo", key: "kind" },
  { header: "Fabricante", key: "manufacturer" },
  { header: "Referencia", key: "catalog_ref" },
  { header: "Escala", key: "scale" },
  { header: "Compañía", key: "railway" },
  { header: "Época", key: "epoch" },
  { header: "Matrícula", key: "road_number" },
  { header: "Sistema", key: "system" },
  { header: "Dirección", key: "dcc_address" },
  { header: "Estado", key: "condition" },
  { header: "Precio compra", key: "purchase_price" },
  { header: "Fecha compra", key: "purchase_date" },
  { header: "Valor estimado", key: "estimated_value" },
  { header: "Ubicación", key: "location" },
  { header: "Notas", key: "notes" },
] as const;

export type ColumnKey = (typeof COLUMNS)[number]["key"];

function escape(value: unknown) {
  const s = value === null || value === undefined ? "" : String(value);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function itemsToCsv(items: Item[]) {
  const lines = [COLUMNS.map((c) => c.header).join(";")];
  for (const item of items) {
    lines.push(
      COLUMNS.map((c) => {
        if (c.key === "kind") return escape(labelOf(KINDS, item.kind));
        if (c.key === "condition") return escape(labelOf(CONDITIONS, item.condition));
        if (c.key === "system") return escape(item.system === "digital" ? "Digital" : item.system === "analogico" ? "Analógico" : "");
        const v = item[c.key];
        // Excel reads "289.5" as text with Spanish settings, so use a comma.
        if (typeof v === "number" && !Number.isInteger(v)) return escape(String(v).replace(".", ","));
        return escape(v);
      }).join(";"),
    );
  }
  return "﻿" + lines.join("\r\n");
}

/** Small CSV parser: handles quotes, escaped quotes and both ";" and "," separators. */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const sep = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === sep) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

// A few alternative names people tend to use in their own spreadsheets.
const ALIASES: Record<string, ColumnKey> = {
  marca: "manufacturer",
  ref: "catalog_ref",
  modelo: "name",
  compania: "railway",
  operador: "railway",
  numero: "road_number",
  precio: "purchase_price",
  fecha: "purchase_date",
  valor: "estimated_value",
  ubicacion: "location",
  direccion: "dcc_address",
};

/** Works out which column of the file goes to which field. Unknown headers are ignored. */
export function mapHeaders(headers: string[]): (ColumnKey | null)[] {
  return headers.map((h) => {
    const n = normalize(h);
    const exact = COLUMNS.find((c) => normalize(c.header) === n);
    return exact?.key ?? ALIASES[n] ?? null;
  });
}
