// Server-rendered decoration: deterministic, so markup is identical on every render.

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const FLAKES = (() => {
  const rnd = seeded(11);
  return Array.from({ length: 28 }, (_, i) => ({
    left: `${(rnd() * 100).toFixed(2)}%`,
    size: `${(2 + rnd() * 3).toFixed(1)}px`,
    opacity: Number((0.25 + rnd() * 0.4).toFixed(2)),
    animationName: ["nv-fall-a", "nv-fall-b", "nv-fall-c"][i % 3],
    animationDuration: `${(14 + rnd() * 12).toFixed(1)}s`,
    animationDelay: `-${(rnd() * 22).toFixed(1)}s`,
    mobile: i % 2 === 0,
  }));
})();

export function Snowfall() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {FLAKES.map((f, i) => (
        <span
          key={i}
          className={`nv-flake ${f.mobile ? "" : "hidden sm:block"}`}
          style={{
            left: f.left,
            width: f.size,
            height: f.size,
            opacity: f.opacity,
            animationName: f.animationName,
            animationDuration: f.animationDuration,
            animationDelay: f.animationDelay,
          }}
        />
      ))}
    </div>
  );
}

const BULB_COLORS = ["#E5383B", "#F2C14E", "#2FA36B", "#FFF1D6"];

export function Garland() {
  return (
    <div aria-hidden className="-mb-[9px] flex h-[18px] overflow-hidden text-ink-2 opacity-80">
      {Array.from({ length: 32 }, (_, i) => {
        const color = BULB_COLORS[i % 4];
        return (
          <div key={i} className="relative min-w-10 flex-1">
            <svg viewBox="0 0 60 12" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-2.5 w-full">
              <path d="M0 1 Q30 11 60 1" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            </svg>
            <span
              className="nv-bulb absolute top-[7px] left-1/2 -ml-[3px] h-[9px] w-1.5"
              style={{
                borderRadius: "50% 50% 50% 50% / 40% 40% 60% 60%",
                background: color,
                color,
                animationDelay: `${((i * 0.41) % 2.8).toFixed(2)}s`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export function BrandMark({ className = "size-9 rounded-[11px]" }: { className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center bg-berry text-white ${className}`}>
      <svg viewBox="0 0 64 64" className="size-[62%]" aria-hidden>
        <path d="M32 6l2.3 4.6 5.1.7-3.7 3.6.9 5-4.6-2.4-4.6 2.4.9-5-3.7-3.6 5.1-.7z" fill="#F2C14E" />
        <path d="M32 19l9 11h-5l8 10h-6l9 11H17l9-11h-6l8-10h-5z" fill="currentColor" />
        <rect x="29" y="51" width="6" height="7" rx="1" fill="currentColor" />
      </svg>
    </span>
  );
}
