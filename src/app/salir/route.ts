import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";

// Landing spot for a signed-in browser whose home no longer exists (deleted by the admin or the
// inactivity cleanup): drops the stale cookies so /login doesn't bounce back into the app.
export async function GET(request: Request) {
  await deleteSession();
  return NextResponse.redirect(new URL("/login", request.url));
}
