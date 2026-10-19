import type { Metadata } from "next";
import { ArrowDown, CalendarDays, Check, ExternalLink, Megaphone, Target } from "lucide-react";
import { SignInWithDiscord } from "@/components/AuthButtons";
import { CoachApplicationForm } from "@/components/CoachApplicationForm";
import { Badge, SectionHeading } from "@/components/ui";
import { submitCoachApplication } from "@/app/actions/careers";
import { APPLICATION_STATUSES, APPLICATION_TONE, getCalendlyUrl } from "@/lib/careers";
import { labelFor } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getCurrentMemberSafe } from "@/lib/session";
import { isDiscordConfigured } from "@/lib/site";

export const metadata: Metadata = {
  title: "Become a Ventrio Coach",
  description:
    "Help shape the next generation of entrepreneurs as a Ventrio Marketing Coach or Business Strategy Coach.",
};

const POSITIONS = [
  {
    icon: Megaphone,
    title: "Marketing Coach",
    topics: [
      "Marketing fundamentals and strategy",
      "Branding and brand positioning",
      "Social media and content creation",
      "Audience research and customer engagement",
      "Marketing campaigns and growth strategies",
      "Communicating a business's value",
    ],
  },
  {
    icon: Target,
    title: "Business Strategy Coach",
    topics: [
      "Business idea development and validation",
      "Target customers and market research",
      "Business planning and goal-setting",
      "Pricing, revenue models, and sales strategy",
      "Business growth and decision-making",
      "Identifying challenges and planning next steps",
    ],
  },
];

const RESPONSIBILITIES = [
  "Prepare and deliver beginner-friendly lessons.",
  "Answer appropriate questions and mentor members.",
  "Provide constructive feedback on business ideas and marketing strategies.",
  "Help members develop practical next steps.",
  "Participate in workshops, networking sessions, and pitch competitions when available.",
  "Share useful resources and coordinate with the Ventrio team.",
  "Represent Ventrio's values of faith, business, impact, honesty, respect, and service.",
];

const EXPECTATIONS = [
  "Have relevant knowledge, experience, skills, or practical examples to share.",
  "Communicate clearly and explain concepts to beginners.",
  "Be reliable and honor agreed commitments.",
  "Prepare lessons and coaching sessions in advance.",
  "Be honest about the limits of your knowledge.",
  "Never guarantee profits or promise business success.",
  "Give constructive feedback without belittling or discouraging members.",
  "Protect private information and maintain appropriate professional boundaries.",
  "Follow Ventrio's conduct and safeguarding policies.",
  "Respect the fact that the community may include teenagers.",
  "Accept feedback and work collaboratively with the team.",
];

const STATUS_COPY: Record<string, string> = {
  SUBMITTED:
    "Thanks for applying. We review every application carefully. Applicants selected for an interview will receive instructions to book a one-on-one interview.",
  IN_REVIEW: "Your application is being reviewed by the Ventrio team. We'll be in touch.",
  INTERVIEW: "You've been selected for a one-on-one interview. Book a time that works for you below.",
  ACCEPTED: "Welcome to the Ventrio coaching team. We'll reach out with next steps.",
  NOT_SELECTED:
    "Thank you for your interest in coaching at Ventrio. We aren't moving forward with your application at this time.",
};

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-3 text-sm leading-relaxed text-slate"
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default async function CareersPage() {
  const member = await getCurrentMemberSafe();
  const application = member
    ? await prisma.coachApplication.findUnique({ where: { userId: member.userId } })
    : null;

  return (
    <>
      <section className="border-b border-line">
        <div className="container-page py-20 sm:py-28">
          <p className="eyebrow">Careers</p>
          <h1 className="display mt-5 max-w-3xl text-3xl text-cream sm:text-5xl">Become a Ventrio Coach</h1>
          <span className="gold-rule mt-8" />
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-slate sm:text-lg">
            Help shape the next generation of entrepreneurs. Share your knowledge, teach practical skills, and
            help young people turn their ideas into action.
          </p>
          <a
            href="#apply"
            className="btn btn-gold mt-10"
          >
            Apply to Become a Coach
            <ArrowDown className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section className="container-page py-20">
        <SectionHeading
          eyebrow="Open positions"
          title="Two ways to coach"
          description="Apply for either position, or both."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {POSITIONS.map(({ icon: Icon, title, topics }) => (
            <article
              key={title}
              className="card p-8"
            >
              <Icon
                className="h-6 w-6 text-gold"
                strokeWidth={1.5}
              />
              <h3 className="mt-5 font-display text-lg font-semibold text-cream">{title}</h3>
              <p className="mt-2 text-sm text-slate">Help members understand and apply:</p>
              <div className="mt-5">
                <BulletList items={topics} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-ink">
        <div className="container-page grid gap-12 py-20 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="The role"
              title="What coaches do"
            />
            <div className="mt-8">
              <BulletList items={RESPONSIBILITIES} />
            </div>
          </div>
          <div>
            <SectionHeading
              eyebrow="Standards"
              title="Coach expectations"
            />
            <div className="mt-8">
              <BulletList items={EXPECTATIONS} />
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <SectionHeading
          eyebrow="Hiring process"
          title="What happens after you apply"
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <div className="card p-8">
            <h3 className="font-display text-base font-semibold text-cream">Compensation</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate">
              Compensation, payment structure, and related terms will be discussed during the one-on-one
              interview. Specific payment terms are not guaranteed by submitting an application and must be
              discussed before any arrangement is agreed upon.
            </p>
          </div>
          <div className="card p-8">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold text-cream">
              <CalendarDays className="h-4 w-4 text-gold" />
              Interview scheduling
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate">
              Applicants selected for an interview will receive instructions for booking a one-on-one
              interview through Calendly. Submitting an application does not mean you have been selected for
              an interview.
            </p>
          </div>
        </div>
      </section>

      <section
        id="apply"
        className="scroll-mt-20 border-t border-line bg-ink"
      >
        <div className="container-page max-w-3xl py-20">
          <SectionHeading
            eyebrow="Apply"
            title="Coach application"
            description="Discord sign-in is required so we can verify who you are. We only see your Discord username and avatar."
          />

          <div className="mt-10">
            {!member ? (
              <div className="card space-y-4 p-8">
                <p className="text-sm text-slate">Continue with Discord to start your application.</p>
                {isDiscordConfigured() ? (
                  <SignInWithDiscord
                    callbackUrl="/careers#apply"
                    className="btn btn-gold w-full sm:w-auto"
                    label="Continue with Discord"
                  />
                ) : (
                  <p className="text-sm text-slate">
                    Discord sign-in isn&apos;t available yet. Please check back soon.
                  </p>
                )}
              </div>
            ) : application ? (
              <div
                className="card space-y-5 p-8"
                role="status"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold text-cream">
                    {application.status === "SUBMITTED" ? "Application submitted" : "Your application"}
                  </h3>
                  <Badge tone={APPLICATION_TONE[application.status]}>
                    {labelFor(APPLICATION_STATUSES, application.status)}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-slate">{STATUS_COPY[application.status]}</p>
                {application.status === "INTERVIEW" && (
                  <a
                    href={getCalendlyUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-gold"
                  >
                    Book your interview
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <p className="border-t border-line pt-4 text-xs text-slate">
                  Applied as @{application.discordUsername} ·{" "}
                  {application.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" })}
                </p>
              </div>
            ) : (
              <div className="card p-6 sm:p-8">
                <CoachApplicationForm
                  discordUsername={member.profile.discordUsername}
                  action={submitCoachApplication}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
