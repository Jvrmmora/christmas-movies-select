// Server-rendered, deterministic illustration for the sign-in scene. All motion is CSS (globals.css, .nv-tree-*),
// so it costs no JavaScript and stops under prefers-reduced-motion.

const LIGHTS = ["#FF5A5F", "#F2C14E", "#7FE0A8", "#FFF1D6", "#7CC4FF"];

interface Bulb {
  x: number;
  y: number;
  color: string;
  delay: string;
}

/** A garland as a quadratic curve, with `n` bulbs spaced along it. */
function garland(x1: number, y1: number, x2: number, y2: number, sag: number, n: number, offset: number) {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2 + sag;
  const bulbs: Bulb[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t ** 2 * x2;
    const y = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t ** 2 * y2;
    bulbs.push({ x: Number(x.toFixed(1)), y: Number((y + 3).toFixed(1)), color: LIGHTS[(i + offset) % LIGHTS.length], delay: `${((i * 0.37 + offset * 0.2) % 1.8).toFixed(2)}s` });
  }
  return { d: `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`, bulbs };
}

const GARLANDS = [garland(96, 150, 228, 132, 30, 9, 0), garland(66, 218, 262, 196, 40, 12, 2), garland(42, 282, 286, 262, 44, 15, 1)];

const ORNAMENTS: [number, number, string][] = [
  [118, 138, "#C8102E"],
  [196, 128, "#E8C766"],
  [160, 112, "#FFFFFF"],
  [92, 214, "#E8C766"],
  [150, 200, "#C8102E"],
  [222, 206, "#FFFFFF"],
  [250, 236, "#C8102E"],
  [70, 270, "#FFFFFF"],
  [126, 262, "#E8C766"],
  [196, 272, "#C8102E"],
  [262, 282, "#E8C766"],
  [176, 236, "#E8C766"],
];

function Tier({ top, half, base, curve, fill }: { top: number; half: number; base: number; curve: number; fill: string }) {
  return <path d={`M160 ${top} L${160 + half} ${base} Q160 ${base + curve} ${160 - half} ${base} Z`} fill={fill} stroke={fill} strokeWidth="10" strokeLinejoin="round" />;
}

export function ChristmasTree({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 360" role="img" aria-label="Árbol de Navidad con luces, esferas y regalos" className={`nv-tree overflow-visible ${className}`}>
      <ellipse cx="160" cy="332" rx="150" ry="20" fill="var(--scene-ground)" />
      <ellipse cx="160" cy="328" rx="96" ry="9" fill="var(--scene-shadow)" />
      <rect x="147" y="284" width="26" height="42" rx="5" fill="#7A4A2A" />
      <g className="nv-tree-sway">
        <Tier top={162} half={138} base={292} curve={22} fill="var(--tree-1)" />
        <Tier top={98} half={112} base={228} curve={18} fill="var(--tree-2)" />
        <Tier top={46} half={84} base={162} curve={14} fill="var(--tree-3)" />
        <path d="M102 196 Q140 212 168 200 M176 262 Q214 276 250 258" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="3" strokeLinecap="round" />
        {GARLANDS.map((g, gi) => (
          <g key={gi}>
            <path d={g.d} fill="none" stroke="#E8C766" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
            {g.bulbs.map((b, i) => (
              <circle key={i} className="nv-tree-bulb" cx={b.x} cy={b.y} r="3.6" fill={b.color} style={{ color: b.color, animationDelay: b.delay }} />
            ))}
          </g>
        ))}
        {ORNAMENTS.map(([x, y, c], i) => (
          <g key={i} className="nv-tree-ornament" style={{ animationDelay: `${((i * 0.31) % 2.4).toFixed(2)}s` }}>
            <circle cx={x} cy={y} r="7.5" fill={c} />
            <circle cx={x - 2.4} cy={y - 2.6} r="2.2" fill="#FFFFFF" opacity="0.55" />
          </g>
        ))}
      </g>
      <g className="nv-tree-star">
        <path d="M160 14l7.6 15.6 17.2 2.4-12.4 12 3 17-15.4-8.1-15.4 8.1 3-17-12.4-12 17.2-2.4z" fill="#F2C14E" stroke="#FFF1D6" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      <g className="nv-tree-gift" style={{ animationDelay: "0.2s" }}>
        <rect x="40" y="296" width="44" height="34" rx="4" fill="#C8102E" />
        <rect x="36" y="288" width="52" height="11" rx="3" fill="#B30E29" />
        <rect x="58" y="288" width="8" height="42" fill="#F2C14E" />
        <path d="M62 288c-10-12-22-4-12 0m12 0c10-12 22-4 12 0" fill="none" stroke="#F2C14E" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g className="nv-tree-gift" style={{ animationDelay: "1.1s" }}>
        <rect x="236" y="300" width="38" height="30" rx="4" fill="#F2C14E" />
        <rect x="232" y="293" width="46" height="10" rx="3" fill="#E0AE2C" />
        <rect x="251" y="293" width="8" height="37" fill="#C8102E" />
      </g>
      <g className="nv-tree-gift" style={{ animationDelay: "1.8s" }}>
        <rect x="278" y="312" width="26" height="20" rx="3" fill="#2E9E68" />
        <rect x="288" y="312" width="6" height="20" fill="#FFF1D6" />
      </g>
    </svg>
  );
}
