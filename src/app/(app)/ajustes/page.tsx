import type { Metadata } from "next";
import { Suspense } from "react";
import { Bone } from "@/components/skeletons";
import { getHome, getHomeEmail } from "@/lib/dal";
import { EmailForm, HomeForm } from "./settings-forms";

export const metadata: Metadata = { title: "Ajustes de la casa" };

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pt-8 pb-16 sm:px-8 sm:pt-10">
      <h1 className="font-display text-[28px] font-bold tracking-[-0.02em]">Ajustes de la casa</h1>
      <Suspense fallback={<Bone className="mt-6 h-[420px] rounded-3xl" />}>
        <Settings />
      </Suspense>
    </main>
  );
}

async function Settings() {
  const [home, email] = await Promise.all([getHome(), getHomeEmail()]);
  return (
    <div className="mt-6 flex flex-col gap-6">
      <HomeForm name={home.name} slug={home.slug} />
      <EmailForm email={email} />
    </div>
  );
}
