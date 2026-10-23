"use client";

import { useState, useTransition } from "react";
import { LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminLogoutAction, deleteHomeAction } from "@/actions/admin";
import { BrandMark } from "@/components/shell/decor";
import type { AdminHome, AdminOverview } from "@/lib/types";

// A fixed zone keeps server and browser rendering the same text.
const DAY = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const day = (iso: string) => DAY.format(new Date(iso));

export function AdminPanel({ overview }: { overview: AdminOverview }) {
  const { homes, cap } = overview;
  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-10 px-4 py-10 sm:px-8">
      <header className="flex items-center gap-3">
        <BrandMark />
        <div>
          <h1 className="font-display text-[28px] leading-tight font-bold tracking-[-0.03em]">Administración</h1>
          <p className="text-sm text-ink-2">
            {homes.length} de {cap} casas · cualquiera puede crear una cuenta y una casa (máx. 3 por día desde la misma conexión)
          </p>
        </div>
        <form action={adminLogoutAction} className="ml-auto">
          <button type="submit" className="nv-press flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold">
            <LogOut className="size-4" strokeWidth={1.9} aria-hidden />
            Salir
          </button>
        </form>
      </header>
      <Homes homes={homes} />
    </main>
  );
}

function Homes({ homes }: { homes: AdminHome[] }) {
  return (
    <section aria-labelledby="homes">
      <h2 id="homes" className="text-xl font-semibold tracking-[-0.01em]">
        Casas
      </h2>
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-surface">
        {homes.map((home) => (
          <HomeRow key={home.id} home={home} />
        ))}
        {homes.length === 0 && <li className="px-4 py-3 text-sm text-ink-2">Todavía no hay casas.</li>}
      </ul>
    </section>
  );
}

function HomeRow({ home }: { home: AdminHome }) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");

  return (
    <li className="flex flex-col gap-3 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold">{home.name}</span>
        <span className="font-mono text-sm text-ink-2">{home.inviteCode}</span>
        <span className="text-sm text-ink-2">
          {home.accounts} {home.accounts === 1 ? "cuenta" : "cuentas"} · {home.profiles} {home.profiles === 1 ? "perfil" : "perfiles"} · {home.movies} {home.movies === 1 ? "película" : "películas"}
        </span>
        <span className="text-sm text-ink-2">Activa: {day(home.lastActiveAt)}</span>
        <button
          type="button"
          onClick={() => setConfirming((v) => !v)}
          className="nv-press ml-auto grid size-9 place-items-center rounded-full border border-line text-berry-ink"
          aria-label={`Eliminar la casa ${home.name}`}
          aria-expanded={confirming}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
      {confirming && (
        <form
          className="flex flex-wrap items-center gap-2 rounded-[14px] bg-berry-soft p-3"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await deleteHomeAction(home.id, typed);
              if (!res.ok) toast.error(res.error);
              else toast.success(`Casa «${home.name}» eliminada`);
            });
          }}
        >
          <label htmlFor={`confirm-${home.id}`} className="text-sm">
            Borra la casa, sus perfiles, películas y calendario. Escribe <strong>{home.name}</strong> para confirmar:
          </label>
          <input
            id={`confirm-${home.id}`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="h-10 min-w-0 flex-1 rounded-[10px] border border-line bg-field px-3 text-sm"
          />
          <button type="submit" disabled={pending || typed.trim().toLowerCase() !== home.name.trim().toLowerCase()} className="nv-press h-10 rounded-full bg-berry px-4 text-sm font-semibold text-white disabled:opacity-50">
            Eliminar
          </button>
        </form>
      )}
    </li>
  );
}
