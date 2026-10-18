import Link from "next/link";
import { VMark } from "@/components/Logo";
import { getContactEmail, getDiscordInviteUrl, site } from "@/lib/site";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "/about", label: "About" },
      { href: "/academy", label: "Academy" },
      { href: "/events", label: "Events" },
      { href: "/competitions", label: "Competitions" },
      { href: "/community", label: "Community" },
    ],
  },
  {
    title: "Members",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/profile", label: "Profile" },
      { href: "/settings", label: "Settings" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Use" },
    ],
  },
];

export function SiteFooter() {
  const email = getContactEmail();
  const invite = getDiscordInviteUrl();

  return (
    <footer className="border-t border-line bg-charcoal">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link
            href="/"
            className="inline-flex flex-col items-start gap-4"
            aria-label="Ventrio home"
          >
            <VMark className="h-9 w-auto text-gold" />
            <span className="font-display text-lg font-semibold tracking-[0.42em] text-cream">VENTRIO</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate">
            {site.tagline} A community for young entrepreneurs ages 13–19.
          </p>
          <p className="mt-6 text-sm text-slate">
            {email ? (
              <a
                href={`mailto:${email}`}
                className="text-cream hover:text-gold"
              >
                {email}
              </a>
            ) : (
              <Link
                href="/contact"
                className="text-cream hover:text-gold"
              >
                Contact us
              </Link>
            )}
          </p>
          {invite && (
            <a
              href={invite}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-slate hover:text-gold"
            >
              Join the Discord
            </a>
          )}
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h2 className="eyebrow">{column.title}</h2>
            <ul className="mt-5 space-y-3">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate transition-colors hover:text-cream"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-slate sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Ventrio. All rights reserved.</p>
          <p className="font-display tracking-[0.28em] text-gold uppercase">{site.supportingLine}</p>
        </div>
      </div>
    </footer>
  );
}
