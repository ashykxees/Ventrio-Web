import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TeaserFooter } from "@/components/Teaser";
import { Logo } from "@/components/Logo";
import { getCurrentMemberSafe } from "@/lib/session";
import { isSiteLaunched, site } from "@/lib/site";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import "./globals.css";

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

// Pages visitors may open before launch; everything else redirects to the teaser on "/".
const PRE_LAUNCH_PATHS = ["/", "/login", "/privacy", "/terms", "/contact"];

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const launched = isSiteLaunched();
  const member = launched ? null : await getCurrentMemberSafe();
  const teaserMode = !launched && !member?.isAdmin;

  if (teaserMode) {
    const pathname = (await headers()).get("x-pathname") ?? "/";

    if (!PRE_LAUNCH_PATHS.includes(pathname)) {
      redirect("/");
    }
  }

  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${inter.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-gold focus:px-4 focus:py-2 focus:text-charcoal"
        >
          Skip to content
        </a>
        {teaserMode ? (
          <header className="border-b border-line">
            <div className="container-page flex h-16 items-center">
              <Logo />
            </div>
          </header>
        ) : (
          <>
            {!launched && (
              <p className="bg-gold px-4 py-1.5 text-center text-xs font-medium text-charcoal">
                Admin preview — visitors only see the teaser page until SITE_LAUNCHED=true.
              </p>
            )}
            <SiteHeader />
          </>
        )}
        <main
          id="main"
          className="flex-1"
        >
          {children}
        </main>
        {teaserMode ? <TeaserFooter /> : <SiteFooter />}
      </body>
    </html>
  );
}
