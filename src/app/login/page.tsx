import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthShell title="Navidad en casa" subtitle="Sus películas de Navidad, dónde verlas y su calendario de adviento.">
      <Suspense fallback={<LoginForm next="/" />}>
        <LoginWithNext searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function LoginWithNext({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/";
  return <LoginForm next={next} />;
}
