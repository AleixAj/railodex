"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { parseAmount } from "@/lib/numbers";
import { isISODate, TIME_ZONE, todayISO } from "@/lib/dates";
import { PHOTO_BUCKET } from "@/lib/items";
import { EVENT_KINDS, STATUSES } from "@/lib/catalog";

export async function deleteItem(itemId: string) {
  const { supabase } = await requireUser();
  const { data: photos } = await supabase.from("item_photos").select("path").eq("item_id", itemId);
  const { error } = await supabase.from("items").delete().eq("id", itemId);
  if (error) return { error: "No se ha podido borrar la pieza." };
  if (photos?.length) await supabase.storage.from(PHOTO_BUCKET).remove(photos.map((p) => p.path));
  revalidatePath("/", "layout");
  redirect("/coleccion");
}

export async function setStatus(itemId: string, status: string) {
  if (!STATUSES.some((s) => s.id === status)) return;
  const { supabase } = await requireUser();
  await supabase.from("items").update({ status }).eq("id", itemId);
  revalidatePath(`/coleccion/${itemId}`);
}

// `values` goes back on errors so the form can refill itself (React clears it after submitting).
export type EventState = { error?: string; ok?: number; values?: Record<string, string> };

export async function addEvent(itemId: string, prev: EventState, formData: FormData): Promise<EventState> {
  const { supabase } = await requireUser();
  const title = String(formData.get("title") ?? "")
    .trim()
    .slice(0, 200);
  const kind = String(formData.get("kind") ?? "mantenimiento");
  const happened_on = String(formData.get("happened_on") ?? "") || todayISO(TIME_ZONE);
  const cost = parseAmount(String(formData.get("cost") ?? ""));
  const notes =
    String(formData.get("notes") ?? "")
      .trim()
      .slice(0, 2000) || null;

  const values = {
    title,
    kind,
    happened_on,
    cost: String(formData.get("cost") ?? ""),
    notes: notes ?? "",
  };
  if (!title) return { values, error: "Escribe qué se ha hecho." };
  if (!EVENT_KINDS.some((k) => k.id === kind)) return { values, error: "Tipo no válido." };
  if (!isISODate(happened_on)) return { values, error: "La fecha no es válida." };
  if (Number.isNaN(cost)) return { values, error: "El coste no es un número válido." };

  const { error } = await supabase
    .from("item_events")
    .insert({ item_id: itemId, title, kind, happened_on, cost, notes });
  if (error) return { values, error: "No se ha podido guardar." };
  revalidatePath(`/coleccion/${itemId}`);
  return { ok: Date.now() };
}

export async function deleteEvent(itemId: string, eventId: string) {
  const { supabase } = await requireUser();
  await supabase.from("item_events").delete().eq("id", eventId);
  revalidatePath(`/coleccion/${itemId}`);
}
