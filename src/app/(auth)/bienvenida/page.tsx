import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUser } from "@/lib/dal";
import { findHomeByInvite } from "@/lib/homes";
import { normalizeInviteCode } from "@/lib/invite-code";
import { WelcomeForm } from "./welcome-form";

export const metadata: Metadata = { title: "Tu casa" };

// Step 2 of sign-up: the account exists; now it creates a home or joins one.
export default function WelcomePage({ searchParams }: PageProps<"/bienvenida">) {
  return (
    <Suspense fallback={<p className="text-ink-2">Un momento…</p>}>
      <Welcome searchParams={searchParams} />
    </Suspense>
  );
}

async function Welcome({ searchParams }: { searchParams: PageProps<"/bienvenida">["searchParams"] }) {
  const [user, params] = await Promise.all([getUser(), searchParams]);
  if (user.homeId) redirect("/");
  const code = normalizeInviteCode(typeof params.codigo === "string" ? params.codigo : "");
  const invite = await findHomeByInvite(code);
  return <WelcomeForm email={user.email} code={code ?? undefined} invite={invite ?? undefined} />;
}
