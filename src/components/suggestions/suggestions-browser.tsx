"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Check, Loader2, PartyPopper, Plus, Sparkles } from "lucide-react";
import type { SuggestionCursor } from "@/lib/suggestions-more";
import { toast } from "sonner";
import { createMovieAction } from "@/actions/movies";
import { loadMoreSuggestionsAction } from "@/actions/suggestions";
import { usePrefs } from "@/components/providers";
import { Poster, ProviderLogo } from "@/components/ui/poster";
import { RatingBadges } from "@/components/ui/rating-badges";
import { SuggestionDetail } from "./suggestion-detail";
import { candidateToInput } from "@/lib/candidate";
import { formatRuntime } from "@/lib/format";
import { filterKey, subscriptionOffers } from "@/lib/platforms";
import type { Candidate } from "@/lib/types";

type Sort = "imdb" | "rt" | "recent" | "classic";

/** Same movie listed twice under different ids: match on normalized title + year. */
const dupKey = (c: Candidate) =>
  `${(c.originalTitle || c.title)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()}|${c.year}`;

function dedupe(items: Candidate[]): Candidate[] {
  const seen = new Set<string>();
  return items.filter((c) => {
    const k = dupKey(c);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function SuggestionsBrowser({ suggestions: initial, totalCatalog }: { suggestions: Candidate[]; totalCatalog: number }) {
  const { play } = usePrefs();
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [platform, setPlatform] = useState("all");
  const [sort, setSort] = useState<Sort>("imdb");
  const [detail, setDetail] = useState<Candidate | null>(null);
  // Each "load more" click is its own batch, kept apart so the new cards land at the end, not inside the sort.
  const [batches, setBatches] = useState<Candidate[][]>([]);
  const newestRef = useRef<HTMLLIElement>(null);
  const [cursor, setCursor] = useState<SuggestionCursor | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const [loadingMore, startLoadingMore] = useTransition();
  // Everything ever shown stays in `suggestions`, so "load more" can never repeat a card.
  const suggestions = useMemo(() => dedupe([...initial, ...batches.flat()]), [initial, batches]);

  useEffect(() => {
    if (batches.length) newestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [batches.length]);

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

  const visible = (items: Candidate[]) =>
    items
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

  // Batches only hold what the earlier sections do not (dedupe keeps the first copy).
  const sections = useMemo(() => {
    const seenKeys = new Set<string>();
    return [initial, ...batches].map((items) =>
      items.filter((c) => {
        const k = dupKey(c);
        if (seenKeys.has(k)) return false;
        seenKeys.add(k);
        return true;
      }),
    );
  }, [initial, batches]);
  const shown = sections.map(visible);
  const list = shown.flatMap((items, batch) => items.map((c) => ({ c, batch })));

  const loadMore = () => {
    startLoadingMore(async () => {
      const known = new Set(suggestions.map((c) => c.justwatchId));
      const knownKeys = new Set(suggestions.map(dupKey));
      const fresh: Candidate[] = [];
      let next = cursor;
      // A tanda can come back empty (everything already seen); keep going a few times before giving up.
      for (let attempt = 0; attempt < 4 && !fresh.length; attempt++) {
        const res = await loadMoreSuggestionsAction([...known], next);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        for (const c of res.data.items) {
          if (known.has(c.justwatchId) || knownKeys.has(dupKey(c))) continue;
          known.add(c.justwatchId);
          knownKeys.add(dupKey(c));
          fresh.push(c);
        }
        next = res.data.cursor;
        if (!next) break;
      }
      setCursor(next);
      if (!next) setExhausted(true);
      if (fresh.length) {
        setBatches((b) => [...b, fresh]);
        play("jingle");
        toast.success(`${fresh.length} sugeridas nuevas, al final de la lista`);
      } else if (next) toast("No salió nada nuevo en esta tanda. Prueben de nuevo.");
    });
  };

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
      setDetail((d) => (d?.justwatchId === c.justwatchId ? null : d));
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
        // One continuous grid, so filters never leave holes; newly loaded cards go last and are marked.
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-5 gap-y-8 sm:grid-cols-[repeat(auto-fill,minmax(190px,1fr))]">
          {list.map(({ c, batch }, i) => {
            const isNew = batch === batches.length && batch > 0;
            const firstNew = isNew && (i === 0 || list[i - 1].batch !== batch);
            const subs = subscriptionOffers(c.streaming).filter((o, idx, all) => all.findIndex((x) => (x.logoUrl ?? x.name) === (o.logoUrl ?? o.name)) === idx);
            const busy = adding === c.justwatchId;
            return (
              <li
                key={c.justwatchId}
                ref={firstNew ? newestRef : undefined}
                className="nv-fade flex min-w-0 scroll-mt-24 flex-col gap-2.5"
                style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-2xl shadow-card">
                  <button type="button" onClick={() => setDetail(c)} aria-label={`Ver detalle de ${c.title}`} className="block h-full w-full">
                    <Poster src={c.posterUrl} title={c.title} className="h-full w-full" />
                  </button>
                  {isNew && (
                    <span className="pointer-events-none absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold text-[#1b1405] shadow-[0_4px_12px_rgba(0,0,0,.35)]">
                      <Sparkles className="size-3" strokeWidth={2.4} aria-hidden />
                      Nuevo
                    </span>
                  )}
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
                  <button type="button" onClick={() => setDetail(c)} className="block max-w-full truncate text-left text-[15px] font-semibold hover:underline">
                    {c.title}
                  </button>
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
                      <span className="shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ink-2">
                        {c.streaming.length ? "Alquiler" : "Sin plataforma"}
                      </span>
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
      <div className="flex flex-col items-center gap-3 pt-2">
        {exhausted ? (
          <p className="rounded-2xl bg-surface-2 px-5 py-3 text-sm font-semibold text-ink-2">Ya no hay más sugeridas por ahora. ¡Vuelvan pronto!</p>
        ) : (
          <>
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="nv-press inline-flex h-14 w-full max-w-[420px] items-center justify-center gap-2.5 rounded-2xl bg-berry px-6 text-base font-bold text-white shadow-[0_10px_28px_rgba(200,16,46,.35)] disabled:opacity-80"
            >
              {loadingMore ? <Loader2 className="nv-spin size-5" aria-hidden /> : <Sparkles className="size-5" strokeWidth={2} aria-hidden />}
              {loadingMore ? "Buscando más películas…" : "Cargar más sugeridas"}
            </button>
            <p className="text-xs text-ink-2">Sin repetir las que ya vieron aquí ni las que ya están en su lista.</p>
          </>
        )}
      </div>
      <SuggestionDetail movie={detail} busy={!!detail && adding === detail.justwatchId} onAdd={add} onClose={() => setDetail(null)} />
    </div>
  );
}
