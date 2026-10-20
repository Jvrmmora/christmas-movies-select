"use client";

import { createContext, use, useCallback, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { Toaster } from "sonner";
import { playSound, type SoundName } from "@/lib/sounds";
import { NIGHT_END, NIGHT_START, parseMode, resolveDark, THEME_COLORS, THEME_KEY, type ThemeMode } from "@/lib/theme";

const THEME_EVENT = "nv-theme-change";
const SOUND_KEY = "nv-muted";
const SOUND_EVENT = "nv-muted-change";

interface Prefs {
  dark: boolean;
  /** "auto" follows the person's local clock (dark at night). */
  mode: ThemeMode;
  /** Pass the click point so the circle grows from the pointer. */
  setMode: (mode: ThemeMode, origin?: { x: number; y: number }) => void;
  muted: boolean;
  toggleMuted: () => void;
  play: (name: SoundName) => void;
}

const PrefsContext = createContext<Prefs | null>(null);

export function usePrefs(): Prefs {
  const value = use(PrefsContext);
  if (!value) throw new Error("usePrefs must be used inside <Providers>");
  return value;
}

/**
 * Runs before paint (inlined in <head>) so the page never flashes the wrong theme.
 * Mirrors `resolveDark`: a saved "light"/"dark" wins, otherwise the local hour decides.
 */
export const themeScript = `(function(){try{var t=null;try{t=localStorage.getItem("${THEME_KEY}")}catch(_){}var h=new Date().getHours();var d=t==="dark"||(t!=="light"&&(h>=${NIGHT_START}||h<${NIGHT_END}));document.documentElement.classList.toggle("dark",d);}catch(_){}})();`;

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode: preferences just won't persist.
  }
}

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
const getDark = () => document.documentElement.classList.contains("dark");

function subscribeMode(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
const getMode = () => parseMode(readStorage(THEME_KEY));
const getAuto = (): ThemeMode => "auto";

function applyDark(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? THEME_COLORS.dark : THEME_COLORS.light);
}

function subscribeMuted(onChange: () => void) {
  window.addEventListener(SOUND_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SOUND_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
const getMuted = () => readStorage(SOUND_KEY) === "1";
const getFalse = () => false;

export function Providers({ children }: { children: ReactNode }) {
  const dark = useSyncExternalStore(subscribeTheme, getDark, getFalse);
  const muted = useSyncExternalStore(subscribeMuted, getMuted, getFalse);

  const play = useCallback(
    (name: SoundName) => {
      if (!muted) playSound(name);
    },
    [muted],
  );

  const mode = useSyncExternalStore(subscribeMode, getMode, getAuto);

  // Automatic mode: switch at dusk and dawn, and when coming back to the tab.
  useEffect(() => {
    const sync = () => {
      const next = resolveDark(getMode(), new Date());
      if (next !== getDark()) applyDark(next);
    };
    sync();
    if (mode !== "auto") return;
    const timer = window.setInterval(sync, 60_000);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [mode]);

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? THEME_COLORS.dark : THEME_COLORS.light);
  }, [dark]);

  const setMode = useCallback(
    (next: ThemeMode, origin?: { x: number; y: number }) => {
      writeStorage(THEME_KEY, next);
      window.dispatchEvent(new Event(THEME_EVENT));
      const nextDark = resolveDark(next, new Date());
      if (nextDark === getDark()) return;
      play("swoosh");
      const apply = () => applyDark(nextDark);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!document.startViewTransition || reduce) {
        apply();
        return;
      }
      const x = origin?.x ?? window.innerWidth - 40;
      const y = origin?.y ?? 40;
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      const transition = document.startViewTransition(apply);
      transition.ready
        .then(() => {
          document.documentElement.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 700, easing: "cubic-bezier(.65,0,.35,1)", pseudoElement: "::view-transition-new(root)" },
          );
        })
        .catch(() => {});
    },
    [play],
  );

  const toggleMuted = useCallback(() => {
    const next = !getMuted();
    writeStorage(SOUND_KEY, next ? "1" : "0");
    window.dispatchEvent(new Event(SOUND_EVENT));
    if (!next) playSound("bell");
  }, []);

  const value = useMemo(() => ({ dark, mode, setMode, muted, toggleMuted, play }), [dark, mode, setMode, muted, toggleMuted, play]);

  return (
    <PrefsContext value={value}>
      {children}
      <Toaster
        position="bottom-center"
        theme={dark ? "dark" : "light"}
        offset={96}
        mobileOffset={96}
        toastOptions={{
          style: {
            borderRadius: 14,
            background: "var(--ink)",
            color: "var(--bg)",
            border: "none",
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
          },
        }}
      />
    </PrefsContext>
  );
}
