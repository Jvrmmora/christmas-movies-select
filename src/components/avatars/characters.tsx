import type { CharacterId } from "@/lib/avatar";

// Twelve flat, hand-drawn characters on a 100×100 canvas, each a head-and-shoulders bust that sits
// inside a circular crop. Classes starting with nv-av- are idle animations (see globals.css).

const INK = "#2B2118";
const SKIN = "#F6C8A0";
const BLUSH = "#F4A0A0";
const RED = "#C8102E";
const GOLD = "#F2C14E";

/** Points of a regular star centred on (cx, cy). */
export function starPoints(cx: number, cy: number, outer: number, inner: number, spikes = 5): string {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (-90 + (i * 180) / spikes) * (Math.PI / 180);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

function Eyes({ y, gap = 8, r = 2.5, color = INK }: { y: number; gap?: number; r?: number; color?: string }) {
  return (
    <g>
      <circle cx={50 - gap} cy={y} r={r} fill={color} />
      <circle cx={50 + gap} cy={y} r={r} fill={color} />
      <circle cx={50 - gap - r * 0.3} cy={y - r * 0.35} r={r * 0.3} fill="#fff" />
      <circle cx={50 + gap - r * 0.3} cy={y - r * 0.35} r={r * 0.3} fill="#fff" />
    </g>
  );
}

function Cheeks({ y, gap = 15, r = 3.4, color = BLUSH }: { y: number; gap?: number; r?: number; color?: string }) {
  return (
    <g fill={color} opacity="0.7">
      <circle cx={50 - gap} cy={y} r={r} />
      <circle cx={50 + gap} cy={y} r={r} />
    </g>
  );
}

function Smile({ y, w = 5, color = INK }: { y: number; w?: number; color?: string }) {
  return <path d={`M${50 - w} ${y} Q50 ${y + w * 0.95} ${50 + w} ${y}`} fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" />;
}

function Santi() {
  return (
    <g>
      <path d="M12 100 C14 82 30 74 50 74 C70 74 86 82 88 100Z" fill={RED} />
      <circle cx="50" cy="48" r="20" fill={SKIN} />
      <circle cx="50" cy="55" r="4.5" fill="#E98B7D" />
      <g className="nv-av-sway">
        <path d="M29 50 C27 78 38 92 50 92 C62 92 73 78 71 50 C65 59 58 57 50 61 C42 57 35 59 29 50Z" fill="#fff" stroke="#E6E0D6" strokeWidth="0.8" />
        <path d="M50 60 C45 53 35 56 37 63 C42 65 47 64 50 60 C53 64 58 65 63 63 C65 56 55 53 50 60Z" fill="#fff" stroke="#E6E0D6" strokeWidth="0.8" />
        <ellipse cx="50" cy="69" rx="3.6" ry="2.6" fill={RED} />
      </g>
      <Eyes y={48} gap={8} r={2.4} />
      <path d="M28 34 C28 16 44 8 62 10 C76 13 76 24 72 34Z" fill={RED} />
      <rect x="24" y="32" width="52" height="12" rx="6" fill="#fff" stroke="#E6E0D6" strokeWidth="0.8" />
      <circle cx="66" cy="12" r="6.5" fill="#fff" stroke="#E6E0D6" strokeWidth="0.8" />
    </g>
  );
}

function Rudolfo() {
  return (
    <g>
      <path d="M14 100 C16 84 32 78 50 78 C68 78 84 84 86 100Z" fill="#8A5A36" />
      <g stroke="#6B4423" strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M38 34 C34 24 30 18 24 12 M33 24 C28 24 24 22 21 18 M37 29 C33 30 30 28 28 25" />
        <path d="M62 34 C66 24 70 18 76 12 M67 24 C72 24 76 22 79 18 M63 29 C67 30 70 28 72 25" />
      </g>
      <ellipse cx="27" cy="43" rx="8" ry="5" transform="rotate(-25 27 43)" fill="#9A6B43" />
      <ellipse cx="73" cy="43" rx="8" ry="5" transform="rotate(25 73 43)" fill="#9A6B43" />
      <ellipse cx="27" cy="43" rx="4.5" ry="2.4" transform="rotate(-25 27 43)" fill="#E7B7A4" />
      <ellipse cx="73" cy="43" rx="4.5" ry="2.4" transform="rotate(25 73 43)" fill="#E7B7A4" />
      <ellipse cx="50" cy="52" rx="21" ry="23" fill="#9A6B43" />
      <ellipse cx="50" cy="64" rx="13" ry="10" fill="#E8C9A0" />
      <circle className="nv-av-glow" cx="50" cy="61" r="9.5" fill="#FF5A5A" opacity="0.35" />
      <circle cx="50" cy="61" r="5.6" fill="#E5383B" />
      <circle cx="48.4" cy="59.2" r="1.5" fill="#fff" opacity="0.8" />
      <path d="M50 66.5 L50 69 M45 70 Q50 73.5 55 70" fill="none" stroke={INK} strokeWidth="1.7" strokeLinecap="round" />
      <Eyes y={49} gap={9} r={2.8} />
    </g>
  );
}

function Nieves() {
  return (
    <g>
      <path d="M16 100 C18 84 32 80 50 80 C68 80 82 84 84 100Z" fill="#fff" stroke="#CFDDEA" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="24" fill="#fff" stroke="#CFDDEA" strokeWidth="1.5" />
      <Eyes y={45} gap={8} r={2.6} color="#2B2B2B" />
      <path d="M50 51 L71 55 L50 58Z" fill="#F28C28" stroke="#F28C28" strokeWidth="1.6" strokeLinejoin="round" />
      <g fill="#2B2B2B">
        {(
          [
            [40, 62],
            [43.5, 65.5],
            [50, 67],
            [56.5, 65.5],
            [60, 62],
          ] as const
        ).map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="1.4" />
        ))}
      </g>
      <Cheeks y={57} gap={17} r={3.6} />
      <path d="M22 76 Q50 90 78 76 L79 87 Q50 101 21 87Z" fill={RED} />
      <path d="M34 82 L35 93 M46 86 L46 97 M58 86 L58 97 M68 82 L67 91" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path className="nv-av-wave" d="M62 88 L72 104 L63 106 L57 92Z" fill={RED} />
    </g>
  );
}

