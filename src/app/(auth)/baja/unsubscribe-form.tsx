"use client";

import Link from "next/link";
import { useActionState } from "react";
import { unsubscribeAction, type UnsubscribeState } from "@/actions/reminders";
import { FormError, SubmitButton } from "@/components/auth/fields";

/** A button on purpose: mail scanners open links on their own, and that must never switch anyone off. */
export function UnsubscribeForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<UnsubscribeState, FormData>(unsubscribeAction, {});

  if (state.done) {
    return (
      <div className="nv-fade mt-7 flex flex-col gap-4">
        <p className="rounded-[14px] bg-pine-soft p-4 text-[15px] font-medium">Listo: no volverás a recibir el recordatorio diario.</p>
        <Link href="/" className="text-center text-sm font-medium text-ink-2 underline-offset-4 hover:underline">
          Ir a Navidad en casa
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-7 flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <FormError>{state.error}</FormError>
      <SubmitButton pending={pending} idle="Sí, dejar de recibirlo" busy="Guardando…" />
      <Link href="/" className="text-center text-sm font-medium text-ink-2 underline-offset-4 hover:underline">
        No, volver
      </Link>
    </form>
  );
}
