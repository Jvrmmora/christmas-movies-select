import { formatRuntime } from "./format";

/** The reminder goes out once a day, so it can't wait on a slow list: at most this many e-mails per run. Brevo's free plan allows 300 a day. */
export const MAX_REMINDERS_PER_RUN = 250;

/** The day a run is about (YYYY-MM-DD, UTC). The cron fires at 13:00 UTC, which is the same calendar day across the Americas and Spain. */
export function reminderDateKey(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
}

/** «2019 · 1 h 38 min · Comedia, Familia»: the line under the title in the e-mail. */
export function movieSummary(movie: { year: number; runtimeMinutes?: number | null; genres?: string[] }): string {
  return [movie.year || "", formatRuntime(movie.runtimeMinutes), (movie.genres ?? []).slice(0, 2).join(", ")].filter(Boolean).join(" · ");
}

/** The poster goes in as an image, so only https: mail apps drop plain http images or warn about them. */
export function safeImageUrl(url: string | null | undefined): string | null {
  return url && /^https:\/\//i.test(url) ? url : null;
}

/** Only web links go into the e-mail button: the offer URL comes from a third party. */
export function safeWebUrl(url: string | null | undefined): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null;
}