function Jengi() {
  return (
    <g>
      <circle cx="29" cy="27" r="8" fill="#C98A4B" />
      <circle cx="71" cy="27" r="8" fill="#C98A4B" />
      <path d="M20 100 C22 82 36 76 50 76 C64 76 78 82 80 100Z" fill="#C98A4B" />
      <path d="M26 84 Q22 94 26 100 M74 84 Q78 94 74 100" fill="none" stroke="#FFF4E0" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="88" r="3" fill={RED} />
      <circle cx="50" cy="96" r="3" fill="#fff" />
      <circle cx="50" cy="48" r="27" fill="#C98A4B" />
      <circle cx="50" cy="48" r="23" fill="none" stroke="#FFF4E0" strokeWidth="2.4" strokeDasharray="5 4.4" strokeLinecap="round" />
      <circle cx="42" cy="44" r="2.6" fill="#4A2A12" />
      <path d="M55 44 Q58.5 40.5 62 44" fill="none" stroke="#4A2A12" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M41 54 Q50 64 59 54" fill="none" stroke="#FFF4E0" strokeWidth="3" strokeLinecap="round" />
      <Cheeks y={52} gap={17} r={4} color="#E88B73" />
    </g>
  );
}

function Duli() {
  return (
    <g>
      <path d="M14 100 C16 83 32 77 50 77 C68 77 84 83 86 100Z" fill="#2E8B57" />
      <path d="M34 80 L40 88 L46 81 L50 89 L54 81 L60 88 L66 80" fill="none" stroke="#F5E6C8" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="50" cy="95" r="2.4" fill={GOLD} />
      <path d="M31 52 L12 42 L32 60Z" fill={SKIN} stroke={SKIN} strokeWidth="2" strokeLinejoin="round" />
      <path d="M69 52 L88 42 L68 60Z" fill={SKIN} stroke={SKIN} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="50" cy="52" r="20" fill={SKIN} />
      <path d="M30 46 C30 38 40 36 50 38 C60 36 70 38 70 46 C64 42 58 44 50 42 C42 44 36 42 30 46Z" fill="#A5522D" />
      <Eyes y={52} gap={8} r={3} />
      <path d="M43 59 Q50 68 57 59Z" fill="#8B2E2E" />
      <Cheeks y={58} gap={16} r={3.4} />
      <path d="M30 38 C32 24 46 14 68 12 C64 18 64 28 70 38Z" fill="#1E6B4A" />
      <rect x="27" y="36" width="46" height="9" rx="4.5" fill={RED} />
      <g className="nv-av-ring">
        <circle cx="68" cy="13" r="4.8" fill={GOLD} stroke="#B8860B" strokeWidth="0.8" />
        <path d="M65.8 15.2 h4.4" stroke="#B8860B" strokeWidth="1" strokeLinecap="round" />
      </g>
    </g>
  );
}

