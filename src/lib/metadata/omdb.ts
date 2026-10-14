import type { Ratings } from "../types";

/** Optional: fills IMDb / Rotten Tomatoes gaps when OMDB_API_KEY is set (free tier, 1,000 req/day). */
export async function omdbRatings(imdbId: string | undefined): Promise<Partial<Ratings> | null> {
  const key = process.env.OMDB_API_KEY;
  if (!key || !imdbId) return null;
  try {
    const res = await fetch(`https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${encodeURIComponent(key)}`, {
      signal: AbortSignal.timeout(6_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { Response: string; imdbRating?: string; Ratings?: { Source: string; Value: string }[] };
    if (json.Response !== "True") return null;
    const imdb = Number.parseFloat(json.imdbRating ?? "");
    const rt = json.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value;
    return {
      imdb: Number.isFinite(imdb) ? imdb : null,
      rottenTomatoes: rt ? Number.parseInt(rt, 10) : null,
    };
  } catch {
    return null;
  }
}
