export type ThemeMode = "auto" | "light" | "dark";

export const THEME_KEY = "nv-theme";
export const THEME_MODES: ThemeMode[] = ["auto", "light", "dark"];

/** Night in the person's own clock: dark from 18:00 until 05:59. */
export const NIGHT_START = 18;
export const NIGHT_END = 6;

export function isNight(hour: number): boolean {
  return hour >= NIGHT_START || hour < NIGHT_END;
}

/** Anything unknown (old values, empty storage) means automatic. */
export function parseMode(raw: string | null | undefined): ThemeMode {
  return raw === "light" || raw === "dark" ? raw : "auto";
}

export function resolveDark(mode: ThemeMode, now: Date): boolean {
  return mode === "dark" || (mode === "auto" && isNight(now.getHours()));
}

export const THEME_COLORS = { light: "#FBF8F3", dark: "#0B1410" } as const;
