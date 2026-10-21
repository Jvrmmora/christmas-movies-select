import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers, themeScript } from "@/components/providers";
import { THEME_COLORS } from "@/lib/theme";
import "./globals.css";

// SF Pro comes from the system on Apple devices; Inter is the fallback elsewhere.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

// Absolute base so the og:image URL is one WhatsApp/Gmail can fetch.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://christmas-movies-select.vercel.app";

const description = "Nuestras películas de Navidad: lista, dónde verlas en Colombia y calendario de adviento.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Navidad en casa", template: "%s · Navidad en casa" },
  description,
  openGraph: { title: "Navidad en casa", description, siteName: "Navidad en casa", locale: "es_CO", type: "website" },
  twitter: { card: "summary_large_image", title: "Navidad en casa", description },
  robots: { index: false, follow: false },
  appleWebApp: { title: "Navidad en casa", statusBarStyle: "black-translucent" },
};

// One theme-color tag: <Providers> keeps it in step with the automatic (by-the-clock) or chosen theme.
export const viewport: Viewport = {
  themeColor: THEME_COLORS.light,
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
