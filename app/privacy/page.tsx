import type { Metadata } from "next";
import Link from "next/link";
import { Notice, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

const SECTIONS = [
  {
    title: "What we collect",
    body: [
      "When you sign in with Discord we receive your Discord user ID, username, display name and avatar. We request only the Discord “identify” scope — we do not receive your email address, servers, messages or password.",
      "You may optionally add a display name, short bio, project name, interests, skills and links to your profile. We do not ask for your date of birth, address, phone number or school.",
      "If you register for events or submit to a competition, we store that registration or submission so we can run the program.",
    ],
  },
  {
    title: "How we use it",
    body: [
      "We use your information to run your account, show your profile (only the fields you choose to make public), manage event registrations, and review competition submissions.",
      "We do not sell your data or use it for advertising.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "Profiles are private by default. You control whether your profile is public and which fields are shown from your Settings page.",
      "You can delete your account at any time from Settings. This permanently removes your profile, registrations and submissions.",
    ],
  },
  {
    title: "Younger members",
    body: [
      "Ventrio is designed for members ages 13–19. We collect the minimum information needed to run the community. If you are under the age required by your local law to consent to online services, please ask a parent or guardian before joining.",
      "Parents or guardians can contact us to review or delete their child's information.",
    ],
  },
  {
    title: "Cookies",
    body: [
      "We use a secure, HTTP-only session cookie to keep you signed in. We do not use advertising or tracking cookies.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description="How Ventrio collects, uses and protects member information."
      />
      <section className="container-page max-w-3xl py-16">
        <Notice tone="warning">
          This is a placeholder policy. Have it reviewed against applicable child and teen privacy laws (such
          as COPPA, GDPR-K and state privacy laws) before launch.
        </Notice>
        <div className="mt-12 space-y-12">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="font-display text-lg font-semibold text-cream">{section.title}</h2>
              <div className="mt-4 space-y-4 leading-relaxed text-slate">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
          <p className="text-slate">
            Questions?{" "}
            <Link
              href="/contact"
              className="text-gold hover:text-gold-soft"
            >
              Contact us
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
