"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { PHOTO_BUCKET, storageFiles } from "@/lib/photos";

/** Deletes the leftover test pieces (with their photos) in one go, without leaving the page. */
export async function deleteTestPieces(ids: string[]) {
  if (process.env.NODE_ENV === "production" || ids.length === 0) return;
  const { supabase } = await requireUser();
  const { data: photos } = await supabase.from("item_photos").select("path").in("item_id", ids);
  await supabase.from("items").delete().in("id", ids);
  if (photos?.length) await supabase.storage.from(PHOTO_BUCKET).remove(photos.flatMap((p) => storageFiles(p.path)));
  revalidatePath("/", "layout");
}
