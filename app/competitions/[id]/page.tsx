import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Trophy } from "lucide-react";
import { SignInWithDiscord } from "@/components/AuthButtons";
import { SubmissionForm } from "@/components/SubmissionForm";
import { SubmitButton } from "@/components/SubmitButton";
import { Badge, Notice, TextBlock } from "@/components/ui";
import { submitEntry, withdrawEntry } from "@/app/actions/submissions";
import { COMPETITION_PHASES, SUBMISSION_STATUSES, labelFor } from "@/lib/constants";
import {
  PHASE_TONE,
  SUBMISSION_TONE,
  competitionAcceptsSubmissions,
  parseSubmissionFields,
} from "@/lib/content";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/session";

async function getCompetition(id: string) {
  const competition = await prisma.competition.findUnique({ where: { id } });

  return competition?.status === "PUBLISHED" ? competition : null;
}

export async function generateMetadata(props: PageProps<"/competitions/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const competition = await getCompetition(id);

  return { title: competition?.title ?? "Competition" };
}

function DetailSection({ title, text }: { title: string; text: string }) {
  if (!text) {
    return null;
  }

  return (
    <section className="border-t border-line pt-8">
      <h2 className="eyebrow">{title}</h2>
      <div className="mt-4">
        <TextBlock text={text} />
      </div>
    </section>
  );
}

export default async function CompetitionPage(props: PageProps<"/competitions/[id]">) {
  const { id } = await props.params;
  const competition = await getCompetition(id);

  if (!competition) {
    notFound();
  }

  const member = await getCurrentMember();
  const submission = member
    ? await prisma.submission.findUnique({
        where: { competitionId_userId: { competitionId: competition.id, userId: member.userId } },
      })
    : null;

  const fields = parseSubmissionFields(competition.submissionFields);
  const accepting = competitionAcceptsSubmissions(competition);
  const editable = !submission || ["SUBMITTED", "WITHDRAWN"].includes(submission.status);
  const answers: Record<string, string> = submission ? JSON.parse(submission.answers) : {};

  return (
    <article className="container-page py-12 sm:py-16">
      <Link
        href="/competitions"
        className="inline-flex items-center gap-2 text-sm text-slate hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4" />
        All competitions
      </Link>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <div>
            <Badge tone={PHASE_TONE[competition.phase]}>
              {labelFor(COMPETITION_PHASES, competition.phase)}
            </Badge>
            <h1 className="mt-6 font-display text-3xl font-semibold text-cream sm:text-4xl">
              {competition.title}
            </h1>
            <span className="gold-rule mt-8" />
            <p className="mt-8 text-lg leading-relaxed text-cream/90">{competition.summary}</p>
            {competition.description && (
              <div className="mt-6">
                <TextBlock text={competition.description} />
              </div>
            )}
          </div>

          <DetailSection
            title="Eligibility"
            text={competition.eligibility}
          />
          <DetailSection
            title="Submission requirements"
            text={competition.requirements}
          />
          <DetailSection
            title="Judging criteria"
            text={competition.judgingCriteria}
          />
          {competition.prizesVerified && competition.prizes && (
            <DetailSection
              title="Prizes"
              text={competition.prizes}
            />
          )}

          <section
            id="submit"
            className="border-t border-line pt-8"
          >
            <h2 className="eyebrow">Your submission</h2>
            <div className="mt-6">
              {!member ? (
                <div className="card space-y-4 p-6">
                  <p className="text-sm text-slate">
                    {accepting
                      ? "Sign in with Discord to submit your entry."
                      : "Sign in to see your submission and feedback."}
                  </p>
                  <SignInWithDiscord callbackUrl={`/competitions/${competition.id}#submit`} />
                </div>
              ) : (
                <div className="space-y-6">
                  {submission && (
                    <div className="card space-y-4 p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-slate">
                          Last updated {formatDateTime(submission.updatedAt, competition.timezone)}
                        </p>
                        <Badge tone={SUBMISSION_TONE[submission.status]}>
                          {labelFor(SUBMISSION_STATUSES, submission.status)}
                        </Badge>
                      </div>
                      {submission.score !== null && (
                        <p className="text-sm text-cream">
                          Score: <span className="text-gold">{submission.score} / 100</span>
                        </p>
                      )}
                      {submission.feedback && (
                        <div>
                          <p className="text-xs font-medium tracking-wide text-slate uppercase">
                            Judge feedback
                          </p>
                          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-cream">
                            {submission.feedback}
                          </p>
                        </div>
                      )}
                      {submission.status === "SUBMITTED" && accepting && (
                        <form action={withdrawEntry.bind(null, competition.id)}>
                          <SubmitButton
                            className="btn btn-danger btn-sm"
                            pendingLabel="Withdrawing…"
                          >
                            Withdraw submission
                          </SubmitButton>
                        </form>
                      )}
                    </div>
                  )}

                  {accepting && editable ? (
                    fields.length > 0 ? (
                      <SubmissionForm
                        fields={fields}
                        initialValues={answers}
                        isUpdate={Boolean(submission)}
                        action={submitEntry.bind(null, competition.id)}
                      />
                    ) : (
                      <Notice tone="warning">
                        The submission form hasn&apos;t been set up yet. Check back soon.
                      </Notice>
                    )
                  ) : (
                    !submission && (
                      <p className="text-sm text-slate">
                        {competition.phase === "UPCOMING"
                          ? "Submissions haven't opened yet."
                          : "Submissions are closed for this competition."}
                      </p>
                    )
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="card h-fit space-y-5 p-6 text-sm lg:sticky lg:top-24">
          {competition.opensAt && (
            <div className="flex gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <div>
                <p className="text-xs tracking-wide text-slate uppercase">Opens</p>
                <p className="mt-1 text-cream">{formatDateTime(competition.opensAt, competition.timezone)}</p>
              </div>
            </div>
          )}
          {competition.deadline && (
            <div className="flex gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <div>
                <p className="text-xs tracking-wide text-slate uppercase">Deadline</p>
                <p className="mt-1 text-cream">
                  {formatDateTime(competition.deadline, competition.timezone)}
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <div>
              <p className="text-xs tracking-wide text-slate uppercase">Prizes</p>
              <p className="mt-1 text-cream">
                {competition.prizesVerified && competition.prizes ? "See prize details" : "To be announced"}
              </p>
            </div>
          </div>
          {accepting && (
            <a
              href="#submit"
              className="btn btn-gold w-full"
            >
              {submission ? "View your submission" : "Submit your entry"}
            </a>
          )}
        </aside>
      </div>
    </article>
  );
}
