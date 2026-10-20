import "server-only";
import { headers } from "next/headers";

/** Caller's IP for rate-limit keys. On Vercel x-forwarded-for is set by the platform, not by the client. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}
