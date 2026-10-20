"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, CalendarDays, Check, Clapperboard, Copy, House, LogOut, Moon, Pencil, Plus, Sparkles, Sun, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/avatars/avatar";
import { CAST } from "@/components/avatars/cast";
import { usePrefs } from "@/components/providers";
import { logoutAction } from "@/actions/auth";
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

const iconButton = "nv-press grid size-11 place-items-center rounded-full border border-line bg-surface text-ink";

export function HeaderActions({ profile, home }: { profile: Profile | null; home: HomeInfo | null }) {
  const { dark, toggleTheme, muted, toggleMuted } = usePrefs();
  return (
    <div className="ml-auto flex items-center gap-2">
      <button type="button" onClick={toggleMuted} aria-pressed={!muted} aria-label={muted ? "Activar sonidos" : "Silenciar sonidos"} className={iconButton}>
        {muted ? <BellOff className="size-[19px]" strokeWidth={1.8} aria-hidden /> : <Bell className="size-[19px]" strokeWidth={1.8} aria-hidden />}
      </button>
      <button
        type="button"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          toggleTheme({ x: e.clientX || r.left + r.width / 2, y: e.clientY || r.top + r.height / 2 });
        }}
        aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        className={iconButton}
      >
        {dark ? <Sun className="size-[19px]" strokeWidth={1.8} aria-hidden /> : <Moon className="size-[19px]" strokeWidth={1.8} aria-hidden />}
      </button>
      <Link
        href="/peliculas/nueva"
        className="nv-press hidden h-11 items-center gap-2 rounded-full bg-berry pr-[18px] pl-3.5 text-[15px] font-semibold text-white sm:inline-flex"
      >
        <Plus className="size-[18px]" strokeWidth={2.2} aria-hidden />
        Agregar
      </Link>
      <ProfileMenu profile={profile} home={home} />
    </div>
  );
}

const menuItem = "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-medium text-ink hover:bg-surface-2";

/** The signed-in person's avatar; opens who-am-I, switch profile, share the home and sign out. */
function ProfileMenu({ profile, home }: { profile: Profile | null; home: HomeInfo | null }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Still loading (Suspense fallback): keep the slot so the header doesn't jump.
  if (!profile || !home) return <span aria-hidden className="size-11 rounded-full bg-surface-2" />;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(home!.slug);
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
        <Avatar avatar={profile.avatar} size={44} />
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
          <button type="button" role="menuitem" onClick={copyCode} className={menuItem}>
            {copied ? <Check className="size-[18px] text-pine" strokeWidth={2} aria-hidden /> : <Copy className="size-[18px] text-ink-2" strokeWidth={1.8} aria-hidden />}
            <span className="flex-1">Código de la casa</span>
            <span className="min-w-0 truncate font-mono text-sm text-ink-2">{home.slug}</span>
          </button>
          <div className="my-1 h-px bg-line" />
          <form action={logoutAction}>
            <button type="submit" role="menuitem" className={`${menuItem} text-berry-ink`}>
              <LogOut className="size-[18px]" strokeWidth={1.8} aria-hidden />
              Salir de la casa
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
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 gap-1 border-t border-line bg-glass px-3 pt-2 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur-xl backdrop-saturate-150 md:hidden"
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
      <Link
        href="/peliculas/nueva"
        aria-current={pathname === "/peliculas/nueva" ? "page" : undefined}
        className="flex h-[50px] flex-col items-center justify-center gap-[3px] text-[11px] font-semibold text-ink-2"
      >
        <span className="grid size-7 place-items-center rounded-[9px] bg-berry text-white">
          <Plus className="size-[18px]" strokeWidth={2.4} aria-hidden />
        </span>
        Agregar
      </Link>
    </nav>
  );
}
