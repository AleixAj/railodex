import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** Cliente de Supabase para el servidor. Se crea uno nuevo en cada petición. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Desde un Server Component no se pueden escribir cookies;
            // el proxy ya se encarga de refrescar la sesión.
          }
        },
      },
    },
  );
}

/** Devuelve el cliente y el usuario verificado, o manda al login si no hay sesión. */
export async function requireUser() {
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
}
