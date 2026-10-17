import "../page-text.css";
import { DISCORD_INVITE } from "@/lib/links";

export const metadata = {
  title: "Contact & Support",
  description: "Get help with Ventrio, your account, an event or a competition.",
};

export default function ContactPage() {
  return (
    <div className="vp-page">
      <p className="vp-kicker">Support</p>
      <h1>Contact us</h1>
      <p className="vp-lead">
        Questions about Ventrio, your account, an event or a competition? We’re here to help.
      </p>

      <h2>Email</h2>
      {/* TODO: replace this paragraph with your support email, e.g.
          <p><a href="mailto:you@ventrio.xyz">you@ventrio.xyz</a></p> */}
      <p>Our support email will be published here soon.</p>
      <p>
        Parents and guardians can also use this address to ask about or delete a member’s
        information.
      </p>

      <h2>Discord</h2>
      <p>
        <a className="vp-btn" href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
          Join the Ventrio Discord
        </a>
      </p>
      <p>Message a moderator in the server for quick help or to report a safety concern.</p>

      <p className="vp-note">
        For your safety, never share passwords, Discord tokens, or personal details like your home
        address when asking for help.
      </p>
    </div>
  );
}
