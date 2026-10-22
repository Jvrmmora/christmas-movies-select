import type { Metadata } from "next";
import { Suspense } from "react";
import { findHomeByInvite } from "@/lib/homes";
import { normalizeInviteCode } from "@/lib/invite-code";
import { SignUpForm } from "./join-form";

export const metadata: Metadata = { title: "Crear cuenta" };

// Step 1 of sign-up. /unirse/NAVI-XXXX-XXXX is an invite link: the code rides along to step 2.
export default function SignUpPage({ params }: PageProps<"/unirse/[[...codigo]]">) {
  return (
    <Suspense fallback={<SignUpForm />}>
      <WithInvite params={params} />
    </Suspense>
  );
}

async function WithInvite({ params }: { params: PageProps<"/unirse/[[...codigo]]">["params"] }) {
  const { codigo } = await params;
  const code = normalizeInviteCode(codigo?.[0] ?? "");
  const home = await findHomeByInvite(code);
  // A wrong or outdated code still lets the person sign up; step 2 asks for the right one.
  return <SignUpForm invite={home ?? undefined} staleInvite={!!codigo?.length && !home} />;
}
