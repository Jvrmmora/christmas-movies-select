import { filterKey, subscriptionOffers } from "./platforms";
import type { Movie } from "./types";

/** Minutes assumed for a movie without a runtime, same as the dashboard's "por ver". */
export const DEFAULT_RUNTIME = 100;

export interface GenreShare {
  genre: string;
  count: number;
  /** Share of the library with this genre; a movie can have several, so shares don't add up to 100. */
  pct: number;
}

export interface HouseInsights {
  total: number;
  watched: number;
  pending: number;
  watchedPct: number;
  watchedMinutes: number;
  pendingMinutes: number;
  topGenres: GenreShare[];
  /** Everyone who has suggested something (profile ids), most suggestions first. */
  suggesters: { profileId: string; count: number }[];
  /** The subscription service that carries the most of the library. */
  topPlatform: { name: string; count: number; logoUrl?: string } | null;
  /** How many movies carry the heart. */
  favorites: number;
  /** Hearted movies, best rated first. Only the heart makes a favorite; stars just order them. */
  favoriteMovies: Movie[];
  /** Highest own rating (stars only); IMDb breaks ties. */
  topRated: Movie | null;
  /** A short label for the household's taste, from its main genre. */
  tone: string | null;
}

const TONES: Record<string, string> = {
  Romance: "Casa romántica",
  Comedia: "Casa de risas",
  Familia: "Casa familiar",
  Animación: "Casa de animación",
  Fantasía: "Casa de magia",
  Drama: "Casa de grandes dramas",
  Acción: "Casa de acción",
  Música: "Casa de villancicos",
  Terror: "Casa con sangre fría",
  Suspenso: "Casa de suspenso",
  "Ciencia ficción": "Casa del futuro",
};

const byCountThenName = (a: { name: string; count: number }, b: { name: string; count: number }) =>
  b.count - a.count || a.name.localeCompare(b.name, "es");

function tally(keys: Iterable<string>): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort(byCountThenName);
}

function ratingOrder(a: Movie, b: Movie): number {
  return (b.myRating ?? 0) - (a.myRating ?? 0) || (b.ratings.imdb ?? 0) - (a.ratings.imdb ?? 0);
}

export function computeInsights(movies: Movie[]): HouseInsights {
  const total = movies.length;
  const watchedMovies = movies.filter((m) => m.watched);
  const minutes = (list: Movie[]) => list.reduce((sum, m) => sum + (m.runtimeMinutes ?? DEFAULT_RUNTIME), 0);

  const topGenres = tally(movies.flatMap((m) => [...new Set(m.genres)]))
    .slice(0, 5)
    .map(({ name, count }) => ({ genre: name, count, pct: Math.round((count / total) * 100) }));

  // Each movie counts once per service, even when it is offered there under several types.
  const platformNames: string[] = [];
  const logos = new Map<string, string>();
  for (const m of movies) {
    const services = new Map(subscriptionOffers(m.streaming).map((o) => [filterKey(o).key, filterKey(o)] as const));
    for (const { name, logoUrl } of services.values()) {
      platformNames.push(name);
      if (logoUrl) logos.set(name, logoUrl);
    }
  }
  const platforms = tally(platformNames);

  const rated = movies.filter((m) => m.myRating !== null).sort(ratingOrder);
  const favoriteMovies = movies.filter((m) => m.favorite).sort(ratingOrder);

  return {
    total,
    watched: watchedMovies.length,
    pending: total - watchedMovies.length,
    watchedPct: total ? Math.round((watchedMovies.length / total) * 100) : 0,
    watchedMinutes: minutes(watchedMovies),
    pendingMinutes: minutes(movies.filter((m) => !m.watched)),
    topGenres,
    suggesters: tally(movies.flatMap((m) => (m.suggestedBy ? [m.suggestedBy] : []))).map(({ name, count }) => ({ profileId: name, count })),
    topPlatform: platforms[0] ? { ...platforms[0], logoUrl: logos.get(platforms[0].name) } : null,
    favorites: favoriteMovies.length,
    favoriteMovies,
    topRated: rated[0] ?? null,
    tone: topGenres[0] ? (TONES[topGenres[0].genre] ?? "Casa navideña") : null,
  };
}

/** Plain text for the share button: it travels through any chat app. */
export function shareText(insights: HouseInsights, houseName: string): string {
  const lines = [`🎄 ${houseName}: ${insights.tone ?? "Casa navideña"}`];
  lines.push(`${insights.watched} de ${insights.total} películas vistas (${insights.watchedPct} %)`);
  const genres = insights.topGenres.slice(0, 3).map((g) => `${g.genre} ${g.pct} %`);
  if (genres.length) lines.push(`Lo que más vemos: ${genres.join(" · ")}`);
  if (insights.favoriteMovies.length) lines.push(`Favoritas: ${insights.favoriteMovies.slice(0, 3).map((m) => m.title).join(", ")}`);
  if (insights.topRated) lines.push(`Mejor calificada: ${insights.topRated.title}`);
  return lines.join("\n");
}
