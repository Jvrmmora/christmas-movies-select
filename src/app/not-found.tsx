import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <p className="font-display text-6xl font-semibold text-berry-ink">404</p>
        <h1 className="text-2xl font-bold">Esta página se perdió en la nieve</h1>
        <p className="text-ink-2">Puede que la película haya sido eliminada.</p>
        <Link href="/" className="nv-press mt-2 inline-flex h-12 items-center rounded-[14px] bg-berry px-5 font-semibold text-white">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
