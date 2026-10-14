import type { OfferType, StreamingOffer } from "./types";

const icon = (id: number, name: string) => `https://images.justwatch.com/icon/${id}/s100/${name}.webp`;

/** Services available in Colombia, with official logos (via JustWatch) and a search URL for manual links. */
export const KNOWN_PLATFORMS: { provider: string; name: string; logoUrl: string; search: (q: string) => string }[] = [
  { provider: "netflix", name: "Netflix", logoUrl: icon(207360008, "netflix"), search: (q) => `https://www.netflix.com/search?q=${q}` },
  { provider: "disneyplus", name: "Disney+", logoUrl: icon(313118777, "disneyplus"), search: (q) => `https://www.disneyplus.com/search?q=${q}` },
  { provider: "amazonprimevideo", name: "Prime Video", logoUrl: icon(322992749, "amazonprimevideo"), search: (q) => `https://www.primevideo.com/search/ref=atv_nb_sug?phrase=${q}` },
  { provider: "max", name: "HBO Max", logoUrl: icon(332884837, "max"), search: (q) => `https://play.hbomax.com/search/result?q=${q}` },
  { provider: "appletvplus", name: "Apple TV", logoUrl: icon(338367329, "appletvplus"), search: (q) => `https://tv.apple.com/co/search?term=${q}` },
  { provider: "paramountplus", name: "Paramount+", logoUrl: icon(242706661, "paramountplus"), search: (q) => `https://www.paramountplus.com/search/?q=${q}` },
  { provider: "movistarplay", name: "Movistar TV", logoUrl: icon(310445571, "movistarplay"), search: (q) => `https://www.movistarplay.co/search?q=${q}` },
  { provider: "directvgo", name: "DIRECTV GO", logoUrl: icon(207966895, "directvgo"), search: () => `https://www.directvgo.com/co/` },
  { provider: "plutotv", name: "Pluto TV", logoUrl: icon(312204955, "plutotv"), search: (q) => `https://pluto.tv/latam/search/details?query=${q}` },
  { provider: "mubi", name: "MUBI", logoUrl: icon(164970114, "mubi"), search: (q) => `https://mubi.com/es/co/search/films?query=${q}` },
  { provider: "youtube", name: "YouTube", logoUrl: "", search: (q) => `https://www.youtube.com/results?search_query=${q}` },
];

const SUBSCRIPTION: OfferType[] = ["flatrate", "free", "ads"];

/** Offers that need no extra payment beyond a subscription. */
export function subscriptionOffers(offers: StreamingOffer[]): StreamingOffer[] {
  return offers.filter((o) => SUBSCRIPTION.includes(o.type));
}

/** The offer to use for the main "Ver en …" button. */
export function primaryOffer(offers: StreamingOffer[]): StreamingOffer | null {
  return subscriptionOffers(offers)[0] ?? offers[0] ?? null;
}

/** Amazon/Apple "channels" (e.g. "HBO Max (Prime Video)") collapse into their parent service for filters. */
export function filterKey(offer: StreamingOffer): { key: string; name: string; logoUrl?: string } {
  const channel = offer.name.match(/^(.*) \((Prime Video|Apple TV)\)$/);
  if (channel) {
    const known = KNOWN_PLATFORMS.find((p) => p.name === channel[1]);
    if (known) return { key: known.provider, name: known.name, logoUrl: known.logoUrl };
  }
  return { key: offer.provider, name: offer.name, logoUrl: offer.logoUrl };
}
