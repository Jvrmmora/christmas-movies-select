import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers, themeScript } from "@/components/providers";
import "./globals.css";

// SF Pro comes from the system on Apple devices; Inter is the fallback elsewhere.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Navidad en casa", template: "%s · Navidad en casa" },
  description: "Nuestras películas de Navidad: lista, dónde verlas en Colombia y calendario de adviento.",
  robots: { index: false, follow: false },
  appleWebApp: { title: "Navidad en casa", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF8F3" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1410" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      {/* Browser extensions often add attributes to <body>; don't treat that as a hydration error. */}
      <body className="min-h-dvh" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
