import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { DISCORD_INVITE } from "@/lib/links";

export const metadata: Metadata = { title: "Join Ventrio on Discord" };

type Params = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const ERRORS: Record<string, string> = {
  denied: "You cancelled the Discord sign-in. Nothing was changed.",
  state: "That sign-in link expired. Please try again.",
  token: "Discord sign-in could not be completed. Please try again.",
  join: "We couldn't add you to the Ventrio server. You can join directly below, or try signing in again.",
  config: "Discord sign-in is not set up yet. You can still join the server directly below.",
};

export default async function EarlyAccessPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = (await searchParams) ?? {};
  const status = first(params.status);
  const reason = first(params.reason);
  const name = first(params.name);
  const complete = status === "joined" || status === "already";

  return (
    <section className="vt-screen vt-signin-screen" aria-label="Join Ventrio on Discord">
      <div className="vt-wrap vt-signin-shell">
        <header className="vt-top">
          <Link className="vt-brand" href="/" aria-label="Ventrio home">
            <span>VENTRIO</span>
          </Link>
          <Link className="vt-header-link" href="/"><ArrowLeft aria-hidden="true" /> Back to Ventrio</Link>
        </header>

        <div className="vt-signin-main">
          <div className="vt-signin-card">
            <p className="vt-kicker"><span /> YOUR NEXT CHAPTER STARTS HERE</p>
            {complete ? (
              <>
                <span className="vt-success-icon"><Check aria-hidden="true" /></span>
                <h1>You’re in{name ? `, ${name}` : ""}.</h1>
                <p className="vt-signin-lede">
                  {status === "joined"
                    ? "You’ve joined the Ventrio Discord server."
                    : "You’re already in the Ventrio Discord server."} When the website launches, our bot will send you a direct message.
                </p>
                <p className="vt-privacy-note">
                  To receive the message, allow direct messages from server members in Discord. You can leave the server any time to stop launch updates.
                </p>
                <div className="vt-actions">
                  <a className="vt-btn vt-btn-primary" href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
                    Open the server <ArrowRight aria-hidden="true" />
                  </a>
                  <Link className="vt-btn vt-btn-ghost" href="/">Back to home</Link>
                </div>
              </>
            ) : (
              <>
                <p className="vt-signin-overline">THE VENTRIO COMMUNITY</p>
                <h1>Let’s build<br /><em>better together.</em></h1>
                <p className="vt-signin-lede">
                  Sign in with Discord to join our community and get a personal message when the Ventrio website goes live.
                </p>
                {status === "error" && (
                  <p className="vt-error" role="alert">{ERRORS[reason ?? ""] ?? "Something went wrong. Please try again."}</p>
                )}
                <ul className="vt-benefits">
                  <li><Check aria-hidden="true" /> We’ll add you to the Ventrio Discord server</li>
                  <li><Check aria-hidden="true" /> The Ventrio bot will DM you at launch</li>
                  <li><Check aria-hidden="true" /> No email or password is shared with us</li>
                </ul>
                <div className="vt-actions vt-signin-actions">
                  <a className="vt-btn vt-btn-primary" href="/api/teaser/discord">
                    Continue with Discord <ArrowRight aria-hidden="true" />
                  </a>
                  <a className="vt-btn vt-btn-ghost" href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
                    Join the server directly (no launch DM)
                  </a>
                </div>
                <p className="vt-privacy-note">
                  <ShieldCheck aria-hidden="true" /> Discord will ask to share your username and let Ventrio add you to its server. We never see your password, messages, or other servers. By continuing, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>. For ages 13–19.
                </p>
              </>
            )}
          </div>
        </div>

        <footer className="vt-foot">
          <span>© {new Date().getFullYear()} Ventrio</span>
          <span className="vt-foot-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </span>
        </footer>
      </div>
    </section>
  );
}
