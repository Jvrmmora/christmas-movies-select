"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AtSign, House, LockKeyhole, Mail } from "lucide-react";
import { createHomeAction, type HomeFormState } from "@/actions/home";
import { AuthHeading } from "@/components/auth/auth-shell";
import { Field, FormError, SubmitButton } from "@/components/auth/fields";
import { RecoveryCode } from "@/components/auth/recovery-code";
import { homeSlugFromName } from "@/lib/slug";

export function JoinForm() {
  const [state, action, pending] = useActionState<HomeFormState, FormData>(createHomeAction, {});
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  // The code follows the name until the person chooses to change it.
  const [editing, setEditing] = useState(false);
  const suggested = name.trim() ? homeSlugFromName(name) : "";

  if (state.slug) {
    return (
      <AuthHeading title={`¡${name.trim() || "Su casa"} está lista!`} subtitle="Este es el código con el que entrarán.">
        <RecoveryCode homeSlug={state.slug} continueLabel="Crear mi primer perfil" />
      </AuthHeading>
    );
  }

  return (
    <AuthHeading title="Crea tu casa" subtitle="Nombre, correo y clave. Sin invitaciones.">
    <form action={action} className="mt-7 flex flex-col gap-4">
      <input type="hidden" name="slugAuto" value={editing ? "0" : "1"} />
      <div className="flex flex-col gap-2">
        <Field
          id="name"
          label="Nombre de la casa"
          icon={House}
          type="text"
          required
          autoFocus
          maxLength={40}
          autoComplete="off"
          placeholder="Casa Montaño"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {!editing && (
          <p className="flex min-h-5 flex-wrap items-center gap-x-1.5 text-[13px] text-ink-2">
            {suggested ? (
              <>
                Para entrar usarán <strong className="font-mono font-semibold text-ink">{suggested}</strong>
                <button
                  type="button"
                  onClick={() => {
                    setSlug(suggested);
                    setEditing(true);
                  }}
                  className="font-semibold text-gold-ink underline-offset-4 hover:underline"
                >
                  Cambiar
                </button>
              </>
            ) : (
              "Con el código de la casa (sale del nombre) y la clave entra toda la familia."
            )}
          </p>
        )}
      </div>
      {editing && (
        <div className="nv-fade">
          <Field
            id="slug"
            label="Código de la casa"
            icon={AtSign}
            type="text"
            required
            minLength={3}
            maxLength={24}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
            hint="Letras, números y guiones."
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
      )}
      <Field
        id="email"
        label="Correo"
        icon={Mail}
        type="email"
        required
        maxLength={254}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="email"
        placeholder="familia@correo.com"
        hint="Aquí les enviamos un código si olvidan la clave."
      />
      <Field id="password" label="Clave" icon={LockKeyhole} type="password" required minLength={6} autoComplete="new-password" placeholder="Mínimo 6 caracteres" />
      <FormError>{state.error}</FormError>
      <SubmitButton pending={pending} idle="Crear mi casa" busy="Creando…" />
      <p className="text-center text-sm text-ink-2">
        ¿Ya tienen casa?{" "}
        <Link href="/login" className="font-semibold text-gold-ink underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
    </AuthHeading>
  );
}
