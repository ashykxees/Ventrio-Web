import { Field } from "@/components/coach/fields";
import { Empty, PageTitle, Panel, Stat } from "@/components/coach/ui";
import { coachName, getActiveCoaches, requireLeadership } from "@/lib/coach/access";
import { getCoachConfig } from "@/lib/coach/config";
import { sumCents } from "@/lib/coach/queries";
import { parseRange } from "@/lib/coach/range";
import { formatMoney, isoWeekKey } from "@/lib/coach/rules";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Reports & Analytics" };

function Bar({ label, value, max, suffix = "" }: { label: string; value: number; max: number; suffix?: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3 text-xs">
      <span className="truncate text-slate">{label}</span>
      <span className="h-2 rounded-full bg-panel">
        <span
          className="block h-2 rounded-full bg-gold"
          style={{ width: `${max ? Math.round((value / max) * 100) : 0}%` }}
        />
      </span>
      <span className="text-right text-cream">
        {value}
        {suffix}
      </span>
    </div>
  );
}

const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "—");

export default async function LeadershipReportsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await props.searchParams;
  const ctx = await requireLeadership();
  const range = parseRange(sp, 3);
  const inRange = { gte: range.from, lte: range.to };
  const [config, coaches, sessions, requests, submissions, payroll, assignments, resources, policies, reviews] = await Promise.all([
    getCoachConfig(),
    getActiveCoaches(),
    prisma.coachSession.findMany({ where: { startAt: inRange }, select: { coachId: true, startAt: true, status: true, weekKey: true, timezone: true } }),
    prisma.coachRequest.findMany({ where: { createdAt: inRange, status: { not: "DRAFT" } }, select: { status: true, createdAt: true, reviewedAt: true } }),
    prisma.projectSubmission.findMany({ where: { createdAt: inRange }, select: { status: true } }),
    prisma.payrollRecord.findMany({ where: { approvedAt: inRange, status: { not: "VOID" } }, select: { status: true, amountCents: true, paidAt: true } }),
    prisma.taskAssignment.findMany({ where: { assignedAt: inRange }, include: { task: { select: { dueAt: true } } } }),
    prisma.coachResource.findMany({ where: { updatedAt: inRange, status: { not: "DRAFT" } }, select: { status: true } }),
    prisma.policy.findMany({ where: { status: "PUBLISHED", requiresAck: true, currentVersion: { gt: 0 } }, include: { versions: { include: { acks: true } } } }),
    prisma.performanceReview.findMany({ where: { periodEnd: inRange }, select: { status: true, acknowledgedAt: true } }),
  ]);
  const currency = config.currency || "USD";
  const now = new Date();

  const weeks = new Map<string, number>();
  for (const s of sessions) {
    if (s.status !== "CANCELLED") {
      const key = isoWeekKey(s.startAt, s.timezone);
      weeks.set(key, (weeks.get(key) ?? 0) + 1);
    }
  }
  const weekKeys = Array.from(new Set(sessions.filter((s) => s.weekKey).map((s) => s.weekKey!))).sort();
  const perCoach = coaches.map((coach) => ({
    name: coachName(coach),
    sessions: sessions.filter((s) => s.coachId === coach.id && s.status !== "CANCELLED").length,
    weeks: new Set(sessions.filter((s) => s.coachId === coach.id && s.weekKey).map((s) => s.weekKey)).size,
  }));
  const maxWeek = Math.max(0, ...weeks.values());
  const maxCoach = Math.max(0, ...perCoach.map((c) => c.sessions));
  const reviewed = requests.filter((r) => r.reviewedAt);
  const avgHours = reviewed.length ? Math.round(reviewed.reduce((t, r) => t + (r.reviewedAt!.getTime() - r.createdAt.getTime()), 0) / reviewed.length / 3600000) : null;
  const decided = submissions.filter((s) => ["APPROVED", "REJECTED"].includes(s.status));
  const coachIds = new Set(coaches.map((c) => c.userId));
  const ackNeeded = policies.length * coachIds.size;
  const acked = policies.reduce((t, p) => {
    const current = p.versions.find((v) => v.version === p.currentVersion);
    return t + (current?.acks.filter((a) => coachIds.has(a.userId)).length ?? 0);
  }, 0);

  return (
    <>
      <PageTitle
        title="Reports & Analytics"
        description={`Live database figures for ${range.fromText} to ${range.toText}. Activity counts aren't a measure of a coach's performance on their own.`}
      />
      <form className="flex flex-wrap items-end gap-3">
        <Field
          label="From"
          name="from"
          type="date"
          defaultValue={range.fromText}
        />
        <Field
          label="To"
          name="to"
          type="date"
          defaultValue={range.toText}
        />
        <button
          type="submit"
          className="btn btn-outline btn-sm"
        >
          Apply
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Sessions held or scheduled"
          value={sessions.filter((s) => s.status !== "CANCELLED").length}
          note={`${sessions.filter((s) => s.status === "CANCELLED").length} cancelled · ${sessions.filter((s) => s.status === "RESCHEDULED").length} rescheduled`}
        />
        <Stat
          label="Requests"
          value={requests.length}
          note={`Avg. first review ${avgHours === null ? "—" : `${avgHours} h`} · ${requests.filter((r) => ["SUBMITTED", "UNDER_REVIEW", "MORE_INFO"].includes(r.status)).length} unresolved`}
        />
        <Stat
          label="Project submissions"
          value={submissions.length}
          note={`Approval rate ${pct(decided.filter((s) => s.status === "APPROVED").length, decided.length)} of decided`}
        />
        <Stat
          label="Compensation approved"
          value={formatMoney(sumCents(payroll), currency)}
          note={`Marked paid ${formatMoney(sumCents(payroll.filter((p) => p.status === "PAID")), currency)} · outstanding ${formatMoney(sumCents(payroll.filter((p) => p.status === "PENDING")), currency)}`}
        />
        <Stat
          label="Tasks assigned"
          value={assignments.length}
          note={`${assignments.filter((a) => a.status === "COMPLETED").length} completed · ${assignments.filter((a) => !["COMPLETED", "CANCELLED"].includes(a.status) && a.task.dueAt && a.task.dueAt < now).length} overdue`}
        />
        <Stat
          label="Lessons & resources"
          value={resources.length}
          note={`${resources.filter((r) => r.status === "PUBLISHED").length} published · ${resources.filter((r) => r.status === "SUBMITTED").length} awaiting review`}
        />
        <Stat
          label="Policy acknowledgment"
          value={pct(acked, ackNeeded)}
          note={`${acked} of ${ackNeeded} required (current versions, active coaches)`}
        />
        <Stat
          label="Performance reviews"
          value={reviews.length}
          note={`${reviews.filter((r) => r.status === "FINAL").length} finalized · ${reviews.filter((r) => r.acknowledgedAt).length} read by coach`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Sessions by week">
          {weeks.size === 0 ? (
            <Empty>No sessions in this range.</Empty>
          ) : (
            <div className="space-y-2">
              {Array.from(weeks.entries())
                .sort()
                .map(([week, count]) => (
                  <Bar
                    key={week}
                    label={week}
                    value={count}
                    max={maxWeek}
                  />
                ))}
            </div>
          )}
        </Panel>
        <Panel title="Sessions & weekly compliance by coach">
          {perCoach.length === 0 ? (
            <Empty>No active coaches.</Empty>
          ) : (
            <div className="space-y-2">
              {perCoach.map((coach) => (
                <Bar
                  key={coach.name}
                  label={`${coach.name} (${coach.weeks}/${weekKeys.length || 0} wks)`}
                  value={coach.sessions}
                  max={maxCoach}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>
      <p className="text-xs text-slate">Report generated for {ctx.profile.displayName}. Weekly compliance counts weeks in this range where at least one coach booked a weekly call.</p>
    </>
  );
}
