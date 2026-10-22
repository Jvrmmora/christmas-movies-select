import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeading } from "@/components/auth/auth-shell";
import { normalizeInviteCode } from "@/lib/invite-code";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthHeading title="Bienvenido a casa" subtitle="Entra con tu correo y tu clave.">
      <Suspense fallback={<LoginForm next="/" />}>
        <LoginWithNext searchParams={searchParams} />
      </Suspense>
    </AuthHeading>
  );
}

async function LoginWithNext({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/";
  // Came from an invite link with an account already: after signing in, step 2 opens with this code.
  const invite = typeof params.codigo === "string" ? normalizeInviteCode(params.codigo) : null;
  return <LoginForm next={next} invite={invite ?? undefined} />;
}
