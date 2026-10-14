"use client";

import { createContext, use, useCallback, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { Toaster } from "sonner";
import { playSound, type SoundName } from "@/lib/sounds";

const THEME_KEY = "nv-theme";
const SOUND_KEY = "nv-muted";
const SOUND_EVENT = "nv-muted-change";

interface Prefs {
  dark: boolean;
  /** Pass the click point so the circle grows from the pointer. */
  toggleTheme: (origin?: { x: number; y: number }) => void;
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

/** Runs before paint (inlined in <head>) so the page never flashes the wrong theme. */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(_){}})();`;

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

  const toggleTheme = useCallback(
    (origin?: { x: number; y: number }) => {
      const next = !getDark();
      const apply = () => {
        document.documentElement.classList.toggle("dark", next);
        writeStorage(THEME_KEY, next ? "dark" : "light");
      };
      play("swoosh");
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

  const value = useMemo(() => ({ dark, toggleTheme, muted, toggleMuted, play }), [dark, toggleTheme, muted, toggleMuted, play]);

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
