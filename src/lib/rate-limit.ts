import type { RateRule } from "./limits";

// Fixed-window limiter over a pluggable store. Production uses MongoDB (rate-limit-store.ts);
// tests use the in-memory store below.

export interface RateEntry {
  count: number;
  resetsAt: Date;
}

export interface RateStore {
  /** Counts one event in the key's window (opening a new window when needed). */
  hit(key: string, windowMs: number): Promise<RateEntry>;
  /** Current window without counting, or null when there is none. */
  peek(key: string): Promise<RateEntry | null>;
  reset(key: string): Promise<void>;
}

export interface RateResult {
  allowed: boolean;
  remaining: number;
  resetsAt: Date;
}

export function createLimiter(store: RateStore) {
  return {
    /** Counts one event and tells whether it is still within the rule. */
    async hit(key: string, rule: RateRule): Promise<RateResult> {
      const entry = await store.hit(key, rule.windowMs);
      return { allowed: entry.count <= rule.max, remaining: Math.max(0, rule.max - entry.count), resetsAt: entry.resetsAt };
    },
    /** True once the rule's budget is spent, without counting anything. */
    async isBlocked(key: string, rule: RateRule): Promise<RateResult> {
      const entry = await store.peek(key);
      if (!entry) return { allowed: true, remaining: rule.max, resetsAt: new Date(0) };
      return { allowed: entry.count < rule.max, remaining: Math.max(0, rule.max - entry.count), resetsAt: entry.resetsAt };
    },
    reset: (key: string) => store.reset(key),
  };
}

export function createMemoryStore(now: () => number = Date.now): RateStore {
  const entries = new Map<string, RateEntry>();
  const live = (key: string) => {
    const entry = entries.get(key);
    if (entry && entry.resetsAt.getTime() <= now()) {
      entries.delete(key);
      return undefined;
    }
    return entry;
  };
  return {
    async hit(key, windowMs) {
      const entry = live(key) ?? { count: 0, resetsAt: new Date(now() + windowMs) };
      entry.count += 1;
      entries.set(key, entry);
      return { ...entry };
    },
    async peek(key) {
      const entry = live(key);
      return entry ? { ...entry } : null;
    },
    async reset(key) {
      entries.delete(key);
    },
  };
}

/** "Demasiados intentos. Prueba de nuevo en 12 minutos." */
export function tooManyAttempts(resetsAt: Date, now: Date = new Date()): string {
  const minutes = Math.max(1, Math.ceil((resetsAt.getTime() - now.getTime()) / 60_000));
  return `Demasiados intentos. Prueba de nuevo en ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`;
}
