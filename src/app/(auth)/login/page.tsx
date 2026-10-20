import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeading } from "@/components/auth/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthHeading title="Bienvenidos a casa" subtitle="Entren con el código de su casa y su clave.">
      <Suspense fallback={<LoginForm next="/" />}>
        <LoginWithNext searchParams={searchParams} />
      </Suspense>
    </AuthHeading>
  );
}

async function LoginWithNext({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/";
  return <LoginForm next={next} />;
}
