import Link from "next/link";
import {
  ArrowRight,
  ChartColumnIncreasing,
  Cross,
  GraduationCap,
  Lightbulb,
  Trophy,
  Users,
} from "lucide-react";
import { VMark } from "@/components/Logo";
import { EventCard } from "@/components/cards";
import { EmptyState, SectionHeading } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getCurrentMemberSafe } from "@/lib/session";
import { Teaser } from "@/components/Teaser";
import { isSiteLaunched } from "@/lib/site";

const FEATURES = [
  {
    icon: Lightbulb,
    title: "Business & Ideas",
    text: "Turn sparks into plans. Explore business ideas, validate them with real feedback, and learn what it takes to launch.",
  },
  {
    icon: GraduationCap,
    title: "Lessons & Coaching",
    text: "Practical classes in entrepreneurship, marketing, branding, sales and leadership, plus coaching sessions to keep you moving.",
  },
  {
    icon: Trophy,
    title: "Pitch Competitions",
    text: "Sharpen your pitch, present your idea, and get transparent feedback from judges in friendly, structured competitions.",
  },
  {
    icon: Users,
    title: "Community",
    text: "Connect with peers ages 13–19 who are building too. Share wins, ask questions, and find people to build with.",
  },
  {
    icon: Cross,
    title: "Faith & Purpose",
    text: "Build with integrity. Grow in character and faith, and use your skills to make a positive impact on others.",
  },
];

const PILLARS = ["Ideas", "Business", "Faith", "Impact"];

export default async function HomePage() {
  const member = await getCurrentMemberSafe();

  if (!isSiteLaunched() && !member?.isAdmin) {
    return <Teaser member={member} />;
  }

  const now = new Date();

  const [events, announcements] = await Promise.all([
    prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ endsAt: { gte: now } }, { endsAt: null, startsAt: { gte: now } }],
      },
      orderBy: { startsAt: "asc" },
      take: 3,
    }),
    prisma.announcement.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 2,
    }),
  ]);

  const joinHref = member ? "/community" : "/login";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="container-page grid items-center gap-16 py-20 sm:py-28 lg:grid-cols-[1.15fr_1fr] lg:py-36">
          <div>
            <p className="eyebrow">Faith × Business × Impact</p>
            <h1 className="display mt-8 text-[2.6rem] leading-[1.08] tracking-[0.16em] text-cream sm:text-6xl lg:text-7xl">
              Build
              <br />
              Better
              <br />
              Together.
            </h1>
            <span className="gold-rule mt-10" />
            <p className="mt-8 max-w-xl text-base leading-relaxed text-slate sm:text-lg">
              A community for the next generation of entrepreneurs to learn business, build ideas, compete,
              connect, and grow in faith.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href={joinHref}
                className="btn btn-gold"
              >
                Join Ventrio
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/academy"
                className="btn btn-outline"
              >
                Explore the Academy
              </Link>
            </div>
          </div>

          <div className="hidden justify-center lg:flex">
            <div className="flex flex-col items-center">
              <VMark className="h-auto w-64 text-gold" />
              <p className="mt-10 font-display text-3xl font-semibold tracking-[0.5em] text-cream">VENTRIO</p>
              <p className="mt-4 font-display text-[0.65rem] font-medium tracking-[0.36em] text-gold uppercase">
                Ideas / Business / Faith / Impact
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section
        className="border-b border-line bg-ink"
        aria-label="Ventrio pillars"
      >
        <ul className="container-page grid grid-cols-2 sm:grid-cols-4">
          {PILLARS.map((pillar, index) => (
            <li
              key={pillar}
              className={`py-6 text-center font-display text-xs font-semibold tracking-[0.36em] text-slate uppercase ${
                index > 0 ? "sm:border-l sm:border-line" : ""
              } ${index % 2 === 1 ? "border-l border-line sm:border-l" : ""}`}
            >
              {pillar}
            </li>
          ))}
        </ul>
      </section>

      {/* Features */}
      <section className="container-page py-20 sm:py-28">
        <SectionHeading
          eyebrow="What we do"
          title="Everything you need to start building"
          description="Ventrio brings practical education, meaningful connections, creative competition and faith-centered growth together in one place."
        />
        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="bg-charcoal p-8"
            >
              <Icon
                className="h-6 w-6 text-gold"
                strokeWidth={1.5}
              />
              <h3 className="mt-6 font-display text-sm font-semibold tracking-[0.18em] text-cream uppercase">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate">{text}</p>
            </div>
          ))}
          <div className="flex flex-col justify-between bg-ink p-8">
            <ChartColumnIncreasing
              className="h-6 w-6 text-gold"
              strokeWidth={1.5}
            />
            <div className="mt-6">
              <p className="font-display text-sm font-semibold tracking-[0.18em] text-cream uppercase">
                Ready to grow?
              </p>
              <Link
                href={joinHref}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-soft"
              >
                Join the community
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming events */}
      <section className="border-y border-line bg-ink">
        <div className="container-page py-20 sm:py-28">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Events"
              title="Upcoming"
            />
            {events.length > 0 && (
              <Link
                href="/events"
                className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-soft"
              >
                View all events
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <div className="mt-12">
            {events.length > 0 ? (
              <div className="grid gap-4">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="New events coming soon"
                description="Classes, coaching calls, networking nights and pitch competitions are on the way. Join the community to hear about them first."
                action={
                  <Link
                    href="/community"
                    className="btn btn-outline btn-sm"
                  >
                    Join the community
                  </Link>
                }
              />
            )}
          </div>
        </div>
      </section>

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="container-page py-20">
          <SectionHeading
            eyebrow="Announcements"
            title="Latest from Ventrio"
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
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

      {/* Mission */}
      <section className="bg-cream text-charcoal">
        <div className="container-page grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-[auto_1fr]">
          <VMark className="h-20 w-auto text-charcoal" />
          <div>
            <p className="eyebrow !text-[#9a7a3f]">Our mission</p>
            <p className="mt-5 max-w-3xl font-display text-xl leading-relaxed font-medium sm:text-2xl">
              Empower the next generation of entrepreneurs through practical education, meaningful
              connections, creative competition, and faith-centered growth.
            </p>
            <Link
              href="/about"
              className="mt-8 inline-flex items-center gap-2 font-display text-xs font-semibold tracking-[0.2em] uppercase hover:text-[#9a7a3f]"
            >
              About Ventrio
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="container-page py-20 text-center sm:py-28">
        <h2 className="display text-3xl tracking-[0.2em] text-cream sm:text-4xl">Build better together.</h2>
        <span className="gold-rule mx-auto mt-8" />
        <p className="mx-auto mt-8 max-w-xl text-slate">
          Free to join for young entrepreneurs ages 13–19. Sign in with Discord to create your member profile.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={joinHref}
            className="btn btn-gold"
          >
            Join Ventrio
          </Link>
          <Link
            href="/events"
            className="btn btn-outline"
          >
            See events
          </Link>
        </div>
      </section>
    </>
  );
}
