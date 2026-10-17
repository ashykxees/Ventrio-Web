import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Cross, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
  description: "Ventrio's mission, vision and values.",
};

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Integrity",
    text: "We build honestly, keep our word, and treat customers, teammates and competitors with respect.",
  },
  {
    icon: BookOpen,
    title: "Learning",
    text: "We stay curious, practice often, and see every setback as part of getting better.",
  },
  {
    icon: HeartHandshake,
    title: "Collaboration",
    text: "We share what we know, celebrate each other's wins, and build better together.",
  },
  {
    icon: Cross,
    title: "Faith",
    text: "We let faith shape our character, our decisions, and the way we lead.",
  },
  {
    icon: Sparkles,
    title: "Positive Impact",
    text: "We use our skills and businesses to serve people and make a difference in our communities.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About Ventrio"
        title="Building the next generation of entrepreneurs"
        description="Ventrio is a community for young entrepreneurs ages 13–19 to learn business and marketing, connect with peers, compete in pitch competitions, and grow in faith."
      />

      <section className="container-page grid gap-6 py-20 md:grid-cols-2">
        <div className="card p-8 sm:p-10">
          <p className="eyebrow">Mission</p>
          <p className="mt-5 font-display text-lg leading-relaxed text-cream">
            Empower the next generation of entrepreneurs through practical education, meaningful connections,
            creative competition, and faith-centered growth.
          </p>
        </div>
        <div className="card p-8 sm:p-10">
          <p className="eyebrow">Vision</p>
          <p className="mt-5 font-display text-lg leading-relaxed text-cream">
            Help young leaders build businesses with integrity, develop their character, and use their skills
            to make a positive impact.
          </p>
        </div>
      </section>

      <section className="border-y border-line bg-ink">
        <div className="container-page grid gap-12 py-20 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading
            eyebrow="Who we serve"
            title="Ages 13–19"
          />
          <div className="space-y-5 leading-relaxed text-slate">
            <p>
              Ventrio is built for students who are curious about business — whether you already run a small
              side hustle, have an idea you can&apos;t stop thinking about, or simply want to learn how
              businesses work.
            </p>
            <p>
              Members learn through lessons and coaching, practice through pitch competitions, and grow
              alongside peers who share their ambition and values. No experience is required.
            </p>
            <p>
              Because our community includes minors, we keep data collection to a minimum and make member
              profiles private by default. Read our{" "}
              <Link
                href="/privacy"
                className="text-gold hover:text-gold-soft"
              >
                Privacy Policy
              </Link>{" "}
              to learn more.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-20 sm:py-28">
        <SectionHeading
          eyebrow="Values"
          title="What we stand for"
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="card p-6"
            >
              <Icon
                className="h-6 w-6 text-gold"
                strokeWidth={1.5}
              />
              <h3 className="mt-5 font-display text-xs font-semibold tracking-[0.2em] text-cream uppercase">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="container-page flex flex-col items-start justify-between gap-6 py-16 sm:flex-row sm:items-center">
          <p className="display text-xl text-cream">Build better together.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/community"
              className="btn btn-gold"
            >
              Join the community
            </Link>
            <Link
              href="/academy"
              className="btn btn-outline"
            >
              Explore the Academy
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