const TWINKLE = (i: number) => ({ animationDelay: `${(i * 0.45).toFixed(2)}s` });

function Pino() {
  const tier = (d: string, fill: string) => <path d={d} fill={fill} stroke={fill} strokeWidth="8" strokeLinejoin="round" />;
  return (
    <g>
      <rect x="44" y="82" width="12" height="14" rx="2" fill="#7A4B2A" />
      {tier("M50 44 L80 80 L20 80Z", "#236F45")}
      {tier("M50 30 L74 60 L26 60Z", "#2A7F50")}
      {tier("M50 18 L66 38 L34 38Z", "#2F8F5B")}
      <Eyes y={61} gap={7} r={2.6} />
      <Cheeks y={67} gap={13} r={3} />
      <Smile y={68} w={4.5} />
      <g>
        {(
          [
            [33, 77, "#E5383B"],
            [67, 77, GOLD],
            [58, 52, "#E5383B"],
            [41, 51, GOLD],
            [50, 30, "#E5383B"],
          ] as const
        ).map(([x, y, c], i) => (
          <circle key={i} className="nv-av-twinkle" style={TWINKLE(i)} cx={x} cy={y} r="2.7" fill={c} />
        ))}
      </g>
      <g className="nv-av-twinkle">
        <polygon points={starPoints(50, 13, 8.5, 3.8)} fill={GOLD} stroke={GOLD} strokeWidth="2" strokeLinejoin="round" />
      </g>
    </g>
  );
}

function Pingu() {
  const NAVY = "#2B3A55";
  return (
    <g>
      <ellipse cx="22" cy="80" rx="6" ry="13" transform="rotate(25 22 80)" fill={NAVY} />
      <ellipse cx="78" cy="80" rx="6" ry="13" transform="rotate(-25 78 80)" fill={NAVY} />
      <path d="M18 100 C20 84 34 78 50 78 C66 78 80 84 82 100Z" fill={NAVY} />
      <ellipse cx="50" cy="99" rx="16" ry="16" fill="#fff" />
      <circle cx="50" cy="54" r="27" fill={NAVY} />
      <path d="M30 54 C30 42 40 42 50 48 C60 42 70 42 70 54 C70 68 60 76 50 76 C40 76 30 68 30 54Z" fill="#fff" />
      <g className="nv-av-blink">
        <circle cx="42" cy="53" r="4.4" fill="#fff" stroke={NAVY} strokeWidth="1.3" />
        <circle cx="58" cy="53" r="4.4" fill="#fff" stroke={NAVY} strokeWidth="1.3" />
        <circle cx="43" cy="53.6" r="2.2" fill={INK} />
        <circle cx="57" cy="53.6" r="2.2" fill={INK} />
      </g>
      <path d="M44 60 Q50 57 56 60 Q54 68 50 69 Q46 68 44 60Z" fill="#F28C28" />
      <Cheeks y={62} gap={16} r={3.2} />
      <path d="M27 40 C27 16 73 16 73 40Z" fill={RED} />
      <rect x="25" y="36" width="50" height="9" rx="4.5" fill="#fff" stroke="#E6E0D6" strokeWidth="0.8" />
      <circle cx="50" cy="16" r="5.5" fill="#fff" stroke="#E6E0D6" strokeWidth="0.8" />
    </g>
  );
}

function Estrellita() {
  return (
    <g>
      <polygon points={starPoints(50, 54, 38, 18)} fill={GOLD} stroke={GOLD} strokeWidth="9" strokeLinejoin="round" />
      <polygon points={starPoints(50, 56, 24, 11)} fill="#FFE9A8" opacity="0.6" />
      <Eyes y={54} gap={7} r={2.6} />
      <Cheeks y={61} gap={13} r={3} color="#F08A7A" />
      <Smile y={60} w={5} />
      <g fill="#fff" className="nv-av-twinkle">
        <path d="M82 17 L84 22 L89 24 L84 26 L82 31 L80 26 L75 24 L80 22Z" />
        <path style={TWINKLE(3)} d="M16 26 L17.4 29.4 L21 31 L17.4 32.6 L16 36 L14.6 32.6 L11 31 L14.6 29.4Z" />
      </g>
    </g>
  );
}

