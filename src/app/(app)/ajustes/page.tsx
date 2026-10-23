import type { Metadata } from "next";
import { Suspense } from "react";
import { Bone } from "@/components/skeletons";
import { getHome, getOtherAccountCount, getUser } from "@/lib/dal";
import { countryOptions } from "@/lib/countries";
import { CountryForm, DeleteAccountCard, EmailForm, HomeForm, InviteCard, PasswordForm } from "./settings-forms";

export const metadata: Metadata = { title: "Ajustes" };

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pt-8 pb-16 sm:px-8 sm:pt-10">
      <h1 className="font-display text-[28px] font-bold tracking-[-0.02em]">Ajustes</h1>
      <Suspense fallback={<Bone className="mt-6 h-[420px] rounded-3xl" />}>
        <Settings />
      </Suspense>
    </main>
  );
}

async function Settings() {
  const [home, user, others] = await Promise.all([getHome(), getUser(), getOtherAccountCount()]);
  return (
    <div className="mt-6 flex flex-col gap-6">
      <h2 className="-mb-2 text-sm font-semibold tracking-wide text-ink-2 uppercase">La casa</h2>
      <HomeForm name={home.name} />
      <CountryForm country={home.country} countries={countryOptions()} />
      <InviteCard code={home.inviteCode} />
      <h2 className="-mb-2 pt-2 text-sm font-semibold tracking-wide text-ink-2 uppercase">Mi cuenta</h2>
      <EmailForm email={user.email} />
      <PasswordForm />
      <DeleteAccountCard homeName={home.name} others={others} />
    </div>
  );
}
