import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/auth-shell";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Recuperar acceso" };

export default function RecoverPage() {
  return (
    <AuthHeading title="Recuperar acceso" subtitle="Les enviamos un código al correo de la casa para elegir una clave nueva.">
      <ResetForm />
    </AuthHeading>
  );
}
