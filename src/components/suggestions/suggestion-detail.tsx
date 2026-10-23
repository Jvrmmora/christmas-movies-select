"use client";

import { ExternalLink, Loader2, Play, Plus } from "lucide-react";
import { CloseButton, Dialog } from "@/components/ui/dialog";
import { Poster, ProviderLogo } from "@/components/ui/poster";
import { ImdbLogo, RtLogo } from "@/components/ui/rating-badges";
import { formatRuntime, formatScore, OFFER_GROUP_LABEL } from "@/lib/format";
import type { Candidate, OfferType } from "@/lib/types";

const GROUPS: OfferType[] = ["flatrate", "free", "ads", "rent", "buy"];

/** Detail of a suggested movie: everything needed to decide before adding it. */
export function SuggestionDetail({
  movie,
  busy,
  onAdd,
  onClose,
}: {
  movie: Candidate | null;
  busy: boolean;
  onAdd: (c: Candidate) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!movie} onClose={onClose} labelledBy="sug-title" sheet>
      {movie && <Body movie={movie} busy={busy} onAdd={onAdd} onClose={onClose} />}
    </Dialog>
  );
}

function Body({ movie, busy, onAdd, onClose }: { movie: Candidate; busy: boolean; onAdd: (c: Candidate) => void; onClose: () => void }) {
  const groups = GROUPS.map((type) => ({ type, items: movie.streaming.filter((o) => o.type === type) })).filter((g) => g.items.length);
  const isDirectTrailer = movie.trailerUrl.includes("watch?v=");

  return (
    <div className="nv-flip relative flex max-h-[92dvh] w-screen flex-col overflow-y-auto rounded-t-[28px] bg-surface shadow-[0_30px_80px_rgba(0,0,0,.5)] sm:h-[min(760px,90dvh)] sm:max-h-none sm:w-[min(1040px,calc(100vw-48px))] sm:flex-row sm:overflow-hidden sm:rounded-[32px]">
      <div className="relative h-[280px] shrink-0 overflow-hidden bg-surface-2 sm:h-auto sm:w-[36%] sm:max-w-[380px]">
        <Poster src={movie.backdropUrl || movie.posterUrl} title="" className="absolute inset-0 scale-125 opacity-60 blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
        <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10">
          <Poster
            src={movie.posterUrl}
            title={movie.title}
            eager
            className="aspect-[2/3] h-[220px] shrink-0 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,.55)] ring-1 ring-white/20 sm:h-auto sm:w-[min(100%,calc((min(760px,90dvh)-80px)*0.6667))]"
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col sm:overflow-y-auto">
        <div className="flex flex-col gap-6 p-6 pt-7 sm:p-9 sm:pt-10">
          <div className="flex flex-col gap-3 pr-12">
            <p className="text-sm font-bold tracking-[0.06em] text-gold-ink uppercase">Sugerida</p>
            <h2 id="sug-title" className="text-[32px] leading-[1.05] font-bold tracking-[-0.03em] sm:text-[44px]">
              {movie.title}
            </h2>
            <p className="text-base text-ink-2">
              {[movie.originalTitle && movie.originalTitle !== movie.title ? movie.originalTitle : null, movie.year, formatRuntime(movie.runtimeMinutes)].filter(Boolean).join(" · ")}
            </p>
            {movie.genres.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Géneros">
                {movie.genres.map((g) => (
                  <li key={g} className="rounded-full bg-pine-soft px-3 py-1 text-[13px] font-semibold text-pine">
                    {g}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3.5 rounded-2xl bg-surface-2 px-4 py-3.5">
              <ImdbLogo className="h-7" />
              <div>
                <div className="text-[26px] leading-none font-bold tracking-[-0.02em]">
                  {formatScore(movie.ratings.imdb)}
                  <span className="text-sm font-semibold text-ink-2">/10</span>
                </div>
                <div className="mt-1 text-xs text-ink-2">Público</div>
              </div>
            </div>
            <div className="flex items-center gap-3.5 rounded-2xl bg-surface-2 px-4 py-3.5">
              {movie.ratings.rottenTomatoes !== null && <RtLogo score={movie.ratings.rottenTomatoes} certified={movie.ratings.certifiedFresh} className="h-9" />}
              <div>
                <div className="text-[26px] leading-none font-bold tracking-[-0.02em]">{movie.ratings.rottenTomatoes !== null ? `${movie.ratings.rottenTomatoes}%` : "—"}</div>
                <div className="mt-1 text-xs text-ink-2">{movie.ratings.certifiedFresh ? "Certified Fresh" : "Tomatómetro"}</div>
              </div>
            </div>
          </div>

          {movie.synopsis && (
            <section aria-labelledby="sug-syn" className="flex flex-col gap-2">
              <h3 id="sug-syn" className="text-sm font-bold tracking-[0.06em] text-ink-2 uppercase">
                Sinopsis
              </h3>
              <p className="text-base leading-relaxed sm:text-[17px]">{movie.synopsis}</p>
            </section>
          )}

          <section aria-labelledby="sug-where" className="flex flex-col gap-3">
            <h3 id="sug-where" className="text-sm font-bold tracking-[0.06em] text-ink-2 uppercase">
              Dónde verla
            </h3>
            {groups.length ? (
              <div className="flex flex-col gap-3">
                {groups.map((g) => (
                  <div key={g.type} className="flex flex-wrap items-center gap-2">
                    <span className="w-full text-xs font-semibold text-ink-2 sm:w-[150px]">{OFFER_GROUP_LABEL[g.type]}</span>
                    {g.items.map((o) => (
                      <a
                        key={o.provider + o.type}
                        href={o.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nv-press inline-flex h-11 items-center gap-2.5 rounded-xl border border-line bg-surface-2 pr-3.5 pl-1.5 text-sm font-semibold text-ink hover:border-ink-2"
                      >
                        <ProviderLogo src={o.logoUrl} name={o.name} className="size-8 rounded-lg" />
                        {o.name}
                        <ExternalLink className="size-3.5 text-ink-2" aria-hidden />
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-surface-2 px-4 py-3.5 text-sm text-ink-2">Por ahora no está en ninguna plataforma de su país.</p>
            )}
          </section>
        </div>

        <div className="sticky bottom-0 mt-auto flex flex-wrap items-center gap-2.5 border-t border-line bg-surface/95 p-4 backdrop-blur-md sm:px-9 sm:py-5">
          <button
            type="button"
            onClick={() => onAdd(movie)}
            disabled={busy}
            className="nv-press inline-flex h-[52px] flex-[1_1_220px] items-center justify-center gap-2 rounded-[14px] bg-berry text-base font-semibold text-white disabled:opacity-80"
          >
            {busy ? <Loader2 className="nv-spin size-[18px]" aria-hidden /> : <Plus className="size-[18px]" strokeWidth={2.4} aria-hidden />}
            {busy ? "Agregando…" : "Agregar a mi lista"}
          </button>
          {movie.trailerUrl && (
            <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer" className="nv-press inline-flex h-[52px] items-center gap-2 rounded-[14px] border border-line px-4 text-base font-semibold text-ink">
              <Play className="size-4 fill-current" aria-hidden />
              {isDirectTrailer ? "Ver tráiler" : "Buscar tráiler"}
            </a>
          )}
        </div>
      </div>
      <CloseButton onClick={onClose} className="absolute top-4 right-4 z-10 bg-black/40 text-white backdrop-blur-md" />
    </div>
  );
}
