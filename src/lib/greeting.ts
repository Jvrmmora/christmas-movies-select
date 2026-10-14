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

/** Time left until Christmas Eve (Dec 24, 00:00 local). */
export function countdownTo(now: Date) {
  let target = new Date(now.getFullYear(), 11, 24);
  if (now >= new Date(now.getFullYear(), 11, 25)) target = new Date(now.getFullYear() + 1, 11, 24);
  const diff = Math.max(0, target.getTime() - now.getTime());
  return {
    isToday: diff === 0,
    days: Math.floor(diff / 864e5),
    hours: Math.floor(diff / 36e5) % 24,
    minutes: Math.floor(diff / 6e4) % 60,
    seconds: Math.floor(diff / 1e3) % 60,
  };
}
