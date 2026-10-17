import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, Cross, Lightbulb, Sparkles, Trophy, Users } from "lucide-react";
import { DISCORD_INVITE } from "@/lib/links";
import { VMark } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Coming Soon",
  description:
    "Ventrio is getting ready. Join the community now and get a Discord message when the website launches.",
};

const PILLARS = [
  { icon: Lightbulb, name: "Ideas", detail: "Turn sparks into plans." },
  { icon: Trophy, name: "Business", detail: "Learn by building." },
  { icon: Cross, name: "Faith", detail: "Grow with purpose." },
  { icon: Users, name: "Impact", detail: "Make it better together." },
];

export default function TeaserPage() {
  return (
    <section className="vt-screen" aria-label="Ventrio is coming soon">
      <div className="vt-wrap vt-shell">
        <header className="vt-top">
          <Link className="vt-brand" href="/" aria-label="Ventrio home">
            <VMark className="vt-mark" />
            <span>VENTRIO</span>
          </Link>
          <a className="vt-header-link" href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
            Join the Discord <ArrowRight aria-hidden="true" />
          </a>
        </header>

        <main className="vt-main">
          <div className="vt-copy">
            <p className="vt-kicker"><span /> FAITH × BUSINESS × IMPACT</p>
            <p className="vt-coming"><Sparkles aria-hidden="true" /> A new chapter is on the way</p>
            <h1 className="vt-word">Build<br />better<br /><em>together.</em></h1>
            <p className="vt-lede">
              A community for the next generation of entrepreneurs to learn, build bold ideas, and grow with purpose.
            </p>
            <p className="vt-sub">
              The Ventrio website is getting ready. Join us on Discord now and we’ll send you a message when we launch.
            </p>
            <div className="vt-actions">
              <Link className="vt-btn vt-btn-primary" href="/early-access">
                Sign in with Discord <ArrowRight aria-hidden="true" />
              </Link>
              <a className="vt-btn vt-btn-ghost" href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
                Join the server only <ArrowDownRight aria-hidden="true" />
              </a>
            </div>
            <p className="vt-age">Free to join · For young entrepreneurs ages 13–19</p>
          </div>

          <aside className="vt-art" aria-label="Ventrio's four pillars">
            <div className="vt-orbit vt-orbit-one" />
            <div className="vt-orbit vt-orbit-two" />
            <div className="vt-art-core">
              <VMark className="vt-art-mark" />
              <span>VENTRIO</span>
              <small>BUILD BETTER TOGETHER</small>
            </div>
            <div className="vt-pillar-list">
              {PILLARS.map(({ icon: Icon, name, detail }, index) => (
                <div className={`vt-pillar vt-pillar-${index + 1}`} key={name}>
                  <span className="vt-pillar-icon"><Icon aria-hidden="true" /></span>
                  <span><strong>{name}</strong><small>{detail}</small></span>
                </div>
              ))}
            </div>
          </aside>
        </main>

        <footer className="vt-foot">
          <span>© {new Date().getFullYear()} Ventrio</span>
          <span className="vt-foot-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </span>
          <span className="vt-foot-note">FAITH × BUSINESS × IMPACT</span>
        </footer>
      </div>
    </section>
  );
}
