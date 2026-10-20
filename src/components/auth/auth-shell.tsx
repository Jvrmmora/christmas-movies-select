import { BrandMark, Garland, Snowfall } from "@/components/shell/decor";

/** Night-scene frame shared by the sign-in, sign-up, recovery and admin screens. */
export function AuthShell({
  title,
  subtitle,
  children,
  width = 420,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  width?: number;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <Snowfall />
      <Garland />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="nv-fade w-full rounded-[28px] bg-surface p-8 shadow-card sm:p-10" style={{ maxWidth: width }}>
          <BrandMark className="size-12 rounded-[14px]" />
          <h1 className="mt-6 font-serif text-[36px] leading-[1.05] font-semibold tracking-[-0.025em]">{title}</h1>
          {subtitle && <p className="mt-2 text-base text-ink-2">{subtitle}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}
