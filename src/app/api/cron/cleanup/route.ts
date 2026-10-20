import { createHash, timingSafeEqual } from "node:crypto";
import { deleteHomeCascade, findInactiveHomeIds } from "@/lib/homes";

// Weekly (see vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET` to cron paths.
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const sent = createHash("sha256").update(request.headers.get("authorization") ?? "").digest();
  const expected = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(sent, expected);
}

export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });

  const ids = await findInactiveHomeIds();
  for (const id of ids) await deleteHomeCascade(id);

  return Response.json({ homesDeleted: ids.length });
}
