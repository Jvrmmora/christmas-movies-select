import type { AccessoryId } from "@/lib/avatar";
import type { Anchors } from "./cast";
import { starPoints } from "./characters";

const RED = "#C8102E";
const GOLD = "#F2C14E";

/** One accessory placed on a character through its anchors. "none" and built-ins draw nothing. */
export function Accessory({ id, anchors }: { id: AccessoryId; anchors: Anchors }) {
  switch (id) {
    case "gorro": {
      const { x, y, w } = anchors.hat;
      return (
        <g transform={`translate(${x} ${y}) scale(${w / 40})`}>
          <path d="M-17 0 C-17 -17 -5 -27 13 -23 C16 -15 18 -7 17 0Z" fill={RED} />
          <rect x="-21" y="-5" width="42" height="9" rx="4.5" fill="#fff" stroke="#E6E0D6" strokeWidth="0.8" />
          <circle cx="14" cy="-24" r="5.5" fill="#fff" stroke="#E6E0D6" strokeWidth="0.8" />
        </g>
      );
    }
    case "bufanda": {
      const { x, y, w } = anchors.neck;
      return (
        <g transform={`translate(${x} ${y}) scale(${w / 40})`}>
          <path d="M-20 -3 Q0 9 20 -3 L21 6 Q0 18 -21 6Z" fill={GOLD} stroke="#B8860B" strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M-11 2 L-10 11 M0 4.5 L0 13.5 M11 2 L12 11" stroke={RED} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M8 8 L17 25 L9 27 L3 12Z" fill={GOLD} stroke="#B8860B" strokeWidth="0.8" strokeLinejoin="round" />
        </g>
      );
    }
    case "gafas": {
      const { x, y, gap } = anchors.eyes;
      const r = gap * 0.62;
      return (
        <g fill="rgba(255,255,255,0.28)" stroke="#2B2118" strokeWidth="1.8">
          <circle cx={x - gap} cy={y} r={r} />
          <circle cx={x + gap} cy={y} r={r} />
          <path d={`M${x - gap + r} ${y} Q${x} ${y - 2} ${x + gap - r} ${y}`} fill="none" />
        </g>
      );
    }
    case "lazo": {
      const { x, y } = anchors.bow;
      return (
        <g transform={`translate(${x} ${y})`} stroke="#8E6A0B" strokeWidth="0.9" strokeLinejoin="round">
          <path d="M0 0 L-11 -6.5 L-11 6.5Z M0 0 L11 -6.5 L11 6.5Z" fill={GOLD} />
          <circle r="3.2" fill={RED} stroke="#8E0B20" />
        </g>
      );
    }
    case "estrella": {
      const { x, y } = anchors.star;
      return <polygon points={starPoints(x, y, 7.5, 3.4)} fill={GOLD} stroke="#B8860B" strokeWidth="1" strokeLinejoin="round" />;
    }
    default:
      return null;
  }
}
