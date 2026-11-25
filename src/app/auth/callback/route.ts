import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** The confirmation email links here. Swaps the one-time code for a session. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
    // Supabase only sends `code` once the email is verified, so even if the exchange fails
    // (e.g. the link was opened in another browser) the account is already confirmed.
    return NextResponse.redirect(`${origin}/login?confirmado=1`);
  }
  return NextResponse.redirect(`${origin}/login?error=enlace`);
}
