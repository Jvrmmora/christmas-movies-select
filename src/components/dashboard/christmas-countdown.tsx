const pad = (n: number) => String(n).padStart(2, "0");

interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isChristmas: boolean;
}

function Leaf({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 60 120" className={className} style={style} aria-hidden>
      <path d="M30 2C52 30 58 70 30 118 2 70 8 30 30 2Z" fill="#1f6b4c" />
      <path d="M30 2C45 30 50 70 30 118" fill="none" stroke="#2f8f68" strokeWidth="2" opacity=".7" />
      <path d="M30 14v100M30 40l14-12M30 62l16-14M30 84l14-12M30 40 16 28M30 62 14 48M30 84 16 72" fill="none" stroke="#134d36" strokeWidth="1.6" />
    </svg>
  );
}

function Poinsettia({ className = "" }: { className?: string }) {
  const petals = [0, 60, 120, 180, 240, 300];
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {petals.map((a) => (
        <path key={a} d="M50 50C36 36 38 12 50 4c12 8 14 32 0 46Z" fill="#d7263d" transform={`rotate(${a} 50 50)`} />
      ))}
      {petals.map((a) => (
        <path key={`v${a}`} d="M50 48V12" stroke="#a31428" strokeWidth="1.5" transform={`rotate(${a} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="7" fill="#f2c14e" />
      <circle cx="46" cy="47" r="2" fill="#fff3c4" />
    </svg>
  );
}

function Bauble({ className = "", color = "#2f9e5f" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 50 70" className={className} aria-hidden>
      <rect x="21" y="2" width="8" height="9" rx="1.5" fill="#d9b44a" />
      <path d="M25 11v6" stroke="#d9b44a" strokeWidth="1.5" />
      <circle cx="25" cy="42" r="23" fill={color} />
      <circle cx="25" cy="42" r="23" fill="url(#bg)" />
      <ellipse cx="17" cy="32" rx="5" ry="8" fill="#fff" opacity=".28" transform="rotate(25 17 32)" />
      <g fill="#fff" opacity=".7">
        <circle cx="16" cy="46" r="1.6" />
        <circle cx="25" cy="49" r="1.6" />
        <circle cx="34" cy="46" r="1.6" />
      </g>
      <defs>
        <radialGradient id="bg" cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#fff" stopOpacity=".18" />
          <stop offset="1" stopColor="#000" stopOpacity=".25" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function Flake({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden>
      <path d="M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7M12 2l-2 2.5M12 2l2 2.5M12 22l-2-2.5M12 22l2-2.5" />
    </svg>
  );
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
 * Countdown banner: dark green wreath panel, four white number tiles and "para Navidad!".
 * `parts` is null until the browser knows the time (server render has no timezone).
 */
export function ChristmasCountdown({ parts }: { parts: Parts | null }) {
  const label = parts
    ? parts.isChristmas
      ? "¡Feliz Navidad!"
      : `Faltan ${parts.days} ${parts.days === 1 ? "día" : "días"} y ${parts.hours} ${parts.hours === 1 ? "hora" : "horas"} para Navidad`
    : "Cuenta regresiva para Navidad";

  return (
    <section
      aria-label={label}
      className="relative isolate overflow-hidden rounded-[24px] px-4 pt-7 pb-8 text-center text-white sm:px-8 sm:pt-9 sm:pb-10"
      style={{
        background:
          "repeating-linear-gradient(90deg, rgba(255,255,255,.025) 0 2px, transparent 2px 22px), linear-gradient(160deg, #14412f 0%, #0d2f23 55%, #0a271d 100%)",
      }}
    >
      {/* Decoration */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Leaf className="absolute -top-3 left-[18%] h-20 w-8 rotate-[-28deg] opacity-90 sm:left-[22%] sm:h-28 sm:w-12" />
        <Leaf className="absolute top-2 left-[26%] hidden h-16 w-7 rotate-[18deg] opacity-80 sm:block" />
        <Leaf className="absolute -top-2 -right-1 h-24 w-9 rotate-[32deg] sm:h-36 sm:w-14" />
        <Leaf className="absolute top-8 -right-3 h-20 w-8 rotate-[62deg] opacity-90 sm:h-28 sm:w-11" />
        <Poinsettia className="absolute -top-3 -right-3 size-20 sm:-top-4 sm:right-3 sm:size-28" />
        <Bauble className="absolute top-12 right-[14%] hidden h-14 w-10 sm:block" color="#2f9e5f" />
        <Leaf className="absolute -bottom-4 -left-2 h-28 w-11 rotate-[-52deg] sm:h-40 sm:w-16" />
        <Leaf className="absolute bottom-2 left-[6%] h-24 w-9 rotate-[-12deg] opacity-90 sm:h-32 sm:w-12" />
        <Poinsettia className="absolute -bottom-5 left-[10%] size-16 sm:left-[14%] sm:size-24" />
        <Bauble className="absolute bottom-8 left-2 h-12 w-9 sm:bottom-12 sm:left-8 sm:h-16 sm:w-11" color="#c8283e" />
        <Leaf className="absolute -right-2 -bottom-3 h-28 w-11 rotate-[48deg] sm:h-36 sm:w-14" />
        <Poinsettia className="absolute right-[7%] -bottom-4 size-16 sm:size-24" />
        <Bauble className="absolute right-[26%] bottom-6 hidden h-12 w-9 sm:block" color="#d9a63a" />
        <Flake className="absolute top-10 left-6 size-5 text-white/60" />
        <Flake className="absolute top-24 left-[14%] size-4 text-white/40" />
        <Flake className="absolute top-14 right-[24%] size-5 text-white/50" />
        <Flake className="absolute bottom-24 right-6 size-4 text-white/40" />
      </div>

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
