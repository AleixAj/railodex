// Photo paths and URLs. Files live in the private `item-photos` bucket as
// <user_id>/<item_id>/<uuid>.webp, plus a small <uuid>_t.webp for lists and cards.
// The browser loads them through /foto/..., which checks the session and lets the
// browser cache them for good (a path never changes content, new photos get new uuids).

export const PHOTO_BUCKET = "item-photos";

export type PhotoSize = "thumb" | "full";

export function thumbPath(path: string) {
  return path.replace(/\.webp$/, "_t.webp");
}

export function photoSrc(path: string, size: PhotoSize = "full") {
  return `/foto/${size === "thumb" ? thumbPath(path) : path}`;
}

/** The cover is the photo with the lowest position. */
export function coverSrc(photos: { path: string; position: number }[] | null | undefined, size: PhotoSize = "thumb") {
  if (!photos?.length) return undefined;
  const first = photos.reduce((a, b) => (b.position < a.position ? b : a));
  return photoSrc(first.path, size);
}

type WithPhotos = { id: string; item_photos?: { path: string; position: number }[] | null };

/** { itemId: cover url } for items fetched with `item_photos(path, position)`. */
export function coversOf(items: WithPhotos[], size: PhotoSize = "thumb") {
  const out: Record<string, string> = {};
  for (const item of items) {
    const src = coverSrc(item.item_photos, size);
    if (src) out[item.id] = src;
  }
  return out;
}

/** Every file a photo row owns in storage, for deleting. */
export function storageFiles(path: string) {
  return [path, thumbPath(path)];
}
