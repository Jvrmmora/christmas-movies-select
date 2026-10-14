"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertTriangle, Check, ChevronLeft, ListPlus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { importMoviesAction, searchMoviesAction } from "@/actions/movies";
import { usePrefs } from "@/components/providers";
import { Poster } from "@/components/ui/poster";
import type { Candidate } from "@/lib/types";
import type { MovieInput } from "@/lib/validation";
import { parseLines } from "@/lib/parse-list";

interface Row {
  id: number;
  query: string;
  year?: number;
  status: "waiting" | "searching" | "done" | "error";
  candidates: Candidate[];
  /** justwatchId, or "manual" for "add with just title + year" */
  choice: string;
  title: string;
  include: boolean;
}

function toInput(row: Row): MovieInput {
  const c = row.candidates.find((x) => x.justwatchId === row.choice);
  if (!c) {
    return {
      title: row.title || row.query,
      originalTitle: "",
      year: row.year ?? new Date().getFullYear(),
      ratings: { imdb: null, rottenTomatoes: null, certifiedFresh: false },
      source: "manual",
    };
  }
  const { justwatchId: _id, score: _score, ...data } = c;
  return { ...data, title: row.title || c.title, source: "auto" };
}

export function ImportFlow() {
  const router = useRouter();
  const { play } = usePrefs();
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [saving, startSave] = useTransition();

  const patch = (id: number, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const searchAll = async () => {
    const parsed = parseLines(text);
    if (!parsed.length) return;
    const initial: Row[] = parsed.map((p, i) => ({ id: i, ...p, status: "waiting", candidates: [], choice: "manual", title: p.query, include: true }));
    setRows(initial);
    setBusy(true);
    let next = 0;
    // Two at a time keeps JustWatch happy.
    const worker = async () => {
      while (next < initial.length) {
        const row = initial[next++];
        patch(row.id, { status: "searching" });
        const res = await searchMoviesAction(row.query, row.year);
        if (!res.ok) {
          patch(row.id, { status: "error" });
          continue;
        }
        const best = res.data[0];
        const good = best && best.score >= 0.75;
        patch(row.id, {
          status: "done",
          candidates: res.data,
          choice: good ? best.justwatchId : "manual",
          title: good ? best.title : row.query,
        });
      }
    };
    await Promise.all([worker(), worker()]);
    setBusy(false);
    play("jingle");
  };

  const selected = rows.filter((r) => r.include && r.status !== "searching" && r.status !== "waiting");

  const save = () =>
    startSave(async () => {
      const res = await importMoviesAction(selected.map(toInput));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      play("bell");
      const { created, skipped } = res.data;
      toast.success(`${created} ${created === 1 ? "película agregada" : "películas agregadas"}`);
      if (skipped.length) toast(`${skipped.length} no se agregaron`, { description: skipped.slice(0, 4).join(" · ") });
      router.push("/peliculas");
    });

  return (
    <div className="mx-auto flex max-w-[1040px] flex-col gap-7">
      <div>
        <Link href="/peliculas" className="inline-flex items-center gap-1 text-sm font-semibold text-berry-ink">
          <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
          Películas
        </Link>
        <h1 className="mt-2.5 text-4xl leading-[1.05] font-bold tracking-[-0.03em] sm:text-[44px]">Importar lista</h1>
        <p className="mt-2 text-[17px] text-ink-2">Peguen una película por línea con su año, por ejemplo «Klaus (2019)». Buscamos cada una y ustedes revisan antes de guardar.</p>
      </div>

      <section className="flex flex-col gap-3 rounded-3xl bg-surface p-5 shadow-card sm:p-7">
        <label htmlFor="list" className="text-[13px] font-semibold text-ink-2">
          Su lista
        </label>
        <textarea
          id="list"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={"Klaus (2019)\nHome Alone (1990)\nElf (2003)"}
          className="resize-y rounded-xl border border-line bg-field px-3.5 py-3 font-mono text-[15px] leading-relaxed text-ink"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] text-ink-2">{parseLines(text).length} películas detectadas</span>
          <button
            type="button"
            onClick={searchAll}
            disabled={busy || !text.trim()}
            className="nv-press inline-flex h-12 items-center gap-2 rounded-[14px] bg-berry px-5 text-[15px] font-semibold text-white disabled:opacity-60"
          >
            {busy ? <Loader2 className="nv-spin size-[18px]" aria-hidden /> : <Search className="size-[18px]" strokeWidth={2} aria-hidden />}
            {busy ? "Buscando…" : "Buscar todas"}
          </button>
        </div>
      </section>

      {rows.length > 0 && (
        <section aria-label="Resultados" className="flex flex-col gap-2.5">
          {rows.map((r) => {
            const c = r.candidates.find((x) => x.justwatchId === r.choice);
            const weak = r.status === "done" && (!c || c.score < 0.9);
            return (
              <div key={r.id} className={`flex flex-wrap items-center gap-3.5 rounded-2xl bg-surface p-3 shadow-card ${r.include ? "" : "opacity-55"}`}>
                <input
                  type="checkbox"
                  checked={r.include}
                  onChange={(e) => patch(r.id, { include: e.target.checked })}
                  aria-label={`Incluir ${r.query}`}
                  className="size-5 accent-[var(--check)]"
                />
                {r.status === "done" || r.status === "error" ? (
                  <Poster src={c?.posterUrl ?? ""} title={r.title} className="h-[72px] w-12 shrink-0 rounded-lg" />
                ) : (
                  <div className="nv-shimmer h-[72px] w-12 shrink-0 rounded-lg" />
                )}
                <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[13px] text-ink-2">
                    <span className="truncate">
                      {r.query}
                      {r.year ? ` (${r.year})` : ""}
                    </span>
                    {r.status === "done" && !weak && <Check className="size-4 shrink-0 text-check" strokeWidth={3} aria-label="Coincidencia clara" />}
                    {weak && <AlertTriangle className="size-4 shrink-0 text-gold-ink" strokeWidth={2} aria-label="Revisar" />}
                    {r.status === "error" && <span className="text-berry-ink">Error al buscar</span>}
                  </div>
                  <input
                    value={r.title}
                    onChange={(e) => patch(r.id, { title: e.target.value })}
                    aria-label="Título"
                    className="h-10 rounded-[10px] border border-line bg-field px-3 text-[15px] font-semibold text-ink"
                  />
                </div>
                <label className="flex min-w-0 flex-[1_1_260px]">
                  <span className="sr-only">Coincidencia para {r.query}</span>
                  <select
                    value={r.choice}
                    disabled={r.status !== "done"}
                    onChange={(e) => {
                      const pick = r.candidates.find((x) => x.justwatchId === e.target.value);
                      patch(r.id, { choice: e.target.value, title: pick ? pick.title : r.query });
                    }}
                    className="h-10 w-full min-w-0 rounded-[10px] border border-line bg-field px-2.5 text-sm text-ink"
                  >
                    {r.candidates.map((x) => (
                      <option key={x.justwatchId} value={x.justwatchId}>
                        {x.title} ({x.year}){x.originalTitle && x.originalTitle !== x.title ? ` · ${x.originalTitle}` : ""}
                      </option>
                    ))}
                    <option value="manual">Agregar sin datos (solo título y año)</option>
                  </select>
                </label>
              </div>
            );
          })}
          <div className="sticky bottom-24 z-10 mt-2 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-glass px-4 py-3.5 backdrop-blur-xl md:bottom-4">
            <span className="flex-[1_1_220px] text-[13px] text-ink-2">
              Las marcadas con <AlertTriangle className="inline size-3.5 text-gold-ink" aria-hidden /> conviene revisarlas.
            </span>
            <button
              type="button"
              onClick={save}
              disabled={busy || saving || !selected.length}
              className="nv-press inline-flex h-12 items-center gap-2 rounded-[14px] bg-berry px-5 text-[15px] font-semibold text-white disabled:opacity-60"
            >
              <ListPlus className="size-[18px]" aria-hidden />
              {saving ? "Guardando…" : `Agregar ${selected.length} ${selected.length === 1 ? "película" : "películas"}`}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
