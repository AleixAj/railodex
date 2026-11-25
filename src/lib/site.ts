import "server-only";
import { headers } from "next/headers";

/**
 * The site's public address, for links that leave the app (confirmation emails, QR labels).
 * Set NEXT_PUBLIC_SITE_URL once it's deployed; locally it's worked out from the request.
 */
export async function siteOrigin() {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fixed) return fixed;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
