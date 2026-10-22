import { NextResponse, type NextRequest } from "next/server";
import { PROFILE_COOKIE, SESSION_COOKIE, verifyProfileToken, verifySessionToken } from "@/lib/jwt";

// Routes anyone can open. /admin has its own password gate inside the page and its actions;
// /api/cron checks the CRON_SECRET bearer token that Vercel Cron sends.
const PUBLIC = ["/login", "/unirse", "/recuperar", "/admin", "/salir", "/api/cron"];

const isPublic = (pathname: string) => PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));

function redirectTo(request: NextRequest, path: string, next?: string) {
  const url = new URL(path, request.url);
  if (next && next !== "/") url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

// Optimistic gate, in three steps: signed in → has a home → picked a profile. Data reads and Server
// Actions verify the session again on their own (a cookie here only says "looks signed").
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const profile = session?.homeId ? await verifyProfileToken(request.cookies.get(PROFILE_COOKIE)?.value) : null;
  const hasProfile = !!session?.homeId && profile?.homeId === session.homeId;
  const home = !session?.homeId ? "/bienvenida" : hasProfile ? "/" : "/perfiles";

  // Signed in already: sign-in and invite links go straight on, keeping the invite code for step 2.
  const isSignUp = pathname === "/unirse" || pathname.startsWith("/unirse/");
  if (session && (pathname === "/login" || isSignUp)) {
    const code = isSignUp ? pathname.split("/")[2] : request.nextUrl.searchParams.get("codigo");
    const url = new URL(home, request.url);
    if (code && !session.homeId) url.searchParams.set("codigo", code);
    return NextResponse.redirect(url);
  }
  if (pathname === "/login") return NextResponse.next();
  if (isPublic(pathname)) return NextResponse.next();

  if (!session) return redirectTo(request, "/login", pathname + search);
  // Step 2 (create or join a home) decides on its own what to show.
  if (pathname === "/bienvenida") return NextResponse.next();
  if (!session.homeId) return redirectTo(request, "/bienvenida");
  if (pathname === "/perfiles") return NextResponse.next();
  if (!hasProfile) return redirectTo(request, "/perfiles", pathname + search);
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|opengraph-image|twitter-image|logos/|robots.txt).*)"],
};
