// Shared by the DB layer, validation and the avatar components, so it stays free of server-only code.

export const CHARACTERS = [
  "santi",
  "rudolfo",
  "nieves",
  "jengi",
  "duli",
  "pino",
  "pingu",
  "estrellita",
  "cascanueces",
  "noela",
  "angel",
  "osi",
] as const;
export type CharacterId = (typeof CHARACTERS)[number];

export const ACCESSORIES = ["none", "gorro", "bufanda", "gafas", "lazo", "estrella"] as const;
export type AccessoryId = (typeof ACCESSORIES)[number];

/** Background swatches: festive tones that work behind every character in light and dark mode. */
export const AVATAR_BACKGROUNDS = {
  berry: "#C8102E",
  pine: "#1E6B4A",
  gold: "#E8B923",
  night: "#1F2A44",
  snow: "#DCE9F5",
  mint: "#9FD8C0",
  peach: "#F6B8A0",
  plum: "#7A3E6B",
} as const;
export type AvatarBackgroundId = keyof typeof AVATAR_BACKGROUNDS;
export const BACKGROUND_IDS = Object.keys(AVATAR_BACKGROUNDS) as [AvatarBackgroundId, ...AvatarBackgroundId[]];

export interface Avatar {
  character: CharacterId;
  bg: AvatarBackgroundId;
  accessory: AccessoryId;
}

/**
 * Deterministic starter avatar, so the first profiles of a home don't all look alike. The stride of 3
 * walks the palette out of order, which keeps red characters (Santi, Noela) off the berry background.
 */
export function starterAvatar(index: number): Avatar {
  return {
    character: CHARACTERS[index % CHARACTERS.length],
    bg: BACKGROUND_IDS[(index * 3 + 1) % BACKGROUND_IDS.length],
    accessory: "none",
  };
}
