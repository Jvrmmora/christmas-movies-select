"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { importMoviesAction } from "@/actions/movies";
import { usePrefs } from "@/components/providers";
import { Poster } from "@/components/ui/poster";
import { candidateToInput } from "@/lib/candidate";
import type { Candidate } from "@/lib/types";

/** The classics offered to a brand-new home. Nothing is picked: adding them is up to the person. */
export function StarterPicks({ name, picks }: { name: string; picks: Candidate[] | null }) {
  const router = useRouter();
  const { play } = usePrefs();
  const [chosen, setChosen] = useState<Set<string>>(() => new Set());
  const [pending, start] = useTransition();

  const toggle = (id: string) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function add() {
    const items = (picks ?? []).filter((c) => chosen.has(c.justwatchId)).map((c) => candidateToInput(c));
    start(async () => {
      const res = await importMoviesAction(items);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      play("jingle");
      toast.success(res.data.created === 1 ? "1 película agregada" : `${res.data.created} películas agregadas`);
      router.replace("/");
    });
  }

  if (!picks) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-[28px] bg-surface px-6 py-16 text-center shadow-card">
        <h1 className="text-2xl font-bold">¡Listo, {name}!</h1>
        <p className="text-ink-2">No pudimos traer las sugerencias en este momento. Puedes agregar películas cuando quieras.</p>
        <Link href="/" className="nv-press mt-2 inline-flex h-12 items-center rounded-[14px] bg-berry px-6 text-[15px] font-semibold text-white">
          Continuar
        </Link>
      </div>
    );
  }

  return (
    <section className="nv-fade flex flex-col gap-8">
      <header className="text-center">
        <p className="text-sm font-semibold tracking-wide text-gold-ink uppercase">Para empezar</p>
        <h1 className="mt-2 font-display text-[32px] leading-[1.1] font-bold tracking-[-0.035em] sm:text-[40px]">¿Arrancamos con unas clásicas?</h1>
        <p className="mx-auto mt-2 max-w-lg text-ink-2">Elige las que quieras ver este año y quedan en tu lista. Es opcional: puedes saltarlo y agregar las tuyas después.</p>
      </header>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {picks.map((c) => {
          const on = chosen.has(c.justwatchId);
          return (
            <li key={c.justwatchId}>
              <button
                type="button"
                onClick={() => toggle(c.justwatchId)}
                aria-pressed={on}
                aria-label={`${c.title} (${c.year})`}
                className="group flex w-full flex-col gap-2 text-left"
              >
                <span className={`relative block rounded-[18px] ring-4 transition-[box-shadow,transform] duration-200 group-active:scale-[.97] ${on ? "ring-gold" : "ring-transparent"}`}>
                  <Poster src={c.posterUrl} title={c.title} className="aspect-[2/3] rounded-[18px] shadow-card" />
                  <span
                    aria-hidden
                    className={`absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full border-2 transition-colors ${on ? "border-gold bg-gold text-black" : "border-white/80 bg-black/35 text-transparent"}`}
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                </span>
                <span className="line-clamp-2 text-[15px] leading-snug font-semibold">{c.title}</span>
                <span className="-mt-1.5 text-[13px] text-ink-2">{c.year}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+84px)] flex flex-wrap items-center justify-center gap-3 md:bottom-6">
        <button
          type="button"
          onClick={add}
          disabled={pending || chosen.size === 0}
          className="nv-press h-12 rounded-[14px] bg-berry px-6 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(200,16,46,.35)] disabled:opacity-50"
        >
          {pending ? "Agregando…" : chosen.size ? `Agregar ${chosen.size} a mi lista` : "Elige las que quieras"}
        </button>
        <Link href="/" className="nv-press inline-flex h-12 items-center rounded-[14px] border border-line bg-surface px-5 text-[15px] font-semibold text-ink">
          Ahora no
        </Link>
      </div>
    </section>
  );
}
