import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ItemPhoto } from "./types";

export const PHOTO_BUCKET = "item-photos";

/** Returns { itemId: cover photo url }. Signed URLs, valid for an hour. */
export async function coverUrls(supabase: SupabaseClient, itemIds: string[]) {
  const firstByItem = new Map<string, string>();
  // The ids go in the URL, so ask in batches; one big list breaks after a few hundred pieces.
  for (const ids of chunks(itemIds, 100)) {
    const { data: photos } = await supabase
      .from("item_photos")
      .select("item_id, path, position")
      .in("item_id", ids)
      .order("position", { ascending: true });
    for (const p of (photos ?? []) as Pick<ItemPhoto, "item_id" | "path">[]) {
      if (!firstByItem.has(p.item_id)) firstByItem.set(p.item_id, p.path);
    }
  }
  return signPaths(supabase, firstByItem);
}

function chunks<T>(list: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export async function photoUrls(supabase: SupabaseClient, photos: ItemPhoto[]) {
  const map = new Map(photos.map((p) => [p.id, p.path]));
  return signPaths(supabase, map);
}

async function signPaths(supabase: SupabaseClient, byKey: Map<string, string>) {
  const paths = [...byKey.values()];
  if (paths.length === 0) return {} as Record<string, string>;
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60 * 60);
  const urlByPath = new Map((data ?? []).filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
  const result: Record<string, string> = {};
  for (const [key, path] of byKey) {
    const url = urlByPath.get(path);
    if (url) result[key] = url;
  }
  return result;
}
