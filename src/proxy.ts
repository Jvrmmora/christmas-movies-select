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

// Optimistic gate, in two steps: signed in to a home → picked a profile. Data reads and Server
// Actions verify the session again on their own (a cookie here only says "looks signed").
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const profile = session ? await verifyProfileToken(request.cookies.get(PROFILE_COOKIE)?.value) : null;
  const hasProfile = !!session && profile?.homeId === session.homeId;

  if (pathname === "/login") {
    if (!session) return NextResponse.next();
    return redirectTo(request, hasProfile ? "/" : "/perfiles");
  }
  if (isPublic(pathname)) return NextResponse.next();

  if (!session) return redirectTo(request, "/login", pathname + search);
  if (pathname === "/perfiles") return NextResponse.next();
  if (!hasProfile) return redirectTo(request, "/perfiles", pathname + search);
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|opengraph-image|twitter-image|logos/|robots.txt).*)"],
};
