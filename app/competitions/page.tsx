import type { Metadata } from "next";
import { CompetitionCard } from "@/components/cards";
import { EmptyState, PageHeader, SectionHeading } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Pitch Competitions",
  description: "Present your business idea, get feedback, and grow as an entrepreneur.",
};

const STEPS = [
  {
    title: "Check eligibility",
    text: "Each competition lists who can enter. Most are open to Ventrio members ages 13–19.",
  },
  {
    title: "Prepare your pitch",
    text: "Read the submission requirements and judging criteria, then build your pitch around them.",
  },
  {
    title: "Submit before the deadline",
    text: "Sign in and submit your entry on the competition page. You can update it until review starts.",
  },
  {
    title: "Get feedback",
    text: "Judges score entries against the published criteria. Your feedback and result are shared privately with you.",
  },
];

const PHASES = [
  { label: "Upcoming", text: "Announced — submissions open soon." },
  { label: "Open", text: "Accepting submissions until the deadline." },
  { label: "In Review", text: "Submissions closed; judges are reviewing." },
  { label: "Completed", text: "Judging finished and results shared." },
];

const ORDER = ["OPEN", "UPCOMING", "IN_REVIEW", "COMPLETED"];

export default async function CompetitionsPage() {
  const competitions = await prisma.competition.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
  });

  competitions.sort((a, b) => ORDER.indexOf(a.phase) - ORDER.indexOf(b.phase));

  return (
    <>
      <PageHeader
        eyebrow="Pitch Competitions"
        title="Pitch your idea. Grow your skills."
        description="Friendly, structured competitions where you present a business idea, get scored on transparent criteria, and receive feedback to help you improve."
      />

      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="How it works"
          title="From idea to pitch"
        />
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="card p-6"
            >
              <p className="font-display text-sm font-semibold tracking-[0.2em] text-gold">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-display text-sm font-semibold text-cream">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate">{step.text}</p>
            </li>
          ))}
        </ol>
        <dl className="mt-10 grid gap-x-8 gap-y-4 border-t border-line pt-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {PHASES.map((phase) => (
            <div key={phase.label}>
              <dt className="font-display text-xs font-semibold tracking-[0.2em] text-cream uppercase">
                {phase.label}
              </dt>
              <dd className="mt-1 text-slate">{phase.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-line bg-ink">
        <div className="container-page py-16 sm:py-20">
          <SectionHeading
            eyebrow="Competitions"
            title="Current & past"
          />
          <div className="mt-10">
            {competitions.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {competitions.map((competition) => (
                  <CompetitionCard
                    key={competition.id}
                    competition={competition}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No competitions announced yet"
                description="The first Ventrio pitch competition is in the works. Join the community to hear when it opens."
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
