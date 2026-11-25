import "server-only";
import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseEnv } from "./env";

/** Supabase client for the server. Make a new one per request. */
export async function createClient() {
  const cookieStore = await cookies();

  const { url, key } = supabaseEnv();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components can't set cookies. That's fine, the proxy refreshes the session.
        }
      },
    },
  });
}

/**
 * Gets the client plus the verified user, or redirects to /login.
 * Wrapped in cache() so the layout and the page share one check per request.
 */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/login");
  return {
    supabase,
    userId: claims.sub,
    email: (claims.email as string | undefined) ?? "",
    name: ((claims.user_metadata as { name?: string } | undefined)?.name ?? "").trim(),
  };
});
