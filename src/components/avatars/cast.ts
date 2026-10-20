import { ACCESSORIES, BACKGROUND_IDS, CHARACTERS, type AccessoryId, type Avatar, type CharacterId } from "@/lib/avatar";

interface Spot {
  x: number;
  y: number;
}

/** Where each accessory sits on a character, in the 100×100 avatar space. */
export interface Anchors {
  /** Top of the head; `w` is the head width the hat should cover. */
  hat: Spot & { w: number };
  neck: Spot & { w: number };
  /** `gap` is the distance from the centre to each eye. */
  eyes: Spot & { gap: number };
  bow: Spot;
  star: Spot;
}

export interface CastMember {
  name: string;
  /** Short personality tag shown on the profile picker. */
  trait: string;
  /** What they'd say about movie night. */
  phrase: string;
  /** Accessories the character already wears: the editor greys them out and they aren't drawn twice. */
  builtIn: AccessoryId[];
  anchors: Anchors;
}

export const CAST: Record<CharacterId, CastMember> = {
  santi: {
    name: "Santi",
    trait: "El generoso",
    phrase: "¡Yo traigo las palomitas!",
    builtIn: ["gorro"],
    anchors: { hat: { x: 50, y: 34, w: 44 }, neck: { x: 50, y: 82, w: 46 }, eyes: { x: 50, y: 44, gap: 8 }, bow: { x: 50, y: 90 }, star: { x: 32, y: 92 } },
  },
  rudolfo: {
    name: "Rudolfo",
    trait: "El curioso",
    phrase: "¿Ya elegimos peli?",
    builtIn: [],
    anchors: { hat: { x: 50, y: 31, w: 36 }, neck: { x: 50, y: 80, w: 40 }, eyes: { x: 50, y: 50, gap: 9 }, bow: { x: 50, y: 84 }, star: { x: 32, y: 92 } },
  },
  nieves: {
    name: "Nieves",
    trait: "La friolenta",
    phrase: "Prefiero la de la chimenea",
    builtIn: ["bufanda"],
    anchors: { hat: { x: 50, y: 28, w: 40 }, neck: { x: 50, y: 78, w: 44 }, eyes: { x: 50, y: 46, gap: 8 }, bow: { x: 50, y: 94 }, star: { x: 34, y: 94 } },
  },
  jengi: {
    name: "Jengi",
    trait: "El travieso",
    phrase: "¡Atrápame si puedes!",
    builtIn: [],
    anchors: { hat: { x: 50, y: 24, w: 40 }, neck: { x: 50, y: 76, w: 36 }, eyes: { x: 50, y: 44, gap: 8 }, bow: { x: 50, y: 78 }, star: { x: 34, y: 92 } },
  },
  duli: {
    name: "Duli",
    trait: "El ayudante",
    phrase: "¡Yo lo organizo!",
    builtIn: ["gorro"],
    anchors: { hat: { x: 50, y: 34, w: 44 }, neck: { x: 50, y: 78, w: 40 }, eyes: { x: 50, y: 50, gap: 8 }, bow: { x: 50, y: 80 }, star: { x: 32, y: 92 } },
  },
  pino: {
    name: "Pino",
    trait: "El presumido",
    phrase: "Mira mis lucecitas",
    builtIn: ["estrella", "gorro"],
    anchors: { hat: { x: 50, y: 14, w: 26 }, neck: { x: 50, y: 82, w: 34 }, eyes: { x: 50, y: 60, gap: 7 }, bow: { x: 50, y: 78 }, star: { x: 50, y: 6 } },
  },
  pingu: {
    name: "Pingu",
    trait: "El dormilón",
    phrase: "Cinco minutitos más…",
    builtIn: ["gorro"],
    anchors: { hat: { x: 50, y: 38, w: 48 }, neck: { x: 50, y: 78, w: 40 }, eyes: { x: 50, y: 50, gap: 8 }, bow: { x: 50, y: 80 }, star: { x: 32, y: 92 } },
  },
  estrellita: {
    name: "Estrellita",
    trait: "La soñadora",
    phrase: "Pide un deseo",
    builtIn: ["estrella"],
    anchors: { hat: { x: 50, y: 22, w: 28 }, neck: { x: 50, y: 76, w: 30 }, eyes: { x: 50, y: 54, gap: 7 }, bow: { x: 50, y: 76 }, star: { x: 50, y: 16 } },
  },
  cascanueces: {
    name: "Cascanueces",
    trait: "El valiente",
    phrase: "¡Nadie toca el control!",
    builtIn: ["gorro"],
    anchors: { hat: { x: 50, y: 34, w: 34 }, neck: { x: 50, y: 74, w: 36 }, eyes: { x: 50, y: 46, gap: 7 }, bow: { x: 50, y: 76 }, star: { x: 30, y: 92 } },
  },
  noela: {
    name: "Noela",
    trait: "La cálida",
    phrase: "¿Quién quiere galletas?",
    builtIn: ["gorro", "gafas"],
    anchors: { hat: { x: 50, y: 36, w: 44 }, neck: { x: 50, y: 78, w: 40 }, eyes: { x: 50, y: 50, gap: 8 }, bow: { x: 50, y: 80 }, star: { x: 30, y: 92 } },
  },
  angel: {
    name: "Ángel",
    trait: "La dulce",
    phrase: "Esta me hizo llorar",
    builtIn: [],
    anchors: { hat: { x: 50, y: 32, w: 38 }, neck: { x: 50, y: 80, w: 36 }, eyes: { x: 50, y: 52, gap: 8 }, bow: { x: 50, y: 82 }, star: { x: 34, y: 90 } },
  },
  osi: {
    name: "Osi",
    trait: "El abrazable",
    phrase: "Manta y peli",
    builtIn: ["gorro"],
    anchors: { hat: { x: 50, y: 36, w: 44 }, neck: { x: 50, y: 80, w: 42 }, eyes: { x: 50, y: 48, gap: 10 }, bow: { x: 50, y: 82 }, star: { x: 34, y: 92 } },
  },
};

export const ACCESSORY_LABEL: Record<AccessoryId, string> = {
  none: "Ninguno",
  gorro: "Gorro",
  bufanda: "Bufanda",
  gafas: "Gafas",
  lazo: "Moño",
  estrella: "Estrella",
};

export const BACKGROUND_LABEL: Record<string, string> = {
  berry: "Frambuesa",
  pine: "Pino",
  gold: "Dorado",
  night: "Noche",
  snow: "Nieve",
  mint: "Menta",
  peach: "Durazno",
  plum: "Ciruela",
};

export function characterName(id: CharacterId): string {
  return CAST[id].name;
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** "Sorpréndeme": a random character and background, with an accessory about half the time. */
export function randomAvatar(): Avatar {
  const character = pick(CHARACTERS);
  const wearable = ACCESSORIES.filter((a) => a !== "none" && !CAST[character].builtIn.includes(a));
  return { character, bg: pick(BACKGROUND_IDS), accessory: Math.random() < 0.5 ? pick(wearable) : "none" };
}
