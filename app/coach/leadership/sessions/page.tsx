import { reviewSession } from "@/app/actions/leadership";
import { ActionForm } from "@/components/coach/ActionForm";
import { Hidden, Select, TextArea } from "@/components/coach/fields";
import { Empty, LinkList, PageTitle, Panel, StatusBadge } from "@/components/coach/ui";
import { coachName, getActiveCoaches, requireLeadership } from "@/lib/coach/access";
import { SESSION_STATUSES } from "@/lib/coach/constants";
import { isoWeekKey, weekStartUtc } from "@/lib/coach/rules";
import { formatDate, formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Session Management" };

export default async function LeadershipSessionsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const ctx = await requireLeadership();
  const tz = ctx.timezone;
  const week = typeof searchParams.week === "string" && /^\d{4}-W\d{2}$/.test(searchParams.week) ? searchParams.week : isoWeekKey(new Date(), tz);
  const coachId = typeof searchParams.coach === "string" ? searchParams.coach : "";
  const status = typeof searchParams.status === "string" ? searchParams.status : "";
  const start = weekStartUtc(week);
  const end = new Date(start.getTime() + 7 * 86400000);
  const [coaches, sessions, weekly] = await Promise.all([
    getActiveCoaches(),
    prisma.coachSession.findMany({
      where: {
        // Pad by a day either side so sessions near midnight in other time zones still show.
        startAt: { gte: new Date(start.getTime() - 86400000), lt: new Date(end.getTime() + 86400000) },
        ...(coachId ? { coachId } : {}),
        ...(status ? { status } : {}),
      },
      include: { coach: { include: { user: { include: { profile: true } } } }, report: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.coachSession.findMany({ where: { weekKey: week }, select: { coachId: true } }),
  ]);
  const booked = new Set(weekly.map((s) => s.coachId));
  const prev = isoWeekKey(new Date(start.getTime() - 3 * 86400000), "UTC");
  const next = isoWeekKey(new Date(end.getTime() + 3 * 86400000), "UTC");

  return (
    <>
      <PageTitle
        title="Session Management"
        description={`Week of ${formatDate(start, "UTC")} (${week}). Times shown in ${tz}.`}
      >
        <a
          href={`?week=${prev}`}
          className="btn btn-outline btn-sm"
        >
          ← Previous
        </a>
        <a
          href={`?week=${next}`}
          className="btn btn-outline btn-sm"
        >
          Next →
        </a>
      </PageTitle>

      <Panel title="Weekly call compliance">
        {coaches.length === 0 ? (
          <Empty>No active coaches yet.</Empty>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {coaches.map((coach) => (
              <li
                key={coach.id}
                className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm"
              >
                <span className="text-cream">{coachName(coach)}</span>
                <span className={booked.has(coach.id) ? "text-emerald-300" : "text-red-300"}>{booked.has(coach.id) ? "Booked" : "Missing"}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <form className="flex flex-wrap items-end gap-3">
        <input
          type="hidden"
          name="week"
          value={week}
        />
        <Select
          label="Coach"
          name="coach"
          options={coaches.map((c) => ({ value: c.id, label: coachName(c) }))}
          placeholder="All coaches"
          defaultValue={coachId}
        />
        <Select
          label="Status"
          name="status"
          options={SESSION_STATUSES}
          placeholder="All statuses"
          defaultValue={status}
        />
        <button
          type="submit"
          className="btn btn-outline btn-sm"
        >
          Filter
        </button>
      </form>

      {sessions.length === 0 ? (
        <Empty>No sessions this week.</Empty>
      ) : (
        sessions.map((session) => (
          <Panel key={session.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-cream">
                  {session.title}
                  {session.weekKey && <span className="ml-2 text-xs text-gold">Weekly call</span>}
                </p>
                <p className="mt-1 text-xs text-slate">
                  {coachName(session.coach)} · {session.sessionType} · {formatDateTime(session.startAt, tz)} · {session.durationMinutes} min · booked
                  in {session.timezone}
                </p>
                <p className="mt-1 text-xs text-slate">
                  {session.topic} · {session.platform}
                </p>
              </div>
              <StatusBadge
                status={session.status}
                options={SESSION_STATUSES}
              />
            </div>
            <div className="mt-2 text-sm">
              <LinkList text={session.meetingUrl} />
            </div>
            {session.notesForLeadership && <p className="mt-2 text-sm text-slate">Coach note: {session.notesForLeadership}</p>}
            {session.report && (
              <p className="mt-2 text-sm text-slate">
                Report: {session.report.occurred ? "held" : "did not happen"}
                {session.report.attendance !== null && ` · ${session.report.attendance} attended`}
                {session.report.topicsCovered && ` · ${session.report.topicsCovered}`}
              </p>
            )}
            {session.status !== "CANCELLED" && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-gold">Review or request a change</summary>
                <div className="mt-3">
                  <ActionForm action={reviewSession}>
                    <Hidden
                      name="id"
                      value={session.id}
                    />
                    <Select
                      label="Status"
                      name="status"
                      options={SESSION_STATUSES.filter((s) => ["SCHEDULED", "NEEDS_ATTENTION", "COMPLETED"].includes(s.value))}
                      defaultValue={["SCHEDULED", "NEEDS_ATTENTION", "COMPLETED"].includes(session.status) ? session.status : "SCHEDULED"}
                    />
                    <TextArea
                      label="Feedback to the coach"
                      name="leadershipFeedback"
                      rows={2}
                      defaultValue={session.leadershipFeedback}
                    />
                  </ActionForm>
                </div>
              </details>
            )}
          </Panel>
        ))
      )}
    </>
  );
}
