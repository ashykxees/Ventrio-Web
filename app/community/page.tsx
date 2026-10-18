import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { DiscordIcon } from "@/components/AuthButtons";
import { Notice, PageHeader, SectionHeading } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getDiscordInviteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Community",
  description: "Connect with young entrepreneurs in the Ventrio community.",
};

const WAYS = [
  {
    step: "01",
    title: "Join the Discord",
    text: "Our Discord server is where members meet, share progress, ask questions and hear about new events first.",
  },
  {
    step: "02",
    title: "Create your profile",
    text: "Sign in with Discord to set up your member profile. Share your project, interests and skills — only what you choose to make public.",
  },
  {
    step: "03",
    title: "Show up and build",
    text: "Attend classes and coaching calls, enter pitch competitions, and give honest, encouraging feedback to other members.",
  },
];

const GUIDELINES = [
  "Be kind and respectful. Encourage others and give constructive feedback.",
  "Keep it safe. Never share personal information like your address, phone number or school.",
  "No spam, scams or get-rich-quick schemes. Ventrio is about building real value.",
  "Keep conversations appropriate for ages 13–19.",
  "Report anything that makes you uncomfortable to a moderator.",
];

export default async function CommunityPage() {
  const invite = getDiscordInviteUrl();
  const announcements = await prisma.announcement.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 5,
  });

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Find your people"
        description="Ventrio is a place for young entrepreneurs to connect, collaborate and grow together — in business and in faith."
      >
        {invite ? (
          <a
            href={invite}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-gold"
          >
            <DiscordIcon />
            Join the Ventrio Discord
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <div className="max-w-xl">
            <Notice tone="warning">
              The official Discord invite link hasn&apos;t been published yet. Check back soon.
            </Notice>
          </div>
        )}
      </PageHeader>

      <section className="container-page py-20 sm:py-28">
        <SectionHeading
          eyebrow="How to participate"
          title="Three ways to get involved"
        />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {WAYS.map((way) => (
            <div
              key={way.step}
              className="card p-8"
            >
              <p className="font-display text-sm font-semibold tracking-[0.2em] text-gold">{way.step}</p>
              <h3 className="mt-5 font-display text-base font-semibold text-cream">{way.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate">{way.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Link
            href="/login"
            className="btn btn-outline"
          >
            Create your member profile
          </Link>
        </div>
      </section>

      <section className="border-y border-line bg-ink">
        <div className="container-page grid gap-12 py-20 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading
            eyebrow="Community guidelines"
            title="Keep it safe and encouraging"
          />
          <ul className="space-y-4">
            {GUIDELINES.map((rule) => (
              <li
                key={rule}
                className="flex gap-4 border-b border-line pb-4 text-slate"
              >
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                  aria-hidden="true"
                />
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {announcements.length > 0 && (
        <section className="container-page py-20">
          <SectionHeading
            eyebrow="Announcements"
            title="What's new"
          />
          <div className="mt-10 grid gap-4">
            {announcements.map((announcement) => (
              <article
                key={announcement.id}
                className="card p-6"
              >
                <h3 className="font-display text-base font-semibold text-cream">{announcement.title}</h3>
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-slate">
                  {announcement.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
