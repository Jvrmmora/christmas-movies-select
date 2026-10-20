import { ChristmasTree } from "@/components/auth/christmas-tree";
import { BrandMark } from "@/components/shell/decor";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Deterministic decoration, so the server and the browser draw the same scene.
const rnd = seeded(4);
const FLAKES = Array.from({ length: 30 }, () => ({
  left: `${(rnd() * 100).toFixed(1)}%`,
  size: `${(2.5 + rnd() * 3).toFixed(1)}px`,
  duration: `${(9 + rnd() * 9).toFixed(1)}s`,
  delay: `-${(rnd() * 18).toFixed(1)}s`,
}));
const STARS = Array.from({ length: 26 }, () => ({
  left: `${(4 + rnd() * 92).toFixed(1)}%`,
  top: `${(3 + rnd() * 45).toFixed(1)}%`,
  size: rnd() > 0.7 ? 3 : 2,
  delay: `${(rnd() * 3).toFixed(2)}s`,
}));
const BUBBLES = [
  { left: "8%", top: "18%", size: 46, delay: "0s" },
  { left: "78%", top: "12%", size: 28, delay: "-3s" },
  { left: "84%", top: "58%", size: 40, delay: "-5s" },
  { left: "14%", top: "70%", size: 22, delay: "-2s" },
  { left: "62%", top: "30%", size: 18, delay: "-4s" },
];
const PAGE_BUBBLES = [
  { left: "4%", top: "8%", size: 90 },
  { left: "88%", top: "6%", size: 140 },
  { left: "92%", top: "72%", size: 110 },
  { left: "10%", top: "82%", size: 160 },
  { left: "52%", top: "94%", size: 70 },
];

/**
 * Two-panel card shared by sign-in, sign-up, recovery and admin sign-in: an animated tree on one side
 * (a night sky in dark mode) and the form on pine green. On phones the scene sits on top.
 * Used as the (auth) layout, so the tree keeps playing while moving between those screens.
 */
export function AuthFrame({ children }: { children?: React.ReactNode }) {
  return (
    <div className="nv-auth relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-12 max-[859px]:items-stretch max-[859px]:p-0">
      <div aria-hidden className="max-[859px]:hidden">
        {PAGE_BUBBLES.map((b, i) => (
          <span key={i} className="absolute rounded-full bg-white/[.04]" style={{ left: b.left, top: b.top, width: b.size, height: b.size }} />
        ))}
      </div>

      <div className="nv-auth-panel nv-fade relative grid w-full max-w-[1080px] overflow-hidden rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,.35)] max-[859px]:min-h-dvh max-[859px]:grid-rows-[auto_1fr] max-[859px]:rounded-none max-[859px]:shadow-none min-[860px]:min-h-[640px] min-[860px]:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]">
        <div className="nv-scene relative flex flex-col overflow-hidden px-5 pt-[18px] pb-[26px] max-[859px]:min-h-[300px] min-[860px]:px-8 min-[860px]:pt-8 min-[860px]:pr-16 min-[860px]:pb-7" style={{ color: "var(--scene-ink)" }}>
          <div aria-hidden className="nv-scene-blob absolute top-[16%] left-[10%] h-[70%] w-[78%]" />
          <div aria-hidden className="nv-scene-blob-2 absolute top-[26%] left-[22%] h-[52%] w-[56%]" />
          <div aria-hidden>
            {BUBBLES.map((b, i) => (
              <span key={i} className="nv-scene-bubble" style={{ left: b.left, top: b.top, width: b.size, height: b.size, animationDelay: b.delay }} />
            ))}
          </div>
          <div aria-hidden className="hidden dark:block">
            {STARS.map((s, i) => (
              <span key={i} className="nv-scene-star" style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }} />
            ))}
            <span className="absolute top-[9%] right-[22%] size-[38px] -rotate-[20deg] rounded-full shadow-[-9px_4px_0_0_#F2E6C4]" />
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {FLAKES.map((f, i) => (
              <span key={i} className="nv-scene-flake" style={{ left: f.left, width: f.size, height: f.size, animationDuration: f.duration, animationDelay: f.delay }} />
            ))}
          </div>

          <div className="relative flex items-center gap-2.5">
            <BrandMark className="size-[34px] rounded-[10px]" />
            <span className="font-display text-[17px] font-bold tracking-[-0.02em]">Navidad en casa</span>
          </div>
          <div className="relative flex flex-1 items-center justify-center py-3">
            <ChristmasTree className="h-auto w-[190px] min-[860px]:w-[min(340px,82%)]" />
          </div>
          <p className="relative text-sm max-[859px]:hidden" style={{ color: "var(--scene-ink-2)" }}>
            Una película por día hasta Nochebuena.
          </p>
        </div>

        <main className="relative flex flex-col justify-start px-[22px] pt-[26px] pb-10 min-[860px]:justify-center min-[860px]:py-14 min-[860px]:pr-14 min-[860px]:pl-9">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Title block of the form side; re-animates on each screen while the scene stays put. */
export function AuthHeading({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="nv-swap">
      <h1 className="font-display text-[32px] leading-[1.05] font-bold tracking-[-0.035em] min-[860px]:text-[38px]">{title}</h1>
      {subtitle && <p className="mt-1.5 text-[15px] text-ink-2">{subtitle}</p>}
      {children}
    </div>
  );
}

/** Frame + heading in one, for screens outside the (auth) group (admin sign-in). */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <AuthFrame>
      <AuthHeading title={title} subtitle={subtitle}>
        {children}
      </AuthHeading>
    </AuthFrame>
  );
}
