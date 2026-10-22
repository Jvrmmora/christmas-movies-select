"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, CalendarDays, Check, Clapperboard, Copy, House, LogOut, Moon, Pencil, Plus, Settings, Sparkles, Sun, SunMoon, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/avatars/avatar";
import { CAST } from "@/components/avatars/cast";
import { usePrefs } from "@/components/providers";
import { logoutAction } from "@/actions/auth";
import type { ThemeMode } from "@/lib/theme";
import type { HomeInfo, Profile } from "@/lib/types";

const LINKS = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/peliculas", label: "Películas", icon: Clapperboard },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/sugeridas", label: "Sugeridas", icon: Sparkles },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks() {
  return <NavLinksView pathname={usePathname()} />;
}

/** Also the Suspense fallback (no active state) while the URL is unknown. */
export function NavLinksView({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Principal" className="hidden gap-1 rounded-full bg-surface-2 p-1 md:flex">
      {LINKS.map(({ href, label }) => {
        const active = pathname !== null && isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-[18px] py-2 text-sm transition-colors ${
              active ? "bg-surface font-semibold text-ink shadow-card" : "font-medium text-ink-2 hover:text-ink"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

const iconButton = "nv-press grid size-10 place-items-center rounded-full border border-line bg-surface text-ink";

export function HeaderActions({ profile, home }: { profile: Profile | null; home: HomeInfo | null }) {
  const { muted, toggleMuted } = usePrefs();
  return (
    <div className="ml-auto flex items-center gap-2">
      <button type="button" onClick={toggleMuted} aria-pressed={!muted} aria-label={muted ? "Activar sonidos" : "Silenciar sonidos"} className={`${iconButton} max-sm:hidden`}>
        {muted ? <BellOff className="size-[18px]" strokeWidth={1.8} aria-hidden /> : <Bell className="size-[18px]" strokeWidth={1.8} aria-hidden />}
      </button>
      <ThemeMenu />
      <ProfileMenu profile={profile} home={home} />
    </div>
  );
}

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: "auto", label: "Automático", icon: SunMoon },
  { mode: "light", label: "Claro", icon: Sun },
  { mode: "dark", label: "Oscuro", icon: Moon },
];

/** Automático (by the local clock), Claro or Oscuro. */
function ThemeMenu() {
  const { dark, mode, setMode } = usePrefs();
  const [open, setOpen] = useState(false);
  const root = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  const current = THEME_OPTIONS.find((o) => o.mode === mode)!;

  return (
    <div ref={root} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={`Tema: ${current.label}`} className={`${iconButton} relative`}>
        {dark ? <Moon className="size-[18px]" strokeWidth={1.8} aria-hidden /> : <Sun className="size-[18px]" strokeWidth={1.8} aria-hidden />}
        {mode === "auto" && (
          <span aria-hidden className="absolute -right-0.5 -bottom-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-[3px] text-[10px] leading-none font-bold text-[#1c1c1e]">
            A
          </span>
        )}
      </button>
      {open && (
        <div role="menu" aria-label="Tema" className="nv-pop-in absolute top-[calc(100%+10px)] right-0 z-50 w-[232px] rounded-[18px] border border-line bg-surface p-1.5 shadow-card">
          <p className="px-3 pt-2 pb-1.5 text-xs text-ink-2">Automático: oscuro de 6 p. m. a 6 a. m. según su hora.</p>
          {THEME_OPTIONS.map(({ mode: m, label, icon: Icon }) => (
            <button
              key={m}
              type="button"
              role="menuitemradio"
              aria-checked={mode === m}
              onClick={(e) => {
                setOpen(false);
                const r = e.currentTarget.getBoundingClientRect();
                setMode(m, { x: e.clientX || r.left + r.width / 2, y: e.clientY || r.top + r.height / 2 });
              }}
              className={menuItem}
            >
              <Icon className="size-[18px] text-ink-2" strokeWidth={1.8} aria-hidden />
              <span className="flex-1">{label}</span>
              {mode === m && <Check className="size-4 text-pine" strokeWidth={2.2} aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Closes a popover on outside click or Escape. */
function useDismiss<T extends HTMLElement>(open: boolean, close: () => void) {
  const root = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return root;
}

const menuItem = "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-medium text-ink hover:bg-surface-2";

/** The signed-in person's avatar; opens who-am-I, switch profile, share the home and sign out. */
function ProfileMenu({ profile, home }: { profile: Profile | null; home: HomeInfo | null }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const root = useDismiss<HTMLDivElement>(open, () => setOpen(false));

  // Still loading (Suspense fallback): keep the slot so the header doesn't jump.
  if (!profile || !home) return <span aria-hidden className="size-10 rounded-full bg-surface-2" />;

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/unirse/${home!.inviteCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Perfil de ${profile.name}`}
        className="nv-press nv-av-host block rounded-full ring-2 ring-line transition-shadow hover:ring-gold aria-expanded:ring-gold"
      >
        <Avatar avatar={profile.avatar} size={40} />
      </button>
      {open && (
        <div role="menu" aria-label="Perfil" className="nv-pop-in absolute top-[calc(100%+10px)] right-0 z-50 w-[280px] rounded-[20px] border border-line bg-surface p-2 shadow-card">
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar avatar={profile.avatar} size={48} animated />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{profile.name}</p>
              <p className="truncate text-[13px] text-ink-2">
                {CAST[profile.avatar.character].name} · {home.name}
              </p>
            </div>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link role="menuitem" href="/perfiles" onClick={() => setOpen(false)} className={menuItem}>
            <Users className="size-[18px] text-ink-2" strokeWidth={1.8} aria-hidden />
            Cambiar de perfil
          </Link>
          <Link role="menuitem" href={`/perfiles?editar=${profile.id}`} onClick={() => setOpen(false)} className={menuItem}>
            <Pencil className="size-[18px] text-ink-2" strokeWidth={1.8} aria-hidden />
            Editar mi perfil
          </Link>
          <button type="button" role="menuitem" onClick={copyInvite} className={menuItem}>
            {copied ? <Check className="size-[18px] text-pine" strokeWidth={2} aria-hidden /> : <Copy className="size-[18px] text-ink-2" strokeWidth={1.8} aria-hidden />}
            <span className="flex-1">{copied ? "Link copiado" : "Copiar link de invitación"}</span>
          </button>
          <Link role="menuitem" href="/ajustes" onClick={() => setOpen(false)} className={menuItem}>
            <Settings className="size-[18px] text-ink-2" strokeWidth={1.8} aria-hidden />
            Ajustes de la casa
          </Link>
          <div className="my-1 h-px bg-line" />
          <form action={logoutAction}>
            <button type="submit" role="menuitem" className={`${menuItem} text-berry-ink`}>
              <LogOut className="size-[18px]" strokeWidth={1.8} aria-hidden />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function TabBar() {
  return <TabBarView pathname={usePathname()} />;
}

export function TabBarView({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 gap-1 border-t border-line bg-glass px-3 pt-2 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur-xl backdrop-saturate-150 md:hidden"
    >
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname !== null && isActive(pathname, href) && pathname !== "/peliculas/nueva";
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex h-[50px] flex-col items-center justify-center gap-[3px] text-[11px] font-semibold ${active ? "text-berry-ink" : "text-ink-2"}`}
          >
            <Icon className="size-6" strokeWidth={active ? 2 : 1.8} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Floating "Agregar": bottom-right pill on desktop, a round button above the tab bar on phones. */
export function AddFab() {
  const pathname = usePathname();
  if (pathname === "/peliculas/nueva" || pathname.endsWith("/editar") || pathname.startsWith("/peliculas/importar")) return null;
  // On phones the calendar's "Sin asignar" sheet owns the bottom of the screen.
  const hideOnPhone = pathname === "/calendario";
  return (
    <Link
      href="/peliculas/nueva"
      aria-label="Agregar película"
      className={`${hideOnPhone ? "max-md:hidden " : ""}nv-fab fixed right-4 bottom-[calc(86px+max(env(safe-area-inset-bottom),12px))] z-30 grid size-14 place-items-center rounded-full bg-berry text-white md:right-8 md:bottom-8 md:flex md:h-14 md:w-auto md:items-center md:gap-2 md:pr-[22px] md:pl-[18px]`}
    >
      <Plus className="size-[22px]" strokeWidth={2.4} aria-hidden />
      <span className="hidden text-[15px] font-semibold md:inline">Agregar</span>
    </Link>
  );
}
