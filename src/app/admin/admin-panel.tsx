"use client";

import { useState, useTransition } from "react";
import { Copy, Link2, LogOut, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminLogoutAction, createInviteAction, deleteHomeAction, revokeInviteAction } from "@/actions/admin";
import { BrandMark } from "@/components/shell/decor";
import type { AdminHome, AdminInvite, AdminOverview } from "@/lib/types";

// A fixed zone keeps server and browser rendering the same text.
const DAY = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Bogota" });
const day = (iso: string) => DAY.format(new Date(iso));

const STATUS: Record<AdminInvite["status"], { label: string; className: string }> = {
  open: { label: "Disponible", className: "bg-pine-soft text-pine" },
  used: { label: "Usada", className: "bg-surface-2 text-ink-2" },
  expired: { label: "Vencida", className: "bg-berry-soft text-berry-ink" },
};

export function AdminPanel({ overview }: { overview: AdminOverview }) {
  const { homes, invites, cap } = overview;
  const open = invites.filter((i) => i.status === "open").length;
  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-10 px-4 py-10 sm:px-8">
      <header className="flex items-center gap-3">
        <BrandMark />
        <div>
          <h1 className="font-serif text-[28px] leading-tight font-semibold tracking-[-0.02em]">Administración</h1>
          <p className="text-sm text-ink-2">
            {homes.length} de {cap} casas · {open} {open === 1 ? "invitación disponible" : "invitaciones disponibles"}
          </p>
        </div>
        <form action={adminLogoutAction} className="ml-auto">
          <button type="submit" className="nv-press flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold">
            <LogOut className="size-4" strokeWidth={1.9} aria-hidden />
            Salir
          </button>
        </form>
      </header>
      <Invites invites={invites} />
      <Homes homes={homes} />
    </main>
  );
}

function Invites({ invites }: { invites: AdminInvite[] }) {
  const [pending, start] = useTransition();
  const [fresh, setFresh] = useState<string | null>(null);

  const link = (code: string) => `${window.location.origin}/unirse/${code}`;
  async function copy(text: string, ok: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(ok);
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  return (
    <section aria-labelledby="invites">
      <div className="flex items-center justify-between gap-3">
        <h2 id="invites" className="text-xl font-semibold tracking-[-0.01em]">
          Invitaciones
        </h2>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await createInviteAction();
              if (res.ok) setFresh(res.data.code);
              else toast.error(res.error);
            })
          }
          className="nv-press flex h-11 items-center gap-2 rounded-full bg-berry pr-[18px] pl-3.5 text-[15px] font-semibold text-white disabled:opacity-70"
        >
          <Plus className="size-[18px]" strokeWidth={2.2} aria-hidden />
          Crear invitación
        </button>
      </div>

      {fresh && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[18px] border border-gold/50 bg-gold-soft p-4" role="status">
          <span className="font-mono text-lg font-semibold tracking-[0.06em]">{fresh}</span>
          <span className="text-sm text-ink-2">Dura 14 días y sirve una sola vez.</span>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => copy(fresh, "Código copiado")} className="nv-press flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold">
              <Copy className="size-4" aria-hidden /> Código
            </button>
            <button type="button" onClick={() => copy(link(fresh), "Enlace copiado")} className="nv-press flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold">
              <Link2 className="size-4" aria-hidden /> Enlace
            </button>
          </div>
        </div>
      )}

      {invites.length === 0 ? (
        <p className="mt-4 text-sm text-ink-2">Aún no hay invitaciones.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-surface">
          {invites.map((invite) => (
            <li key={invite.code} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
              <span className="font-mono text-[15px] font-semibold tracking-[0.05em]">{invite.code}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS[invite.status].className}`}>{STATUS[invite.status].label}</span>
              <span className="text-sm text-ink-2">
                {invite.status === "used"
                  ? `Creó ${invite.usedBySlug ? `«${invite.usedBySlug}»` : "una casa que ya no existe"}`
                  : `Vence el ${day(invite.expiresAt)}`}
              </span>
              {invite.status === "open" && (
                <div className="ml-auto flex gap-2">
                  <button type="button" onClick={() => copy(link(invite.code), "Enlace copiado")} className="nv-press grid size-9 place-items-center rounded-full border border-line" aria-label={`Copiar enlace de ${invite.code}`}>
                    <Link2 className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const res = await revokeInviteAction(invite.code);
                        if (!res.ok) toast.error(res.error);
                      })
                    }
                    className="nv-press grid size-9 place-items-center rounded-full border border-line text-berry-ink"
                    aria-label={`Revocar ${invite.code}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
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
        <span className="font-mono text-sm text-ink-2">{home.slug}</span>
        <span className="text-sm text-ink-2">
          {home.profiles} {home.profiles === 1 ? "perfil" : "perfiles"} · {home.movies} {home.movies === 1 ? "película" : "películas"}
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
            Borra la casa, sus perfiles, películas y calendario. Escribe <strong className="font-mono">{home.slug}</strong> para confirmar:
          </label>
          <input
            id={`confirm-${home.id}`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="h-10 min-w-0 flex-1 rounded-[10px] border border-line bg-field px-3 font-mono text-sm"
          />
          <button type="submit" disabled={pending || typed.trim().toLowerCase() !== home.slug} className="nv-press h-10 rounded-full bg-berry px-4 text-sm font-semibold text-white disabled:opacity-50">
            Eliminar
          </button>
        </form>
      )}
    </li>
  );
}
