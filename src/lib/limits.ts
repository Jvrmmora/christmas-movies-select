// Single source of truth for every cap that protects the database and the external APIs.

export const LIMITS = {
  profilesPerHome: 8,
  moviesPerHome: 150,
  /** Homes without activity for this long are deleted by the weekly cleanup. */
  inactiveHomeDays: 365,
} as const;

export interface RateRule {
  max: number;
  windowMs: number;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const RATE_RULES = {
  /** Wrong passwords per IP + home slug. */
  login: { max: 5, windowMs: 15 * MINUTE },
  /** Wrong recovery codes per IP + home slug. */
  recovery: { max: 5, windowMs: 15 * MINUTE },
  /** Homes created per IP: anyone can sign up, so this keeps one person from filling the database. */
  signup: { max: 3, windowMs: 24 * HOUR },
  /** JustWatch / OMDb lookups per home (OMDb's free key is small). */
  search: { max: 30, windowMs: HOUR },
} satisfies Record<string, RateRule>;

export const DEFAULT_HOME_CAP = 200;

/** Maximum number of homes; HOME_CAP overrides the default when it is a non-negative integer. */
export function homeCap(raw: string | undefined = process.env.HOME_CAP): number {
  if (raw === undefined || raw.trim() === "") return DEFAULT_HOME_CAP;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : DEFAULT_HOME_CAP;
}

/** Homes whose last activity is before this are removed by the weekly cleanup. */
export function inactiveCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - LIMITS.inactiveHomeDays * 24 * 60 * 60 * 1000);
}
