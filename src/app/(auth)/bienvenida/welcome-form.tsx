"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { House, Ticket } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { createHomeAction, joinHomeAction, type HomeFormState } from "@/actions/home";
import { AuthHeading } from "@/components/auth/auth-shell";
import { CountryField, Field, FormError, SubmitButton } from "@/components/auth/fields";
import { guessCountry } from "@/lib/countries";

type Tab = "create" | "join";

/** The browser language never changes while the page is open, so there is nothing to subscribe to. */
const subscribeNever = () => () => {};

export function WelcomeForm({
  email,
  code,
  invite,
  countries,
}: {
  email: string;
  /** Countries a new home can pick, named in Spanish. */
  countries: { code: string; name: string }[];
  /** The code from an invite link, valid or not. */
  code?: string;
  /** The home behind `code`, when it still works. */
  invite?: { name: string; inviteCode: string };
}) {
  const [tab, setTab] = useState<Tab>(code ? "join" : "create");
  const [created, create, creating] = useActionState<HomeFormState, FormData>(createHomeAction, {});
  const [joined, join, joining] = useActionState<HomeFormState, FormData>(joinHomeAction, {});
  // Start from the country in the browser's language when we serve it (nothing on the server, so both sides agree); the person can change it.
  const language = useSyncExternalStore(subscribeNever, () => navigator.language, () => "");
  const [picked, setPicked] = useState<string | null>(null);
  const country = picked ?? guessCountry(language) ?? "";

  return (
    <AuthHeading
      title={invite ? `Únete a ${invite.name}` : "¿Dónde verán las pelis?"}
      subtitle={invite ? "Confirma el código y entras a la casa." : "Crea la casa de tu familia, o únete a una con su código de invitación."}
    >
      <div role="tablist" aria-label="Crear o unirse" className="mt-7 grid grid-cols-2 gap-1 rounded-[14px] border border-line bg-field p-1">
        {(
          [
            ["create", "Crear casa"],
            ["join", "Tengo un código"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className="h-10 rounded-[10px] text-[15px] font-semibold text-ink-2 aria-selected:bg-surface aria-selected:text-ink aria-selected:shadow-card"
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "create" ? (
        <form action={create} className="nv-fade mt-5 flex flex-col gap-4">
          <Field id="name" label="Nombre de la casa" icon={House} type="text" required autoFocus maxLength={40} autoComplete="off" placeholder="Casa Montaño" />
          <CountryField label="País de la casa" countries={countries} value={country} onChange={setPicked} hint="De ahí salen las plataformas donde ver cada película. Puedes cambiarlo después en Ajustes." />
          <p className="-mt-2 text-[13px] text-ink-2">Después podrás invitar a tu familia con un link.</p>
          <FormError>{created.error}</FormError>
          <SubmitButton pending={creating} idle="Crear mi casa" busy="Creando…" />
        </form>
      ) : (
        <form action={join} className="nv-fade mt-5 flex flex-col gap-4">
          <Field
            id="code"
            label="Código de invitación"
            icon={Ticket}
            type="text"
            required
            autoFocus
            maxLength={20}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
            placeholder="NAVI-XXXX-XXXX"
            defaultValue={code}
            hint="Lo encuentra cualquiera de la casa en Ajustes, o en su menú de perfil."
          />
          {code && !invite && !joined.error && <p className="-mt-2 text-sm text-berry-ink">Ese código ya no funciona. Pide el más reciente a tu familia.</p>}
          <FormError>{joined.error}</FormError>
          <SubmitButton pending={joining} idle="Unirme a la casa" busy="Uniendo…" />
        </form>
      )}

      <form action={logoutAction} className="mt-6 text-center text-sm text-ink-2">
        Entraste como <strong className="text-ink">{email}</strong> ·{" "}
        <button type="submit" className="font-semibold text-gold-ink underline-offset-4 hover:underline">
          Usar otra cuenta
        </button>
      </form>
    </AuthHeading>
  );
}