function Cascanueces() {
  return (
    <g>
      <path d="M14 100 C16 82 30 74 50 74 C70 74 84 82 86 100Z" fill={RED} />
      <path d="M32 76 L58 100 L72 100 L40 74Z" fill="#fff" opacity="0.95" />
      <ellipse cx="24" cy="82" rx="8" ry="4.5" transform="rotate(-20 24 82)" fill={GOLD} stroke="#B8860B" strokeWidth="0.8" />
      <ellipse cx="76" cy="82" rx="8" ry="4.5" transform="rotate(20 76 82)" fill={GOLD} stroke="#B8860B" strokeWidth="0.8" />
      <circle cx="33" cy="50" r="6" fill="#fff" />
      <circle cx="67" cy="50" r="6" fill="#fff" />
      <circle cx="50" cy="48" r="17" fill={SKIN} />
      <circle cx="50" cy="52" r="3" fill="#E6A58A" />
      <Cheeks y={55} gap={14} r={3} />
      <Eyes y={45} gap={7} r={2.2} />
      <path d="M38 40.5 L46 41.5 M62 40.5 L54 41.5" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <rect x="41" y="60" width="18" height="6" rx="1.5" fill="#7A1E1E" />
      <path d="M45.5 60 v6 M50 60 v6 M54.5 60 v6" stroke="#fff" strokeWidth="1" />
      <path d="M50 55 C44 51 35 54 37 59 C41 61 46 60 50 57 C54 60 59 61 63 59 C65 54 56 51 50 55Z" fill="#fff" stroke="#E6E0D6" strokeWidth="0.8" />
      <rect x="34" y="2" width="32" height="30" rx="3" fill="#22252E" />
      <rect x="34" y="26" width="32" height="5" fill={GOLD} />
      <circle cx="50" cy="14" r="5" fill={RED} stroke={GOLD} strokeWidth="1.5" />
      <rect x="31" y="31" width="38" height="4" rx="2" fill="#22252E" />
    </g>
  );
}

function Noela() {
  return (
    <g>
      <path d="M14 100 C16 82 32 76 50 76 C68 76 84 82 86 100Z" fill={RED} />
      <path d="M36 100 L38 84 Q50 80 62 84 L64 100Z" fill="#fff" stroke="#E8E1D6" strokeWidth="1" />
      <g>
        <circle cx="74" cy="90" r="8" fill="#D9A066" />
        <g fill="#6B4423">
          <circle cx="71" cy="88" r="1.4" />
          <circle cx="77" cy="91" r="1.4" />
          <circle cx="73" cy="94" r="1.4" />
          <circle cx="76.5" cy="86" r="1.2" />
        </g>
      </g>
      <circle cx="26" cy="46" r="7" fill="#F3F3F3" stroke="#E0E0E0" strokeWidth="0.8" />
      <circle cx="74" cy="46" r="7" fill="#F3F3F3" stroke="#E0E0E0" strokeWidth="0.8" />
      <circle cx="50" cy="52" r="20" fill={SKIN} />
      <path d="M28 54 C24 32 36 26 50 26 C64 26 76 32 72 54 C70 44 62 38 50 38 C38 38 30 44 28 54Z" fill="#F3F3F3" stroke="#E0E0E0" strokeWidth="0.8" />
      <Eyes y={50} gap={9} r={2} />
      <g fill="rgba(255,255,255,0.28)" stroke="#B8860B" strokeWidth="1.6">
        <circle cx="41" cy="50" r="6.5" />
        <circle cx="59" cy="50" r="6.5" />
        <path d="M47.5 49.5 Q50 48 52.5 49.5" fill="none" />
      </g>
      <Cheeks y={58} gap={15} r={4} />
      <Smile y={58} w={5} />
      <path d="M30 40 C30 20 70 20 70 40Z" fill={RED} />
      <ellipse cx="50" cy="40" rx="22" ry="5" fill="#fff" stroke="#E6E0D6" strokeWidth="0.8" />
      <g>
        <path d="M58 30 Q62 24 66 28 Q62 32 58 30Z" fill="#2E8B57" />
        <path d="M64 26 Q70 24 70 30 Q66 32 64 26Z" fill="#2E8B57" />
        <circle cx="62.5" cy="30" r="2" fill="#E5383B" />
      </g>
    </g>
  );
}

