"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { remainingSlots, LIMIT_MESSAGE } from "@/lib/plan";
import { CONDITIONS, KINDS, SCALES, STATUSES, TRACTIONS } from "@/lib/catalog";
import type { ItemDetails } from "@/lib/types";

export type ItemPayload = {
  kind: string;
  traction: string | null;
  system: string | null;
  name: string;
  manufacturer: string;
  catalog_ref: string;
  scale: string;
  epoch: string;
  railway: string;
  road_number: string;
  dcc_address: string;
  condition: string;
  status: string;
  purchase_price: string;
  estimated_value: string;
  purchase_date: string;
  location: string;
  tags: string;
  notes: string;
  details: ItemDetails;
};

const text = (v: string, max = 200) => {
  const t = (v ?? "").trim().slice(0, max);
  return t === "" ? null : t;
};
const num = (v: string) => {
  const t = (v ?? "").replace(",", ".").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

export async function saveItem(payload: ItemPayload, itemId?: string): Promise<{ id?: string; error?: string }> {
  const { supabase } = await requireUser();

  if (!itemId && (await remainingSlots(supabase)) === 0) return { error: LIMIT_MESSAGE };
  if (!KINDS.some((k) => k.id === payload.kind)) return { error: "Elige el tipo de pieza." };
  if (!text(payload.manufacturer)) return { error: "Falta el fabricante." };
  if (!SCALES.some((s) => s.id === payload.scale)) return { error: "Falta la escala." };
  if (payload.traction && !TRACTIONS.some((t) => t.id === payload.traction)) return { error: "Tracción no válida." };
  if (payload.system && !["digital", "analogico"].includes(payload.system)) return { error: "Sistema no válido." };
  if (payload.condition && !CONDITIONS.some((c) => c.id === payload.condition)) return { error: "Estado no válido." };
  if (!STATUSES.some((s) => s.id === payload.status)) return { error: "Estado de propiedad no válido." };

  const price = num(payload.purchase_price);
  const value = num(payload.estimated_value);
  const address = payload.system === "digital" ? num(payload.dcc_address) : null;
  if (Number.isNaN(price) || Number.isNaN(value)) return { error: "Revisa los precios: tienen que ser números." };
  if (Number.isNaN(address) || (address !== null && (address < 1 || address > 10239 || !Number.isInteger(address)))) {
    return { error: "La dirección digital tiene que ser un número entre 1 y 10239." };
  }
  if (payload.purchase_date && !/^\d{4}-\d{2}-\d{2}$/.test(payload.purchase_date)) return { error: "Fecha de compra no válida." };

  const name =
    text(payload.name) ??
    ([text(payload.railway), text(payload.road_number)].filter(Boolean).join(" ") ||
      [text(payload.manufacturer), text(payload.catalog_ref)].filter(Boolean).join(" "));

  const row = {
    kind: payload.kind,
    traction: payload.kind === "locomotora" || payload.kind === "automotor" ? payload.traction || null : null,
    system: payload.kind === "locomotora" || payload.kind === "automotor" ? payload.system || null : null,
    name,
    manufacturer: text(payload.manufacturer)!,
    catalog_ref: text(payload.catalog_ref, 60),
    scale: payload.scale,
    epoch: text(payload.epoch, 10),
    railway: text(payload.railway, 60),
    road_number: text(payload.road_number, 60),
    dcc_address: address,
    condition: text(payload.condition),
    status: payload.status,
    purchase_price: price,
    estimated_value: value,
    purchase_date: text(payload.purchase_date),
    location: text(payload.location),
    tags: payload.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20),
    notes: text(payload.notes, 4000),
    details: cleanDetails(payload.details),
  };

  const res = itemId
    ? await supabase.from("items").update(row).eq("id", itemId).select("id").single()
    : await supabase.from("items").insert(row).select("id").single();

  if (res.error || !res.data) return { error: "No se ha podido guardar la pieza. Inténtalo de nuevo." };
  revalidatePath("/", "layout");
  return { id: res.data.id };
}

/** Quita valores vacíos para no guardar basura en el jsonb. */
function cleanDetails(d: ItemDetails): ItemDetails {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(d ?? {})) {
    if (v === undefined || v === null || v === "") continue;
    if (typeof v === "string") out[k] = v.trim().slice(0, 200);
    else if (Array.isArray(v)) out[k] = v.filter((f) => f && typeof f.key === "string" && f.label?.trim()).slice(0, 69);
    else out[k] = v;
  }
  return out as ItemDetails;
}
