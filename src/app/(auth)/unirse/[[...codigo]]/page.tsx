import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { JoinForm } from "./join-form";

export const metadata: Metadata = { title: "Crear mi casa" };

export default function JoinPage({ params }: PageProps<"/unirse/[[...codigo]]">) {
  return (
    <Suspense fallback={<CreateHome />}>
      <OldInviteLink params={params} />
    </Suspense>
  );
}

function CreateHome() {
  return <JoinForm />;
}

// Sign-up no longer needs an invite; old links like /unirse/NAVI-XXXX-XXXX land on the plain form.
async function OldInviteLink({ params }: { params: PageProps<"/unirse/[[...codigo]]">["params"] }) {
  const { codigo } = await params;
  if (codigo?.length) redirect("/unirse");
  return <CreateHome />;
}
