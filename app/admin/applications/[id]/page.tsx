import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationReviewForm } from "@/components/admin/ApplicationReviewForm";
import { Badge } from "@/components/ui";
import { reviewCoachApplication } from "@/app/actions/careers";
import {
  APPLICATION_STATUSES,
  APPLICATION_TONE,
  COACH_POSITIONS,
  EXPERIENCE_QUESTIONS,
  TEACHING_QUESTIONS,
  getCalendlyUrl,
} from "@/lib/careers";
import { labelFor } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function AdminApplicationPage(props: PageProps<"/admin/applications/[id]">) {
  const { id } = await props.params;
  const application = await prisma.coachApplication.findUnique({ where: { id } });

  if (!application) {
    notFound();
  }

  const answers = [...EXPERIENCE_QUESTIONS, ...TEACHING_QUESTIONS].map((question) => ({
    label: question.label,
    value: application[question.name as keyof typeof application] as string,
  }));

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-8">
        <div>
          <Link
            href="/admin/applications"
            className="text-sm text-slate hover:text-gold"
          >
            ← Applications
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-xl font-semibold text-cream">@{application.discordUsername}</h1>
            <Badge tone={APPLICATION_TONE[application.status]}>
              {labelFor(APPLICATION_STATUSES, application.status)}
            </Badge>
          </div>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs tracking-wide text-slate uppercase">Position</dt>
              <dd className="text-cream">{labelFor(COACH_POSITIONS, application.position)}</dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-slate uppercase">Email</dt>
              <dd>
                <a
                  href={`mailto:${application.email}`}
                  className="text-gold hover:text-gold-soft"
                >
                  {application.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-slate uppercase">Discord user ID</dt>
              <dd className="font-mono text-cream">{application.discordId}</dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-slate uppercase">Submitted</dt>
              <dd className="text-cream">{application.createdAt.toLocaleString("en-US")}</dd>
            </div>
          </dl>
        </div>

        <dl className="space-y-6">
          {answers.map((answer) => (
            <div
              key={answer.label}
              className="card p-5"
            >
              <dt className="text-sm font-medium text-cream">{answer.label}</dt>
              <dd className="mt-2 text-sm leading-relaxed whitespace-pre-line text-slate">{answer.value}</dd>
            </div>
          ))}
          {application.links && (
            <div className="card p-5">
              <dt className="text-sm font-medium text-cream">Links</dt>
              <dd className="mt-2 space-y-1 text-sm">
                {application.links
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((link) => (
                    <a
                      key={link}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="block break-all text-gold hover:text-gold-soft"
                    >
                      {link}
                    </a>
                  ))}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-base font-semibold text-cream">Review</h2>
        <p className="text-xs leading-relaxed text-slate">
          Setting the status to <span className="text-cream">Interview</span> shows the applicant a button to
          book through{" "}
          <a
            href={getCalendlyUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:text-gold-soft"
          >
            Calendly
          </a>{" "}
          on /careers.
        </p>
        <ApplicationReviewForm
          status={application.status}
          adminNotes={application.adminNotes}
          action={reviewCoachApplication.bind(null, application.id)}
        />
      </aside>
    </div>
  );
}
