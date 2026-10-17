import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Montserrat } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { site } from "@/lib/site";
import "./globals.css";
import "./teaser/teaser.css";

// Every page reads the session or the database, so never prerender at build time
// (the Railway volume holding the SQLite file is not mounted during builds).
export const dynamic = "force-dynamic";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `Ventrio — ${site.tagline}`,
    template: "%s · Ventrio",
  },
  description: site.description,
  openGraph: {
    title: `Ventrio — ${site.tagline}`,
    description: site.description,
    siteName: "Ventrio",
    type: "website",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const teaserMode = (await headers()).get("x-ventrio-teaser-mode") === "true";

  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${inter.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        {!teaserMode && (
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-gold focus:px-4 focus:py-2 focus:text-charcoal"
          >
            Skip to content
          </a>
        )}
        {!teaserMode && <SiteHeader />}
        <main
          id="main"
          className="flex-1"
        >
          {children}
        </main>
        {!teaserMode && <SiteFooter />}
      </body>
    </html>
  );
}
