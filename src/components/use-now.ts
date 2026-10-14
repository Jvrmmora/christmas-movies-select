"use client";

import { useSyncExternalStore } from "react";

// One shared 1s ticker for every clock on screen. On the server (and during
// hydration) it reports null, so time-dependent UI renders only in the browser,
// in the household's own timezone.
const listeners = new Set<() => void>();
let now = 0;
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(onChange);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

function getSnapshot() {
  if (!now) now = Date.now();
  return now;
}

const getServerSnapshot = () => 0;

export function useNow(): Date | null {
  const t = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return t ? new Date(t) : null;
}
