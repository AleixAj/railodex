import type { SupabaseClient } from "@supabase/supabase-js";
import { compressImage } from "./compress";

const BUCKET = "item-photos";

type Kept = { id: string; path: string };

/**
 * Brings the item's photos in line with what the user left in the form:
 * deletes the removed ones, saves the order, uploads the new ones.
 * Returns how many uploads failed so the caller can say so.
 */
export async function syncPhotos(
  supabase: SupabaseClient,
  {
    userId,
    itemId,
    before,
    kept,
    added,
  }: { userId: string; itemId: string; before: Kept[]; kept: Kept[]; added: File[] },
) {
  const removed = before.filter((p) => !kept.some((k) => k.id === p.id));
  if (removed.length) {
    await supabase
      .from("item_photos")
      .delete()
      .in(
        "id",
        removed.map((p) => p.id),
      );
    await supabase.storage.from(BUCKET).remove(removed.map((p) => p.path));
  }

  for (const [position, p] of kept.entries()) {
    await supabase.from("item_photos").update({ position }).eq("id", p.id);
  }

  let failed = 0;
  for (const [i, file] of added.entries()) {
    try {
      const blob = await compressImage(file);
      const path = `${userId}/${itemId}/${crypto.randomUUID()}.webp`;
      const upload = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/webp" });
      if (upload.error) throw upload.error;
      const row = await supabase.from("item_photos").insert({ item_id: itemId, path, position: kept.length + i });
      if (row.error) throw row.error;
    } catch {
      failed++;
    }
  }
  return failed;
}
