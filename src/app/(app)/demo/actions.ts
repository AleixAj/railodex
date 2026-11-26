"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { PHOTO_BUCKET, storageFiles } from "@/lib/photos";
import wishes from "./wishes.json";
import compositions from "./compositions.json";
import events from "./events.json";

/** Deletes several pieces (with their photos) in one go, without leaving the page. */
export async function deletePieces(ids: string[]) {
  if (process.env.NODE_ENV === "production" || ids.length === 0) return;
  const { supabase } = await requireUser();
  const { data: photos } = await supabase.from("item_photos").select("path").in("item_id", ids);
  await supabase.from("items").delete().in("id", ids);
  if (photos?.length) await supabase.storage.from(PHOTO_BUCKET).remove(photos.flatMap((p) => storageFiles(p.path)));
  revalidatePath("/", "layout");
}

/** Adds the example wishes and pre-orders that aren't there yet (matched by name). */
export async function seedWishes() {
  if (process.env.NODE_ENV === "production") return;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("wishes").select("name");
  const have = new Set((data ?? []).map((w) => w.name));
  const missing = wishes.filter((w) => !have.has(w.name));
  if (missing.length) await supabase.from("wishes").insert(missing);
  revalidatePath("/", "layout");
}

export async function deleteDemoWishes() {
  if (process.env.NODE_ENV === "production") return;
  const { supabase } = await requireUser();
  await supabase
    .from("wishes")
    .delete()
    .in(
      "name",
      wishes.map((w) => w.name),
    );
  revalidatePath("/", "layout");
}

/** Builds the example trains from the demo pieces already in the collection. */
export async function seedCompositions() {
  if (process.env.NODE_ENV === "production") return;
  const { supabase } = await requireUser();
  const [{ data: items }, { data: existing }] = await Promise.all([
    supabase.from("items").select("id, name"),
    supabase.from("compositions").select("name"),
  ]);
  const idByName = new Map((items ?? []).map((i) => [i.name, i.id]));
  const have = new Set((existing ?? []).map((c) => c.name));
  for (const comp of compositions) {
    const ids = comp.pieces.map((n) => idByName.get(n)).filter((id): id is string => !!id);
    if (have.has(comp.name) || ids.length === 0) continue;
    const { data } = await supabase
      .from("compositions")
      .insert({ name: comp.name, notes: comp.notes })
      .select("id")
      .single();
    if (!data) continue;
    await supabase
      .from("composition_items")
      .insert(ids.map((item_id, position) => ({ composition_id: data.id, item_id, position })));
  }
  revalidatePath("/", "layout");
}

export async function deleteDemoCompositions() {
  if (process.env.NODE_ENV === "production") return;
  const { supabase } = await requireUser();
  await supabase
    .from("compositions")
    .delete()
    .in(
      "name",
      compositions.map((c) => c.name),
    );
  revalidatePath("/", "layout");
}

/** Adds the example history (services, repairs...) to the demo pieces. Deleting a piece takes its history with it. */
export async function seedEvents() {
  if (process.env.NODE_ENV === "production") return;
  const { supabase } = await requireUser();
  const [{ data: items }, { data: existing }] = await Promise.all([
    supabase.from("items").select("id, name"),
    supabase.from("item_events").select("item_id, title"),
  ]);
  const idByName = new Map((items ?? []).map((i) => [i.name, i.id]));
  const have = new Set((existing ?? []).map((e) => `${e.item_id}|${e.title}`));
  const rows = events.flatMap(({ piece, ...event }) => {
    const item_id = idByName.get(piece);
    return item_id && !have.has(`${item_id}|${event.title}`) ? [{ item_id, ...event }] : [];
  });
  if (rows.length) await supabase.from("item_events").insert(rows);
  revalidatePath("/", "layout");
}
