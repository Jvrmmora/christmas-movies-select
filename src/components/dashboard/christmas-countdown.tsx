const pad = (n: number) => String(n).padStart(2, "0");

interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isChristmas: boolean;
}

function Cell({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[14px] bg-surface-2 pt-2.5 pb-2">
      <span className="font-display text-[26px] leading-none font-semibold tracking-[-0.03em] tabular-nums sm:text-[30px]">{value}</span>
      <span className="text-[11px] font-semibold text-ink-2">{label}</span>
    </div>
  );
}

/**
 * Compact countdown: a small label (plus the mascot's line) and four quiet cells that follow the theme.
 * `parts` is null until the browser knows the time (server render has no timezone).
 */
export function ChristmasCountdown({ parts, note }: { parts: Parts | null; note?: string }) {
  const label = parts
    ? parts.isChristmas
      ? "¡Feliz Navidad!"
      : `Faltan ${parts.days} ${parts.days === 1 ? "día" : "días"} y ${parts.hours} ${parts.hours === 1 ? "hora" : "horas"} para Navidad`
    : "Cuenta regresiva para Navidad";

  return (
    <section aria-label={label} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 text-ink">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-semibold tracking-[0.06em] text-gold-ink uppercase">{parts?.isChristmas ? "Hoy es" : "Faltan para Navidad"}</span>
        {note && <span className="text-[13px] text-ink-2 italic">{note}</span>}
      </div>
      {parts?.isChristmas ? (
        <p className="font-display text-[34px] leading-none font-bold tracking-[-0.035em] text-berry-ink">¡Navidad!</p>
      ) : (
        <div className="grid min-w-[240px] flex-[0_1_360px] grid-cols-4 gap-2" aria-hidden>
          <Cell value={parts ? String(parts.days) : "—"} label={parts?.days === 1 ? "día" : "días"} />
          <Cell value={parts ? pad(parts.hours) : "—"} label="horas" />
          <Cell value={parts ? pad(parts.minutes) : "—"} label="min" />
          <Cell value={parts ? pad(parts.seconds) : "—"} label="seg" />
        </div>
      )}
    </section>
  );
}
