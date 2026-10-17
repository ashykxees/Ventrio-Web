import Link from "next/link";
import "../page-text.css";

export const metadata = {
  title: "Privacy Policy",
  description: "How Ventrio collects, uses and protects member information.",
};

export default function PrivacyPage() {
  return (
    <div className="vp-page">
      <p className="vp-kicker">Legal</p>
      <h1>Privacy Policy</h1>
      <p className="vp-lead">How Ventrio collects, uses and protects member information.</p>
      <p className="vp-note">
        This is a placeholder policy. Have it reviewed against applicable child and teen privacy laws
        (such as COPPA, GDPR-K and state privacy laws) before launch.
      </p>

      <h2>What we collect</h2>
      <p>
        When you sign in with Discord on the full website we receive your Discord user ID, username,
        display name and avatar. On the full website we request only the Discord “identify” scope. We
        never receive your email address, your servers, your messages or your password.
      </p>
      <p>
        You may optionally add a display name, short bio, project name, interests, skills and links to
        your profile. We do not ask for your date of birth, address, phone number or school.
      </p>
      <p>
        If you register for events or submit to a competition, we store that registration or
        submission so we can run the program.
      </p>

      <h2>Early access sign-in</h2>
      <p>
        If you sign in on our pre-launch page, we ask Discord for your user ID, username and display
        name, plus permission to add you to the Ventrio Discord server. We use that permission to add
        you and assign the “Launch Notify” role so the Ventrio bot can send one direct message when the
        website launches. We do not store this sign-in on our website, and we revoke the Discord access
        token after the server join. Your notification role is held in our Discord server; you can
        leave the server or ask a moderator to remove the role at any time.
      </p>

      <h2>How we use it</h2>
      <p>
        We use your information to run your account, show your profile (only the fields you choose to
        make public), manage event registrations, and review competition submissions.
      </p>
      <p>We do not sell your data or use it for advertising.</p>

      <h2>Your choices</h2>
      <p>
        Profiles are private by default. You control whether your profile is public and which fields
        are shown from your Settings page.
      </p>
      <p>
        You can delete your account at any time from Settings. This permanently removes your profile,
        registrations and submissions.
      </p>

      <h2>Younger members</h2>
      <p>
        Ventrio is designed for members ages 13–19. We collect the minimum information needed to run
        the community. If you are under the age required by your local law to consent to online
        services, please ask a parent or guardian before joining.
      </p>
      <p>Parents or guardians can contact us to review or delete their child’s information.</p>

      <h2>Cookies</h2>
      <p>
        We use a secure, HTTP-only session cookie to keep you signed in. During Discord sign-in we also
        set a temporary security cookie that expires within 10 minutes. We do not use advertising or
        tracking cookies.
      </p>

      <p>
        Questions? <Link href="/contact">Contact us</Link>.
      </p>
    </div>
  );
}
