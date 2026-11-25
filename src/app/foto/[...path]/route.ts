import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PHOTO_BUCKET } from "@/lib/photos";

const VALID = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}(_t)?\.webp$/i;

/**
 * Serves a photo from the private bucket. The URL never changes, so the browser can
 * keep it in its cache instead of downloading it again on every page like signed URLs did.
 */
export async function GET(_request: NextRequest, { params }: RouteContext<"/foto/[...path]">) {
  const path = (await params).path.join("/");
  if (!VALID.test(path)) return new Response("No encontrada", { status: 404 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  // Photos sit in a folder named after their owner; skip the download for anyone else.
  if (!auth?.claims?.sub || !path.startsWith(`${auth.claims.sub}/`)) {
    return new Response("No encontrada", { status: 404 });
  }

  let { data } = await supabase.storage.from(PHOTO_BUCKET).download(path);
  // Photos uploaded before thumbnails existed only have the full-size file.
  if (!data && path.endsWith("_t.webp")) {
    ({ data } = await supabase.storage.from(PHOTO_BUCKET).download(path.replace(/_t\.webp$/, ".webp")));
  }
  if (!data) return new Response("No encontrada", { status: 404 });

  return new Response(data, {
    headers: {
      "Content-Type": data.type || "image/webp",
      // `private`: it's behind a login, so only the user's own browser may keep it.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
