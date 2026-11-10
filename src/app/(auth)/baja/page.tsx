import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeading } from "@/components/auth/auth-shell";
import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata: Metadata = { title: "Dejar de recibir el recordatorio" };

// Opened from the link at the bottom of a reminder e-mail; public, because the signed link itself says whose it is.
export default function UnsubscribePage({ searchParams }: PageProps<"/baja">) {
  return (
    <Suspense fallback={<p className="text-ink-2">Un momento…</p>}>
      <Unsubscribe searchParams={searchParams} />
    </Suspense>
  );
}

async function Unsubscribe({ searchParams }: { searchParams: PageProps<"/baja">["searchParams"] }) {
  const params = await searchParams;
  const token = typeof params.t === "string" ? params.t : "";
  return (
    <AuthHeading title="¿Dejar de recibir el recordatorio?" subtitle="Ya no te enviaremos el correo diario «Hoy toca». Puedes volver a activarlo cuando quieras en Ajustes.">
      <UnsubscribeForm token={token} />
    </AuthHeading>
  );
}
