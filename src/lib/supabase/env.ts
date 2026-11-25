// Fails early with a clear message instead of a confusing error deep inside supabase-js.
// The variables have to be written out in full so Next can inline them in the browser bundle.
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Cópialas en .env.local (mira .env.example).",
    );
  }
  return { url, key };
}
