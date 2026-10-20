const pad = (n: number) => String(n).padStart(2, "0");

interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isChristmas: boolean;
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="overflow-hidden rounded-xl shadow-[0_6px_18px_rgba(0,0,0,.35)]">
      <div className="bg-white px-1 pt-2 pb-1 text-center text-[40px] leading-none font-bold tracking-[-0.03em] text-[#202124] tabular-nums sm:px-3 sm:pt-3 sm:pb-1.5 sm:text-[64px]">
        {value}
      </div>
      <div className="bg-[#26382f] py-1.5 text-center text-[11px] font-semibold tracking-wide text-white sm:py-2 sm:text-base">{label}</div>
    </div>
  );
}

/**
 * Countdown: "Faltan", four number tiles and "para Navidad!", straight on the card (no panel behind it).
 * `parts` is null until the browser knows the time (server render has no timezone).
 */
export function ChristmasCountdown({ parts }: { parts: Parts | null }) {
  const label = parts
    ? parts.isChristmas
      ? "¡Feliz Navidad!"
      : `Faltan ${parts.days} ${parts.days === 1 ? "día" : "días"} y ${parts.hours} ${parts.hours === 1 ? "hora" : "horas"} para Navidad`
    : "Cuenta regresiva para Navidad";

  return (
    <section aria-label={label} className="py-2 text-center text-ink sm:py-4">
      {parts?.isChristmas ? (
        <div className="flex flex-col items-center gap-2 py-10">
          <p className="text-2xl font-medium sm:text-3xl">Hoy es</p>
          <p className="text-[56px] leading-none font-bold tracking-[-0.03em] sm:text-[88px]">¡Navidad!</p>
        </div>
      ) : (
        <>
          <p className="text-2xl font-medium sm:text-4xl">Faltan</p>
          <div className="mx-auto mt-3 grid max-w-[560px] grid-cols-4 gap-2 sm:mt-4 sm:gap-3.5" aria-hidden>
            <Tile value={parts ? String(parts.days) : "—"} label="Días" />
            <Tile value={parts ? String(parts.hours) : "—"} label="Horas" />
            <Tile value={parts ? pad(parts.minutes) : "—"} label="Minutos" />
            <Tile value={parts ? pad(parts.seconds) : "—"} label="Segundos" />
          </div>
          <p className="mt-4 text-xl font-medium sm:mt-5 sm:text-3xl">para</p>
          <p className="text-[48px] leading-none font-bold tracking-[-0.03em] sm:text-[84px]">Navidad!</p>
        </>
      )}
    </section>
  );
}
