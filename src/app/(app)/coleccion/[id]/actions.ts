"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
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

export type EventState = { error?: string; ok?: number };

export async function addEvent(itemId: string, prev: EventState, formData: FormData): Promise<EventState> {
  const { supabase } = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "mantenimiento");
  const happened_on = String(formData.get("happened_on") ?? "") || new Date().toISOString().slice(0, 10);
  const costRaw = String(formData.get("cost") ?? "").replace(",", ".").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!title) return { error: "Escribe qué se ha hecho." };
  if (!EVENT_KINDS.some((k) => k.id === kind)) return { error: "Tipo no válido." };
  const cost = costRaw ? Number(costRaw) : null;
  if (cost !== null && (Number.isNaN(cost) || cost < 0)) return { error: "El coste no es un número válido." };

  const { error } = await supabase.from("item_events").insert({ item_id: itemId, title, kind, happened_on, cost, notes });
  if (error) return { error: "No se ha podido guardar." };
  revalidatePath(`/coleccion/${itemId}`);
  return { ok: Date.now() };
}

export async function deleteEvent(itemId: string, eventId: string) {
  const { supabase } = await requireUser();
  await supabase.from("item_events").delete().eq("id", eventId);
  revalidatePath(`/coleccion/${itemId}`);
}
