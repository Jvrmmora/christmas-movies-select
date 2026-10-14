import type { OfferType } from "./types";

export function formatRuntime(min: number | null | undefined): string {
  if (!min) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${String(m).padStart(2, "0")} min` : `${h} h`;
}

export function formatScore(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toFixed(1).replace(".", ",");
}

export const OFFER_LABEL: Record<OfferType, string> = {
  flatrate: "Suscripción",
  free: "Gratis",
  ads: "Gratis con anuncios",
  rent: "Alquiler",
  buy: "Compra",
};

export const OFFER_GROUP_LABEL: Record<OfferType, string> = {
  flatrate: "Incluida en suscripción",
  free: "Gratis",
  ads: "Gratis con anuncios",
  rent: "Alquiler",
  buy: "Compra",
};

export function rtVerdict(score: number | null, certified: boolean): "certified" | "fresh" | "rotten" | null {
  if (score === null) return null;
  if (score >= 60) return certified ? "certified" : "fresh";
  return "rotten";
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
