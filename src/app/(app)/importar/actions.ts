"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { remainingSlots, LIMIT_MESSAGE } from "@/lib/plan";
import { toItemRow, type ImportRow } from "@/lib/import-row";

export type ImportResult = { error?: string; imported?: number; skipped?: number };

export async function importItems(rows: ImportRow[]): Promise<ImportResult> {
  if (rows.length === 0) return { error: "El archivo no tiene filas." };
  if (rows.length > 1000) return { error: "Importa como mucho 1.000 filas cada vez." };

  const { supabase } = await requireUser();
  const valid = rows.map(toItemRow).filter((r) => r !== null);
  if (valid.length === 0) return { error: "Ninguna fila tiene fabricante y escala, que son obligatorios." };

  const slots = await remainingSlots(supabase);
  if (slots === 0) return { error: LIMIT_MESSAGE };
  const toInsert = valid.slice(0, slots);

  const { error } = await supabase.from("items").insert(toInsert);
  if (error) return { error: "No se ha podido importar. Revisa el archivo e inténtalo otra vez." };

  revalidatePath("/", "layout");
  return { imported: toInsert.length, skipped: rows.length - toInsert.length };
}
