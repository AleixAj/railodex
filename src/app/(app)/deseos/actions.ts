"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { parseAmount } from "@/lib/numbers";
import { isISODate, TIME_ZONE, todayISO } from "@/lib/dates";
import { remainingSlots, LIMIT_MESSAGE } from "@/lib/plan";
import { KINDS, SCALES } from "@/lib/catalog";

// `values` goes back on errors so the dialog can refill itself (React clears forms after submitting).
export type WishState = { error?: string; ok?: number; values?: Record<string, string> };

const FIELDS = [
  "name",
  "kind",
  "manufacturer",
  "catalog_ref",
  "scale",
  "railway",
  "priority",
  "target_price",
  "shop",
  "url",
  "status",
  "deposit",
  "expected_date",
  "notes",
];

const text = (v: FormDataEntryValue | null, max = 200) => {
  const t = String(v ?? "")
    .trim()
    .slice(0, max);
  return t || null;
};
const num = (v: FormDataEntryValue | null) => parseAmount(String(v ?? ""));

function isWebUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function saveWish(prev: WishState, fd: FormData): Promise<WishState> {
  const result = await validateAndSave(fd);
  if (result.error) return { ...result, values: Object.fromEntries(FIELDS.map((f) => [f, String(fd.get(f) ?? "")])) };
  return result;
}

async function validateAndSave(fd: FormData): Promise<WishState> {
  const id = text(fd.get("id"), 40);
  const name = text(fd.get("name"));
  if (!name) return { error: "Escribe qué pieza quieres." };
  const kind = text(fd.get("kind"));
  if (kind && !KINDS.some((k) => k.id === kind)) return { error: "Tipo no válido." };
  const scale = text(fd.get("scale"));
  if (scale && !SCALES.some((s) => s.id === scale)) return { error: "Escala no válida." };
  const priority = Number(fd.get("priority") ?? 2);
  if (![1, 2, 3].includes(priority)) return { error: "Prioridad no válida." };
  const status = fd.get("status") === "reservada" ? "reservada" : "deseo";
  const target_price = num(fd.get("target_price"));
  const deposit = num(fd.get("deposit"));
  if (Number.isNaN(target_price) || Number.isNaN(deposit))
    return { error: "Revisa los precios: tienen que ser números." };
  const url = text(fd.get("url"), 500);
  if (url && !isWebUrl(url)) return { error: "El enlace tiene que ser una dirección web (https://…)." };
  const expected_date = text(fd.get("expected_date"), 10);
  if (expected_date && !isISODate(expected_date)) return { error: "Fecha no válida." };

  const row = {
    name,
    kind,
    manufacturer: text(fd.get("manufacturer"), 80),
    catalog_ref: text(fd.get("catalog_ref"), 60),
    scale,
    railway: text(fd.get("railway"), 60),
    priority,
    target_price,
    shop: text(fd.get("shop"), 120),
    url,
    status,
    deposit: status === "reservada" ? deposit : null,
    expected_date: status === "reservada" ? expected_date : null,
    notes: text(fd.get("notes"), 2000),
  };

  const { supabase } = await requireUser();
  const { error } = id
    ? await supabase.from("wishes").update(row).eq("id", id)
    : await supabase.from("wishes").insert(row);
  if (error) return { error: "No se ha podido guardar." };
  revalidatePath("/deseos");
  return { ok: Date.now() };
}

export async function deleteWish(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("wishes").delete().eq("id", id);
  revalidatePath("/deseos");
}

/** The piece has arrived: create it in the collection with what we know, then open the editor to fill in the rest. */
export async function wishToCollection(id: string) {
  const { supabase } = await requireUser();
  const { data: w } = await supabase.from("wishes").select("*").eq("id", id).maybeSingle();
  if (!w) return { error: "No se encuentra el deseo." };
  if (!w.manufacturer || !w.scale || !w.kind) {
    return { error: "Para pasarla a la colección indica antes el tipo, el fabricante y la escala." };
  }
  if ((await remainingSlots(supabase)) === 0) return { error: LIMIT_MESSAGE };
  const { data: item, error } = await supabase
    .from("items")
    .insert({
      kind: w.kind,
      name: w.name,
      manufacturer: w.manufacturer,
      catalog_ref: w.catalog_ref,
      scale: w.scale,
      railway: w.railway,
      status: "coleccion",
      purchase_price: w.target_price,
      purchase_date: todayISO(TIME_ZONE),
      notes: w.notes,
      details: w.shop ? { seller: w.shop } : {},
    })
    .select("id")
    .single();
  if (error || !item) return { error: "No se ha podido crear la pieza." };
  await supabase.from("wishes").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect(`/coleccion/${item.id}/editar`);
}
