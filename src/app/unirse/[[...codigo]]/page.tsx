import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { JoinForm } from "./join-form";

export const metadata: Metadata = { title: "Crear mi casa" };

export default function JoinPage({ params }: PageProps<"/unirse/[[...codigo]]">) {
  return (
    <AuthShell title="Crea tu casa" subtitle="Tu propia lista de películas navideñas y calendario de adviento, con perfiles para cada quien.">
      <Suspense fallback={<JoinForm invite="" />}>
        <JoinWithCode params={params} />
      </Suspense>
    </AuthShell>
  );
}

// The link NAVI-XXXX-XXXX can be shared as /unirse/NAVI-XXXX-XXXX; it only pre-fills the field.
async function JoinWithCode({ params }: { params: PageProps<"/unirse/[[...codigo]]">["params"] }) {
  const { codigo } = await params;
  return <JoinForm invite={codigo?.[0] ? decodeURIComponent(codigo[0]).slice(0, 20) : ""} />;
}
