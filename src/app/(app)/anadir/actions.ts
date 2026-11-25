"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { remainingSlots, LIMIT_MESSAGE } from "@/lib/plan";
import { CONDITIONS, EPOCHS, KINDS, SCALES, STATUSES, TRACTIONS } from "@/lib/catalog";
import { sanitizeDetails } from "@/lib/details";
import { parseAmount } from "@/lib/numbers";
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
  if (payload.epoch && !(EPOCHS as readonly string[]).includes(payload.epoch)) return { error: "Época no válida." };

  // Coaches, wagons and accessories have no traction, decoder or address.
  const tractor = payload.kind === "locomotora" || payload.kind === "automotor";
  const traction = tractor ? payload.traction || null : null;
  const system = tractor ? payload.system || null : null;

  const price = parseAmount(payload.purchase_price);
  const value = parseAmount(payload.estimated_value);
  const address = system === "digital" && payload.dcc_address.trim() ? Number(payload.dcc_address) : null;
  if (Number.isNaN(price) || Number.isNaN(value)) return { error: "Revisa los precios: tienen que ser números." };
  if (Number.isNaN(address) || (address !== null && (address < 1 || address > 10239 || !Number.isInteger(address)))) {
    return { error: "La dirección digital tiene que ser un número entre 1 y 10239." };
  }
  if (payload.purchase_date && !/^\d{4}-\d{2}-\d{2}$/.test(payload.purchase_date))
    return { error: "Fecha de compra no válida." };

  const name =
    text(payload.name) ??
    ([text(payload.railway), text(payload.road_number)].filter(Boolean).join(" ") ||
      [text(payload.manufacturer), text(payload.catalog_ref)].filter(Boolean).join(" "));

  const row = {
    kind: payload.kind,
    traction,
    system,
    name,
    manufacturer: text(payload.manufacturer)!,
    catalog_ref: text(payload.catalog_ref, 60),
    scale: payload.scale,
    epoch: payload.epoch || null,
    railway: text(payload.railway, 60),
    road_number: text(payload.road_number, 60),
    dcc_address: address,
    condition: text(payload.condition),
    status: payload.status,
    purchase_price: price,
    estimated_value: value,
    purchase_date: text(payload.purchase_date),
    location: text(payload.location),
    tags: [
      ...new Set(
        payload.tags
          .split(",")
          .map((t) => t.trim().slice(0, 40))
          .filter(Boolean),
      ),
    ].slice(0, 20),
    notes: text(payload.notes, 4000),
    details: sanitizeDetails(payload.details, { kind: payload.kind, traction, system }),
  };

  const res = itemId
    ? await supabase.from("items").update(row).eq("id", itemId).select("id").single()
    : await supabase.from("items").insert(row).select("id").single();

  if (res.error || !res.data) return { error: "No se ha podido guardar la pieza. Inténtalo de nuevo." };
  revalidatePath("/", "layout");
  return { id: res.data.id };
}
