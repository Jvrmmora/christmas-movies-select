"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Check, Loader2, PartyPopper, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createMovieAction } from "@/actions/movies";
import { usePrefs } from "@/components/providers";
import { Poster, ProviderLogo } from "@/components/ui/poster";
import { RatingBadges } from "@/components/ui/rating-badges";
import { candidateToInput } from "@/lib/candidate";
import { formatRuntime } from "@/lib/format";
import { filterKey, subscriptionOffers } from "@/lib/platforms";
import type { Candidate } from "@/lib/types";

type Sort = "imdb" | "rt" | "recent" | "classic";

export function SuggestionsBrowser({ suggestions, totalCatalog }: { suggestions: Candidate[]; totalCatalog: number }) {
  const { play } = usePrefs();
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [platform, setPlatform] = useState("all");
  const [sort, setSort] = useState<Sort>("imdb");

  const platforms = useMemo(() => {
    const map = new Map<string, { key: string; name: string; logoUrl?: string; count: number }>();
    for (const c of suggestions) {
      const seen = new Set<string>();
      for (const o of subscriptionOffers(c.streaming)) {
        const f = filterKey(o);
        if (seen.has(f.key)) continue;
        seen.add(f.key);
        const cur = map.get(f.key) ?? { ...f, count: 0 };
        cur.count++;
        map.set(f.key, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [suggestions]);

  const list = suggestions
    .filter((c) => !added.has(c.justwatchId))
    .filter((c) => {
      const subs = subscriptionOffers(c.streaming);
      if (onlyAvailable && !subs.length) return false;
      if (platform !== "all" && !subs.some((o) => filterKey(o).key === platform)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sort) {
        case "rt":
          return (b.ratings.rottenTomatoes ?? -1) - (a.ratings.rottenTomatoes ?? -1);
        case "recent":
          return b.year - a.year;
        case "classic":
          return a.year - b.year;
        default:
          return (b.ratings.imdb ?? -1) - (a.ratings.imdb ?? -1);
      }
    });

  const add = (c: Candidate) => {
    setAdding(c.justwatchId);
    startTransition(async () => {
      const res = await createMovieAction(candidateToInput(c));
      setAdding(null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setAdded((s) => new Set(s).add(c.justwatchId));
      play("jingle");
      toast.success(`«${c.title}» quedó en tu lista`);
    });
  };

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-4xl leading-[1.05] font-bold tracking-[-0.03em] sm:text-[44px]">
            Sugeridas
            <Sparkles className="size-7 text-gold sm:size-8" strokeWidth={1.8} aria-hidden />
          </h1>
          <p className="mt-2 text-base text-ink-2">
            {suggestions.length - added.size} películas navideñas que todavía no están en su lista · de {totalCatalog} que revisamos
          </p>
        </div>
        <Link href="/peliculas" className="nv-press inline-flex h-11 items-center rounded-xl border border-line bg-surface px-4 text-[15px] font-semibold text-ink">
          Ver mi lista
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={onlyAvailable}
          onClick={() => setOnlyAvailable((v) => !v)}
          className={`inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] px-4 text-sm font-semibold text-ink ${onlyAvailable ? "border-gold bg-gold-soft" : "border-line bg-surface"}`}
        >
          {onlyAvailable && <Check className="size-4" strokeWidth={2.6} aria-hidden />}
          Solo con plataforma en Colombia
        </button>
        <label className="flex items-center gap-2 text-sm text-ink-2">
          Plataforma
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="h-11 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink">
            <option value="all">Todas</option>
            {platforms.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name} ({p.count})
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-2">
          Ordenar
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-11 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink">
            <option value="imdb">Mejor IMDb</option>
            <option value="rt">Mejor Rotten Tomatoes</option>
            <option value="recent">Más recientes</option>
            <option value="classic">Clásicas primero</option>
          </select>
        </label>
      </div>

      {list.length ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-5 gap-y-8 sm:grid-cols-[repeat(auto-fill,minmax(190px,1fr))]">
          {list.map((c, i) => {
            const subs = subscriptionOffers(c.streaming).filter((o, idx, all) => all.findIndex((x) => (x.logoUrl ?? x.name) === (o.logoUrl ?? o.name)) === idx);
            const busy = adding === c.justwatchId;
            return (
              <li key={c.justwatchId} className="nv-fade flex min-w-0 flex-col gap-2.5" style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}>
                <div className="relative aspect-[2/3] overflow-hidden rounded-2xl shadow-card">
                  <Poster src={c.posterUrl} title={c.title} className="h-full w-full" />
                  <button
                    type="button"
                    onClick={() => add(c)}
                    disabled={busy}
                    aria-label={`Agregar ${c.title} a mi lista`}
                    className="nv-press absolute right-2.5 bottom-2.5 left-2.5 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-berry text-sm font-semibold text-white shadow-[0_6px_18px_rgba(0,0,0,.35)] disabled:opacity-80"
                  >
                    {busy ? <Loader2 className="nv-spin size-4" aria-hidden /> : <Plus className="size-4" strokeWidth={2.4} aria-hidden />}
                    {busy ? "Agregando…" : "Agregar a mi lista"}
                  </button>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold">{c.title}</div>
                  <div className="truncate text-[13px] text-ink-2">
                    {c.year}
                    {c.runtimeMinutes ? ` · ${formatRuntime(c.runtimeMinutes)}` : ""}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <RatingBadges ratings={c.ratings} />
                  <span className="ml-auto flex items-center gap-1">
                    {subs.length ? (
                      subs.slice(0, 2).map((o) => <ProviderLogo key={o.provider} src={o.logoUrl} name={o.name} />)
                    ) : (
                      <span className="shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ink-2">{c.streaming.length ? "Alquiler" : "Sin plataforma"}</span>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-[28px] bg-surface px-6 py-[72px] text-center shadow-card">
          <PartyPopper className="size-[64px] text-pine" strokeWidth={1.2} aria-hidden />
          <h2 className="text-[22px] font-bold">{suggestions.length - added.size === 0 ? "¡Ya tienen todas!" : "Nada con estos filtros"}</h2>
          <p className="max-w-[380px] text-[15px] leading-normal text-ink-2">
            {suggestions.length - added.size === 0 ? "Su biblioteca ya incluye todas las navideñas que revisamos." : "Prueben quitar el filtro de plataforma."}
          </p>
        </div>
      )}
    </div>
  );
}
