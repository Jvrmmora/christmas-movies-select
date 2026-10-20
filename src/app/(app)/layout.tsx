import Link from "next/link";
import { Suspense } from "react";
import { BrandMark, Garland, Snowfall } from "@/components/shell/decor";
import { SiteFooter } from "@/components/shell/footer";
import { HeaderActions, NavLinks, NavLinksView, TabBar, TabBarView } from "@/components/shell/nav";
import { getCurrentProfile, getHome } from "@/lib/dal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <Snowfall />
      <header className="sticky top-0 z-30 border-b border-line bg-glass backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-5 px-4 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-ink">
            <BrandMark />
            <span className="text-[17px] font-bold tracking-[-0.02em]">Navidad en casa</span>
          </Link>
          <Suspense fallback={<NavLinksView pathname={null} />}>
            <NavLinks />
          </Suspense>
          <Suspense fallback={<HeaderActions profile={null} home={null} />}>
            <HeaderActionsLoader />
          </Suspense>
        </div>
        <Garland />
      </header>
      <div>{children}</div>
      <div className="pb-24 md:pb-0">
        <SiteFooter />
      </div>
      <Suspense fallback={<TabBarView pathname={null} />}>
        <TabBar />
      </Suspense>
    </div>
  );
}

async function HeaderActionsLoader() {
  const [profile, home] = await Promise.all([getCurrentProfile(), getHome()]);
  return <HeaderActions profile={profile} home={home} />;
}
