"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { PHOTO_BUCKET, storageFiles } from "@/lib/photos";
import wishes from "./wishes.json";

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
