export type DayPeriod = "morning" | "afternoon" | "night";

export function periodFor(hour: number): DayPeriod {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 19) return "afternoon";
  return "night";
}

export const GREETING: Record<DayPeriod, string> = {
  morning: "Buenos días",
  afternoon: "Buenas tardes",
  night: "Buenas noches",
};

/**
 * Time left until Christmas: the stroke of midnight between Dec 24 and Dec 25, in the
 * viewer's own timezone. During Dec 25 it reports `isChristmas`; from Dec 26 it
 * counts down to next year.
 */
export function countdownTo(now: Date) {
  const year = now.getFullYear();
  const startOfChristmas = new Date(year, 11, 25);
  const isChristmas = now >= startOfChristmas && now < new Date(year, 11, 26);
  const target = now >= new Date(year, 11, 26) ? new Date(year + 1, 11, 25) : startOfChristmas;
  const diff = isChristmas ? 0 : Math.max(0, target.getTime() - now.getTime());
  return {
    isChristmas,
    days: Math.floor(diff / 864e5),
    hours: Math.floor(diff / 36e5) % 24,
    minutes: Math.floor(diff / 6e4) % 60,
    seconds: Math.floor(diff / 1e3) % 60,
  };
}
