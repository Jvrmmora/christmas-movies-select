"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BellOff, CalendarDays, Clapperboard, House, LogOut, Moon, Plus, Sparkles, Sun } from "lucide-react";
import { usePrefs } from "@/components/providers";
import { logoutAction } from "@/actions/auth";

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

export function HeaderActions() {
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
      <form action={logoutAction} className="hidden sm:block">
        <button type="submit" aria-label="Salir" title="Salir" className={iconButton}>
          <LogOut className="size-[18px]" strokeWidth={1.8} aria-hidden />
        </button>
      </form>
      <Link
        href="/peliculas/nueva"
        className="nv-press hidden h-11 items-center gap-2 rounded-full bg-berry pr-[18px] pl-3.5 text-[15px] font-semibold text-white sm:inline-flex"
      >
        <Plus className="size-[18px]" strokeWidth={2.2} aria-hidden />
        Agregar
      </Link>
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
