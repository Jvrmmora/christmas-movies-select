import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandMark, Garland, Snowfall } from "@/components/shell/decor";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <Snowfall />
      <Garland />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="nv-fade w-full max-w-[420px] rounded-[28px] bg-surface p-8 shadow-card sm:p-10">
          <BrandMark className="size-12 rounded-[14px]" />
          <h1 className="mt-6 font-serif text-[40px] leading-[1.05] font-semibold tracking-[-0.025em]">Navidad en casa</h1>
          <p className="mt-2 text-base text-ink-2">Sus películas de Navidad, dónde verlas y su calendario de adviento.</p>
          <Suspense fallback={<LoginForm next="/" />}>
            <LoginWithNext searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function LoginWithNext({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/";
  return <LoginForm next={next} />;
}
