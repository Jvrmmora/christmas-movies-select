"use client";

import { useActionState } from "react";
import { LockKeyhole } from "lucide-react";
import { loginAction, type LoginState } from "@/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="mt-8 flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="password" className="text-[13px] font-semibold text-ink-2">
        Clave
      </label>
      <div className="flex h-[52px] items-center gap-2.5 rounded-[14px] border border-line bg-field px-4 focus-within:outline-[2.5px] focus-within:outline-offset-2 focus-within:outline-gold">
        <LockKeyhole className="size-[18px] text-ink-2" strokeWidth={1.8} aria-hidden />
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          aria-invalid={!!state.error}
          aria-describedby={state.error ? "login-error" : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none"
        />
      </div>
      {state.error && (
        <p id="login-error" role="alert" className="text-sm font-medium text-berry-ink">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="nv-press mt-2 h-[52px] rounded-[14px] bg-berry text-base font-semibold text-white disabled:opacity-70">
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
