"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Gift, House, LockKeyhole, Type } from "lucide-react";
import { createHomeAction, type HomeFormState } from "@/actions/home";
import { Field, FormError, SubmitButton } from "@/components/auth/fields";
import { RecoveryCode } from "@/components/auth/recovery-code";
import { slugify } from "@/lib/slug";

export function JoinForm({ invite }: { invite: string }) {
  const [state, action, pending] = useActionState<HomeFormState, FormData>(createHomeAction, {});
  const [code, setCode] = useState(invite);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  // Until the person edits the code themselves, it follows the name they type.
  const [slugTouched, setSlugTouched] = useState(false);

  if (state.recoveryCode) {
    return <RecoveryCode code={state.recoveryCode} continueLabel="Crear mi primer perfil" />;
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <Field
        id="invite"
        label="Código de invitación"
        icon={Gift}
        type="text"
        required
        value={code}
        onChange={(e) => setCode(e.target.value)}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="off"
        placeholder="NAVI-XXXX-XXXX"
      />
      <Field
        id="name"
        label="Nombre de la casa"
        icon={Type}
        type="text"
        required
        maxLength={40}
        autoComplete="off"
        placeholder="Casa Montaño"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (!slugTouched) setSlug(slugify(e.target.value));
        }}
      />
      <Field
        id="slug"
        label="Código de la casa"
        icon={House}
        type="text"
        required
        minLength={3}
        maxLength={24}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="off"
        hint="Con él (y la clave) entra toda la familia. Letras, números y guiones."
        value={slug}
        onChange={(e) => {
          setSlugTouched(true);
          setSlug(e.target.value);
        }}
      />
      <Field id="password" label="Clave de la casa" icon={LockKeyhole} type="password" required minLength={6} autoComplete="new-password" hint="Mínimo 6 caracteres." />
      <FormError>{state.error}</FormError>
      <SubmitButton pending={pending} idle="Crear mi casa" busy="Creando…" />
      <p className="text-center text-sm text-ink-2">
        ¿Ya tienes casa?{" "}
        <Link href="/login" className="font-medium text-berry-ink underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
