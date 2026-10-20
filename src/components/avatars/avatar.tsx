import { AVATAR_BACKGROUNDS, type Avatar as AvatarData } from "@/lib/avatar";
import { Accessory } from "./accessories";
import { CAST } from "./cast";
import { CHARACTER_ART } from "./characters";

interface AvatarProps {
  avatar: AvatarData;
  size?: number;
  /** Plays the character's idle animation (otherwise only on hover/focus of an .nv-av-host parent). */
  animated?: boolean;
  /** Accessible name; leave out when the avatar sits next to its owner's name. */
  label?: string;
  className?: string;
}

export function Avatar({ avatar, size = 64, animated = false, label, className = "" }: AvatarProps) {
  const cast = CAST[avatar.character];
  const Art = CHARACTER_ART[avatar.character];
  // The editor greys out what a character already wears; stored values can still be stale.
  const accessory = cast.builtIn.includes(avatar.accessory) ? "none" : avatar.accessory;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`nv-av shrink-0 rounded-full ${animated ? "nv-av-on" : ""} ${className}`}
    >
      <rect width="100" height="100" fill={AVATAR_BACKGROUNDS[avatar.bg]} />
      <circle cx="50" cy="34" r="46" fill="#fff" opacity="0.14" />
      <Art />
      <Accessory id={accessory} anchors={cast.anchors} />
    </svg>
  );
}

/** Stand-in for a person who left the home (their profile was deleted): a neutral snowflake. */
export function GhostAvatar({ size = 64, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden className={`shrink-0 rounded-full ${className}`}>
      <rect width="100" height="100" fill="#C9D1D9" />
      <g stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M50 24 V76 M27.5 37 L72.5 63 M27.5 63 L72.5 37" />
        <path d="M43 31 L50 24 L57 31 M43 69 L50 76 L57 69" strokeWidth="3.5" />
      </g>
    </svg>
  );
}
