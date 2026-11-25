import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/redirects";

const PUBLIC_PATHS = ["/login", "/auth"];

/** Refreshes the session on every request and sends logged-out users to /login. */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => supabaseResponse.headers.set(key, value));
        },
      },
    },
  );

  // Don't put anything between createServerClient and getClaims, or sessions can drop randomly.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!signedIn && !isPublic) {
    // Remember where they were going (e.g. a QR label) so login can take them back there.
    const next = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
    return redirectKeepingCookies(request, `/login${next}`, supabaseResponse);
  }
  if (signedIn && pathname === "/login") {
    return redirectKeepingCookies(request, safeNext(request.nextUrl.searchParams.get("next")), supabaseResponse);
  }

  return supabaseResponse;
}

function redirectKeepingCookies(request: NextRequest, target: string, from: NextResponse) {
  const res = NextResponse.redirect(new URL(target, request.url));
  from.cookies.getAll().forEach((c) => res.cookies.set(c));
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header);
    if (value) res.headers.set(header, value);
  }
  return res;
}
