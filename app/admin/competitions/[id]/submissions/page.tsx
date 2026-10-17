import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/admin/ReviewForm";
import { Badge } from "@/components/ui";
import { reviewSubmission } from "@/app/actions/admin";
import { SUBMISSION_STATUSES, labelFor } from "@/lib/constants";
import { SUBMISSION_TONE, parseSubmissionFields } from "@/lib/content";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function AdminSubmissionsPage(props: PageProps<"/admin/competitions/[id]/submissions">) {
  const { id } = await props.params;
  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
      submissions: {
        orderBy: { createdAt: "asc" },
        include: { user: { include: { profile: true } } },
      },
    },
  });

  if (!competition) {
    notFound();
  }

  const fields = parseSubmissionFields(competition.submissionFields);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/competitions"
          className="text-sm text-slate hover:text-gold"
        >
          ← Competitions
        </Link>
        <h1 className="mt-2 font-display text-xl font-semibold text-cream">
          {competition.title} — submissions
        </h1>
        <p className="mt-2 text-sm text-slate">
          Scores and feedback are shown only to the member who submitted. Judging criteria are published on
          the competition page.
        </p>
      </div>

      {competition.submissions.length === 0 ? (
        <p className="card px-6 py-12 text-center text-sm text-slate">No submissions yet.</p>
      ) : (
        <div className="space-y-6">
          {competition.submissions.map((submission) => {
            const answers: Record<string, string> = JSON.parse(submission.answers);
            const profile = submission.user.profile;

            return (
              <article
                key={submission.id}
                className="card grid gap-8 p-6 lg:grid-cols-2"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-display font-semibold text-cream">
                        {profile?.displayName ?? "Member"}
                      </p>
                      <p className="text-xs text-slate">
                        @{profile?.discordUsername ?? "unknown"} ·{" "}
                        {formatDateTime(submission.updatedAt, competition.timezone)}
                      </p>
                    </div>
                    <Badge tone={SUBMISSION_TONE[submission.status]}>
                      {labelFor(SUBMISSION_STATUSES, submission.status)}
                    </Badge>
                  </div>
                  <dl className="mt-6 space-y-4 text-sm">
                    {fields.map((field) => (
                      <div key={field.key}>
                        <dt className="text-xs tracking-wide text-slate uppercase">{field.label}</dt>
                        <dd className="mt-1 whitespace-pre-line text-cream">
                          {field.type === "url" && answers[field.key] ? (
                            <a
                              href={answers[field.key]}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="break-all text-gold hover:text-gold-soft"
                            >
                              {answers[field.key]}
                            </a>
                          ) : (
                            answers[field.key] || <span className="text-slate">—</span>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="border-t border-line pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                  <ReviewForm
                    submissionId={submission.id}
                    status={submission.status}
                    score={submission.score}
                    feedback={submission.feedback}
                    action={reviewSubmission.bind(null, submission.id)}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
