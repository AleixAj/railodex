import type { SupabaseClient } from "@supabase/supabase-js";
import { PHOTO_BUCKET, storageFiles, thumbPath } from "@/lib/photos";
import { compressImage } from "./compress";

type Kept = { id: string; path: string };

// Two at a time: faster than one by one, and decoding several 12 MP photos at once
// can run a phone out of memory.
const PARALLEL_UPLOADS = 2;

/**
 * Brings the item's photos in line with what the user left in the form:
 * deletes the removed ones, saves the new order, uploads the new ones.
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
  // `before` comes in saved order, so only photos whose index changed need updating.
  const moved = kept.filter((p, index) => before.findIndex((b) => b.id === p.id) !== index);

  await Promise.all([
    removed.length
      ? supabase
          .from("item_photos")
          .delete()
          .in(
            "id",
            removed.map((p) => p.id),
          )
      : null,
    removed.length ? supabase.storage.from(PHOTO_BUCKET).remove(removed.flatMap((p) => storageFiles(p.path))) : null,
    ...moved.map((p) =>
      supabase
        .from("item_photos")
        .update({ position: kept.indexOf(p) })
        .eq("id", p.id),
    ),
  ]);

  let failed = 0;
  const queue = added.map((file, i) => ({ file, position: kept.length + i }));
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const ok = await uploadOne(supabase, `${userId}/${itemId}/${crypto.randomUUID()}.webp`, itemId, job);
      if (!ok) failed++;
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL_UPLOADS, queue.length) }, worker));
  return failed;
}

async function uploadOne(
  supabase: SupabaseClient,
  path: string,
  itemId: string,
  { file, position }: { file: File; position: number },
) {
  try {
    const { full, thumb } = await compressImage(file);
    const bucket = supabase.storage.from(PHOTO_BUCKET);
    const [a, b] = await Promise.all([
      bucket.upload(path, full, { contentType: "image/webp" }),
      bucket.upload(thumbPath(path), thumb, { contentType: "image/webp" }),
    ]);
    if (a.error || b.error) throw a.error ?? b.error;
    const row = await supabase.from("item_photos").insert({ item_id: itemId, path, position });
    if (row.error) throw row.error;
    return true;
  } catch {
    // Don't leave orphan files behind if the database insert failed.
    await supabase.storage.from(PHOTO_BUCKET).remove(storageFiles(path));
    return false;
  }
}
