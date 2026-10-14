import type { Metadata } from "next";
import { ImportFlow } from "@/components/movies/import-flow";

export const metadata: Metadata = { title: "Importar lista" };

export default function ImportPage() {
  return (
    <main className="px-4 pt-8 pb-16 sm:px-8 sm:pt-10">
      <ImportFlow />
    </main>
  );
}
