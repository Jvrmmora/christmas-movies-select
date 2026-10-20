"use client";

import { useActionState } from "react";
import { LockKeyhole } from "lucide-react";
import { adminLoginAction, type AdminLoginState } from "@/actions/admin";
import { Field, FormError, SubmitButton } from "@/components/auth/fields";

export function AdminLogin() {
  const [state, action, pending] = useActionState<AdminLoginState, FormData>(adminLoginAction, {});
  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <Field id="password" label="Clave de administración" icon={LockKeyhole} type="password" required autoFocus autoComplete="current-password" />
      <FormError>{state.error}</FormError>
      <SubmitButton pending={pending} idle="Entrar" busy="Entrando…" />
    </form>
  );
}
