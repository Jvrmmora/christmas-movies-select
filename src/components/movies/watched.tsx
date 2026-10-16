"use client";

import { useMemo, useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { setWatchedAction } from "@/actions/movies";
import { usePrefs } from "@/components/providers";
import type { Movie } from "@/lib/types";

/** Optimistic "watched" state shared by every card on a screen. */
export function useWatched(movies: Movie[]) {
  const { play } = usePrefs();
  const base = useMemo(() => Object.fromEntries(movies.map((m) => [m.id, m.watched])) as Record<string, boolean>, [movies]);
  const [state, setOptimistic] = useOptimistic(base, (s, p: { id: string; watched: boolean }) => ({ ...s, [p.id]: p.watched }));
  const [, startTransition] = useTransition();

  const toggle = (id: string) => {
    const next = !state[id];
    play(next ? "bell" : "tick");
    startTransition(async () => {
      setOptimistic({ id, watched: next });
      const res = await setWatchedAction(id, next);
      if (!res.ok) toast.error(res.error);
    });
  };

  return { isWatched: (id: string) => !!state[id], toggle };
}

/** Round check over a poster. */
export function WatchedToggle({ watched, title, onToggle }: { watched: boolean; title: string; onToggle: () => void }) {
  return watched ? (
    <button
      key="on"
      type="button"
      onClick={onToggle}
      aria-pressed="true"
      aria-label={`Quitar de vistas: ${title}`}
      className="nv-on absolute top-2.5 right-2.5 grid size-11 place-items-center rounded-full bg-check text-check-ink shadow-[0_4px_14px_rgba(0,0,0,.25)]"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path className="nv-draw" d="M5 12.5l4.2 4.2L19 7" />
      </svg>
    </button>
  ) : (
    <button
      key="off"
      type="button"
      onClick={onToggle}
      aria-pressed="false"
      aria-label={`Marcar como vista: ${title}`}
      className="nv-press absolute top-2.5 right-2.5 grid size-11 place-items-center rounded-full border-[1.5px] border-white/90 bg-black/30 text-white backdrop-blur-md"
    >
      <Check className="size-5 opacity-85" strokeWidth={2.4} aria-hidden />
    </button>
  );
}

/** Wide button used on detail screens and dialogs. */
export function WatchedButton({
  watched,
  onToggle,
  className = "",
  watchedLabel = "Vista",
}: {
  watched: boolean;
  onToggle: () => void;
  className?: string;
  watchedLabel?: string;
}) {
  return watched ? (
    <button
      key="on"
      type="button"
      onClick={onToggle}
      aria-pressed="true"
      data-on="true"
      className={`nv-press nv-on inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-check px-5 text-[15px] font-semibold text-check-ink ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path className="nv-draw" d="M5 12.5l4.2 4.2L19 7" />
      </svg>
      {watchedLabel}
    </button>
  ) : (
    <button
      key="off"
      type="button"
      onClick={onToggle}
      aria-pressed="false"
      className={`nv-press inline-flex h-12 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-line bg-surface px-5 text-[15px] font-semibold text-ink ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l2.8 2.8L16 10" opacity="0.45" />
      </svg>
      Marcar como vista
    </button>
  );
}
