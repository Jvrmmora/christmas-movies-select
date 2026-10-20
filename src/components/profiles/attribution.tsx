"use client";

import { creditsLine } from "@/lib/credits";
import type { Movie } from "@/lib/types";
import { ProfileAvatar, useProfiles } from "./profiles-provider";

/** Who a movie is credited to for display: the suggester, else whoever added it. */
export const creditedTo = (m: Pick<Movie, "suggestedBy" | "addedBy">) => m.suggestedBy ?? m.addedBy;

/** Small avatar with an accessible "Sugerida por Ana" label; renders nothing for movies without a credit. */
export function SuggestedBadge({ movie, size = 24, className = "" }: { movie: Pick<Movie, "suggestedBy" | "addedBy">; size?: number; className?: string }) {
  const { byId } = useProfiles();
  const id = creditedTo(movie);
  if (!id) return null;
  const who = byId.get(id)?.name ?? "alguien que ya no está";
  return (
    <span role="img" aria-label={`${movie.suggestedBy ? "Sugerida" : "Agregada"} por ${who}`} title={`${movie.suggestedBy ? "Sugerida" : "Agregada"} por ${who}`} className="inline-flex">
      <ProfileAvatar id={id} size={size} className={className} />
    </span>
  );
}

/** "Sugerida por Rudolfo · agregada por Ana" next to the suggester's avatar. */
export function Credits({ movie, className = "" }: { movie: Pick<Movie, "suggestedBy" | "addedBy" | "updatedBy">; className?: string }) {
  const { byId } = useProfiles();
  const line = creditsLine(movie, (id) => byId.get(id)?.name ?? null);
  const id = creditedTo(movie);
  if (!line || !id) return null;
  return (
    <p className={`flex items-center gap-2.5 text-sm text-ink-2 ${className}`}>
      <ProfileAvatar id={id} size={28} />
      <span>{line}</span>
    </p>
  );
}
