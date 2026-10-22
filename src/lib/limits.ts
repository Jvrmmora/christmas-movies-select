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
  /** Wrong passwords per IP + e-mail. */
  login: { max: 5, windowMs: 15 * MINUTE },
  /** Wrong invite codes per IP, so nobody can guess their way into a home. */
  join: { max: 5, windowMs: 15 * MINUTE },
  /** "Forgot my password" e-mails requested per IP. */
  resetRequestIp: { max: 5, windowMs: 15 * MINUTE },
  /** …and per address, so nobody can flood someone's inbox. */
  resetRequestEmail: { max: 3, windowMs: HOUR },
  /** Wrong reset codes per IP + address (the code itself also allows a few tries, see reset-code.ts). */
  resetVerify: { max: 5, windowMs: 15 * MINUTE },
  /** Wrong current passwords when changing the e-mail or password, per account. */
  settings: { max: 5, windowMs: 15 * MINUTE },
  /** Accounts created per IP: anyone can sign up, so this keeps one person from filling the database. */
  signup: { max: 3, windowMs: 24 * HOUR },
  /** Homes created per IP (the global HOME_CAP also applies). */
  createHome: { max: 3, windowMs: 24 * HOUR },
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