function Angel() {
  const wing = "M36 80 C12 78 4 58 12 44 C18 52 24 56 30 60 C24 62 30 70 38 72Z";
  return (
    <g>
      <g className="nv-av-flap">
        <path d={wing} fill="#fff" stroke="#D8E4F0" strokeWidth="1.5" strokeLinejoin="round" />
        <path d={wing} transform="translate(100 0) scale(-1 1)" fill="#fff" stroke="#D8E4F0" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      <path d="M22 100 C24 84 36 78 50 78 C64 78 76 84 78 100Z" fill="#fff" stroke="#E3EAF2" strokeWidth="1.2" />
      <path d="M40 80 Q50 86 60 80" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
      <circle cx="31" cy="48" r="7" fill="#F5D36B" />
      <circle cx="69" cy="48" r="7" fill="#F5D36B" />
      <circle cx="50" cy="54" r="20" fill={SKIN} />
      <g fill="#F5D36B">
        <circle cx="37" cy="39" r="8" />
        <circle cx="50" cy="35" r="9" />
        <circle cx="63" cy="39" r="8" />
      </g>
      <path d="M40 54 Q43 51 46 54 M54 54 Q57 51 60 54" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <Cheeks y={60} gap={14} r={3.6} />
      <Smile y={62} w={4.5} />
      <g className="nv-av-float">
        <ellipse cx="50" cy="20" rx="15" ry="4.5" fill="none" stroke={GOLD} strokeWidth="3.2" />
      </g>
    </g>
  );
}

function Osi() {
  return (
    <g>
      <path d="M14 100 C16 84 32 80 50 80 C68 80 84 84 86 100Z" fill="#1E6B4A" />
      <path d="M36 92 l4 4 l4 -4 l4 4 l4 -4 l4 4 l4 -4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <g className="nv-av-breathe">
        <circle cx="26" cy="42" r="9" fill="#FDFBF6" stroke="#DCE6EE" strokeWidth="1.5" />
        <circle cx="74" cy="42" r="9" fill="#FDFBF6" stroke="#DCE6EE" strokeWidth="1.5" />
        <circle cx="26" cy="42" r="4.5" fill="#E7CFCB" />
        <circle cx="74" cy="42" r="4.5" fill="#E7CFCB" />
        <circle cx="50" cy="54" r="26" fill="#FDFBF6" stroke="#DCE6EE" strokeWidth="1.5" />
        <ellipse cx="50" cy="63" rx="13" ry="10" fill="#EFE7DB" />
        <ellipse cx="50" cy="58.5" rx="5" ry="3.6" fill="#2B2B2B" />
        <path d="M50 62 L50 66 M45 67.5 Q50 71 55 67.5" fill="none" stroke="#2B2B2B" strokeWidth="1.8" strokeLinecap="round" />
        <Eyes y={50} gap={10} r={2.8} />
        <Cheeks y={60} gap={21} r={3.6} />
        <path d="M28 38 C28 14 72 14 72 38Z" fill={RED} />
        <path d="M38 22 L36 34 M50 18 L50 34 M62 22 L64 34" stroke="#A00D25" strokeWidth="2.2" opacity="0.5" />
        <rect x="26" y="34" width="48" height="10" rx="5" fill="#fff" stroke="#E6E0D6" strokeWidth="0.8" />
        <circle cx="50" cy="15" r="6" fill="#fff" stroke="#E6E0D6" strokeWidth="0.8" />
      </g>
    </g>
  );
}

export const CHARACTER_ART: Record<CharacterId, () => React.JSX.Element> = {
  santi: Santi,
  rudolfo: Rudolfo,
  nieves: Nieves,
  jengi: Jengi,
  duli: Duli,
  pino: Pino,
  pingu: Pingu,
  estrellita: Estrellita,
  cascanueces: Cascanueces,
  noela: Noela,
  angel: Angel,
  osi: Osi,
};
