"use client";

import { useMemo, useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { setFavoriteAction } from "@/actions/movies";
import { usePrefs } from "@/components/providers";
import type { Movie } from "@/lib/types";

/** Optimistic "favorite" state shared by every card on a screen. */
export function useFavorites(movies: Movie[]) {
  const { play } = usePrefs();
  const base = useMemo(() => Object.fromEntries(movies.map((m) => [m.id, m.favorite])) as Record<string, boolean>, [movies]);
  const [state, setOptimistic] = useOptimistic(base, (s, p: { id: string; favorite: boolean }) => ({ ...s, [p.id]: p.favorite }));
  const [, startTransition] = useTransition();

  const toggle = (id: string) => {
    const next = !state[id];
    if (next) play("jingle");
    startTransition(async () => {
      setOptimistic({ id, favorite: next });
      const res = await setFavoriteAction(id, next);
      if (!res.ok) toast.error(res.error);
    });
  };

  return { isFavorite: (id: string) => !!state[id], toggle };
}

/** Heart over a poster, opposite the watched check. */
export function FavoriteToggle({ favorite, title, onToggle }: { favorite: boolean; title: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={favorite}
      aria-label={favorite ? `Quitar de favoritas: ${title}` : `Marcar como favorita: ${title}`}
      className="nv-press absolute top-2.5 left-2.5 grid size-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md"
    >
      <Heart key={String(favorite)} className={`size-[18px] ${favorite ? "nv-heart fill-current" : "opacity-85"}`} strokeWidth={2} aria-hidden />
    </button>
  );
}
