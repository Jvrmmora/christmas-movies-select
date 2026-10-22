import type { Metadata } from "next";
import { Suspense } from "react";
import { Garland, Snowfall } from "@/components/shell/decor";
import { getHome, getMovieCount, getOwnProfileId, getProfiles } from "@/lib/dal";
import { ProfilePicker } from "./profile-picker";

export const metadata: Metadata = { title: "¿Quién está viendo?" };

// Always a night scene, whatever the theme: the `dark` class re-scopes the colour tokens for everything inside.
export default function ProfilesPage({ searchParams }: PageProps<"/perfiles">) {
  return (
    <div
      className="dark relative flex min-h-dvh flex-col overflow-hidden text-ink"
      style={{ background: "radial-gradient(120% 90% at 50% 0%, #17382a 0%, #0b1410 62%)" }}
    >
      <Snowfall />
      <Garland />
      <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col items-center justify-center px-4 py-12">
        <Suspense fallback={<p className="text-ink-2">Un momento…</p>}>
          <Picker searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function Picker({ searchParams }: { searchParams: PageProps<"/perfiles">["searchParams"] }) {
  const params = await searchParams;
  const raw = typeof params.next === "string" ? params.next : "/";
  // Only same-site paths: this value ends up in router.replace().
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  const editId = typeof params.editar === "string" ? params.editar : undefined;
  const [home, profiles, ownId, movieCount] = await Promise.all([getHome(), getProfiles(), getOwnProfileId(), getMovieCount()]);
  // Right after setting up their own profile, an empty home gets a few classics to start with.
  const afterSetup = movieCount === 0 ? "/bienvenida/peliculas" : next;
  return <ProfilePicker home={home} profiles={profiles} ownId={ownId} next={next} afterSetup={afterSetup} editId={editId} />;
}
