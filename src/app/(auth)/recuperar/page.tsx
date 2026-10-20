import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/auth-shell";
import { RecoverForm } from "./recover-form";

export const metadata: Metadata = { title: "Recuperar acceso" };

export default function RecoverPage() {
  return (
    <AuthHeading title="Recuperar acceso" subtitle="Con el código de recuperación que guardaron al crear la casa pueden elegir una clave nueva.">
      <RecoverForm />
    </AuthHeading>
  );
}
