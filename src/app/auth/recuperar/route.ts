import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** The "forgot password" email links here: log the user in and send them to pick a new password. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/ajustes?recuperar=1#contrasena`);
  }
  return NextResponse.redirect(`${origin}/login?error=enlace`);
}
