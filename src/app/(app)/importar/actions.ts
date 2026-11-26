"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { isLimitError, remainingSlots, LIMIT_MESSAGE } from "@/lib/plan";
import { COLUMNS } from "@/lib/csv";
import { toItemRow, type ImportRow } from "@/lib/import-row";

export type ImportResult = { error?: string; imported?: number; skipped?: number };

const KEYS = COLUMNS.map((c) => c.key);

/** Server actions can be called with anything, so keep only known columns with text values. */
function cleanRow(raw: unknown): ImportRow {
  const out: ImportRow = {};
  if (!raw || typeof raw !== "object") return out;
  for (const key of KEYS) {
    const v = (raw as Record<string, unknown>)[key];
    if (typeof v === "string" || typeof v === "number") out[key] = String(v).slice(0, 5000);
  }
  return out;
}

export async function importItems(input: ImportRow[]): Promise<ImportResult> {
  if (!Array.isArray(input) || input.length === 0) return { error: "El archivo no tiene filas." };
  if (input.length > 1000) return { error: "Importa como mucho 1.000 filas cada vez." };
  const rows = input.map(cleanRow);

  const { supabase } = await requireUser();
  const valid = rows.map(toItemRow).filter((r) => r !== null);
  if (valid.length === 0) return { error: "Ninguna fila tiene fabricante y escala, que son obligatorios." };

  const slots = await remainingSlots(supabase);
  if (slots === 0) return { error: LIMIT_MESSAGE };
  const toInsert = valid.slice(0, slots);

  const { error } = await supabase.from("items").insert(toInsert);
  if (isLimitError(error)) return { error: LIMIT_MESSAGE };
  if (error) return { error: "No se ha podido importar. Revisa el archivo e inténtalo otra vez." };

  revalidatePath("/", "layout");
  return { imported: toInsert.length, skipped: rows.length - toInsert.length };
}
