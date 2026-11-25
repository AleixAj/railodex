import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Aquí llega el enlace del email de confirmación: cambia el código por una sesión. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
    // Supabase solo manda `code` cuando el email ya se ha verificado. Si el cambio por sesión
    // falla (p. ej. el enlace se abrió en otro navegador), la cuenta está confirmada igualmente.
    return NextResponse.redirect(`${origin}/login?confirmado=1`);
  }
  return NextResponse.redirect(`${origin}/login?error=enlace`);
}
