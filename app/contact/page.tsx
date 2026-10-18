import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { DiscordIcon } from "@/components/AuthButtons";
import { Notice, PageHeader } from "@/components/ui";
import { getContactEmail, getDiscordInviteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & Support",
};

export default function ContactPage() {
  const email = getContactEmail();
  const invite = getDiscordInviteUrl();

  return (
    <>
      <PageHeader
        eyebrow="Support"
        title="Contact us"
        description="Questions about Ventrio, your account, an event or a competition? We're here to help."
      />
      <section className="container-page grid max-w-4xl gap-4 py-16 md:grid-cols-2">
        <div className="card p-8">
          <Mail
            className="h-6 w-6 text-gold"
            strokeWidth={1.5}
          />
          <h2 className="mt-5 font-display text-base font-semibold text-cream">Email</h2>
          {email ? (
            <a
              href={`mailto:${email}`}
              className="mt-3 inline-block text-gold hover:text-gold-soft"
            >
              {email}
            </a>
          ) : (
            <p className="mt-3 text-sm text-slate">Our support email will be published here soon.</p>
          )}
          <p className="mt-4 text-sm leading-relaxed text-slate">
            Parents and guardians can also use this address to ask about or delete a member&apos;s
            information.
          </p>
        </div>
        <div className="card p-8">
          <DiscordIcon className="h-6 w-6 text-gold" />
          <h2 className="mt-5 font-display text-base font-semibold text-cream">Discord</h2>
          {invite ? (
            <a
              href={invite}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-gold hover:text-gold-soft"
            >
              Join the Ventrio server
            </a>
          ) : (
            <p className="mt-3 text-sm text-slate">The Discord invite will be published here soon.</p>
          )}
          <p className="mt-4 text-sm leading-relaxed text-slate">
            Message a moderator in the server for quick help or to report a safety concern.
          </p>
        </div>
        <div className="md:col-span-2">
          <Notice>
            For your safety, never share passwords, Discord tokens, or personal details like your home address
            when asking for help.
          </Notice>
        </div>
      </section>
    </>
  );
}
