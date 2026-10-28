import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelSession, submitSessionReport } from "@/app/actions/coach";
import { ActionForm } from "@/components/coach/ActionForm";
import { Field, Hidden, Select, TextArea } from "@/components/coach/fields";
import { SessionForm } from "@/components/coach/SessionForm";
import { Notice } from "@/components/ui";
import { Detail, LinkList, PageTitle, Panel, StatusBadge } from "@/components/coach/ui";
import { requireCoach } from "@/lib/coach/access";
import { getCoachConfig } from "@/lib/coach/config";
import { SESSION_STATUSES } from "@/lib/coach/constants";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function CoachSessionPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const ctx = await requireCoach();
  const tz = ctx.timezone;
  const [config, session] = await Promise.all([
    getCoachConfig(),
    prisma.coachSession.findFirst({
      where: { id, coachId: ctx.coach.id },
      include: { report: true, events: { orderBy: { createdAt: "desc" } } },
    }),
  ]);

  if (!session) {
    notFound();
  }

  const editable = !["CANCELLED", "COMPLETED"].includes(session.status);
  const started = session.startAt <= new Date();

  return (
    <>
      <PageTitle
        title={session.title}
        description={`${session.sessionType} · ${formatDateTime(session.startAt, tz)} · ${session.durationMinutes} min`}
      >
        <StatusBadge
          status={session.status}
          options={SESSION_STATUSES}
        />
      </PageTitle>
      <Link
        href="/coach/sessions"
        className="text-sm text-gold"
      >
        ← All sessions
      </Link>
      {session.leadershipFeedback && <Notice title="Feedback from leadership">{session.leadershipFeedback}</Notice>}

      <Panel title="Details">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Topic">{session.topic}</Detail>
          <Detail label="Audience">{session.audience}</Detail>
          <Detail label="Original time zone">{session.timezone}</Detail>
          <Detail label="Platform">{session.platform}</Detail>
          <Detail label="Meeting link">
            <LinkList text={session.meetingUrl} />
          </Detail>
          <Detail label="Counts as weekly call">{session.weekKey ? `Yes (${session.weekKey})` : "No"}</Detail>
          <Detail label="Objectives">{session.objectives}</Detail>
          <Detail label="Preparation notes">{session.prepNotes}</Detail>
        </dl>
      </Panel>

      {editable && (
        <Panel title={started ? "Edit details" : "Edit or reschedule"}>
          <SessionForm
            config={config}
            timezone={tz}
            session={session}
          />
        </Panel>
      )}

      {started && session.status !== "CANCELLED" && (
        <Panel title="Record the outcome">
          {config.completionRequirements && <p className="mb-4 text-sm text-slate">{config.completionRequirements}</p>}
          <ActionForm
            action={submitSessionReport}
            submitLabel="Save report"
          >
            <Hidden
              name="id"
              value={session.id}
            />
            <Select
              label="Did the session happen?"
              name="occurred"
              required
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              defaultValue={session.report ? (session.report.occurred ? "yes" : "no") : "yes"}
            />
            {config.attendanceTracking && (
              <Field
                label="Attendance (number of members)"
                name="attendance"
                type="number"
                min={0}
                defaultValue={session.report?.attendance ?? undefined}
              />
            )}
            <TextArea
              label="Topics covered"
              name="topicsCovered"
              defaultValue={session.report?.topicsCovered}
            />
            <TextArea
              label="Resources used"
              name="resourcesUsed"
              rows={2}
              defaultValue={session.report?.resourcesUsed}
            />
            <TextArea
              label="Follow-up tasks"
              name="followUp"
              rows={2}
              defaultValue={session.report?.followUp}
            />
            <TextArea
              label="Feedback or notes"
              name="notes"
              rows={2}
              defaultValue={session.report?.notes}
            />
          </ActionForm>
        </Panel>
      )}

      {editable && (
        <Panel title="Cancel session">
          <ActionForm
            action={cancelSession}
            intents={[{ value: "cancel", label: "Cancel session", variant: "danger", confirm: "Cancel this session? It stays in your history." }]}
          >
            <Hidden
              name="id"
              value={session.id}
            />
            <Field
              label="Reason (shared with leadership)"
              name="reason"
              maxLength={500}
            />
          </ActionForm>
        </Panel>
      )}

      <Panel title="History">
        <ul className="space-y-2 text-sm text-slate">
          {session.events.map((event) => (
            <li key={event.id}>
              <span className="text-cream">{event.action.replace(/_/g, " ").toLowerCase()}</span> ·{" "}
              {formatDateTime(event.createdAt, tz)}
              {event.detail && ` · ${event.detail}`}
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
