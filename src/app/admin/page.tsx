import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { getAdminOverview } from "@/lib/dal";
import { AdminLogin } from "./admin-login";
import { AdminPanel } from "./admin-panel";

export const metadata: Metadata = { title: "Administración" };

export default function AdminPage() {
  return (
    <Suspense fallback={<AuthShell title="Administración" />}>
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  const overview = await getAdminOverview();
  if (!overview) {
    return (
      <AuthShell title="Administración" subtitle="Invitaciones y casas de Navidad en casa.">
        <AdminLogin />
      </AuthShell>
    );
  }
  return <AdminPanel overview={overview} />;
}
