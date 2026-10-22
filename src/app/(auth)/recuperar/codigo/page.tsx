import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading } from "@/components/auth/auth-shell";
import { RecoverForm } from "./recover-form";

export const metadata: Metadata = { title: "Recuperar con código" };

// For homes created before sign-up asked for an e-mail: they still hold the code they saved back then.
export default function RecoverWithCodePage() {
  return (
    <AuthHeading title="Recuperar con código" subtitle="Para casas antiguas: con el código de recuperación que guardaron al crearla pueden elegir una clave nueva.">
      <RecoverForm />
      <p className="mt-4 text-center text-sm text-ink-2">
        ¿Tienen un correo registrado?{" "}
        <Link href="/recuperar" className="font-semibold text-gold-ink underline-offset-4 hover:underline">
          Recibir un código por correo
        </Link>
      </p>
    </AuthHeading>
  );
}
