import Link from "next/link";
import { Notice } from "@/components/ui";
import { Field } from "@/components/coach/fields";
import { Empty, List, PageTitle, Panel, Stat } from "@/components/coach/ui";
import { getActiveCoaches, requireLeadership, userNames } from "@/lib/coach/access";
import { getCoachConfig } from "@/lib/coach/config";
import { sumCents } from "@/lib/coach/queries";
import { formatMoney, isoWeekKey } from "@/lib/coach/rules";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { parseRange } from "@/lib/coach/range";

export const metadata = { title: "Leadership" };

export default async function LeadershipOverviewPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const ctx = await requireLeadership();
  const tz = ctx.timezone;
  const now = new Date();
  const weekKey = isoWeekKey(now, tz);
  const range = parseRange(searchParams);
  const [config, coaches, deactivated, weekSessions, upcoming, requests, submissions, pending, approved, tasks, overdue, lessons, policies, recent] =
    await Promise.all([
      getCoachConfig(),
      getActiveCoaches(),
      prisma.coachProfile.count({ where: { status: "DEACTIVATED" } }),
      prisma.coachSession.findMany({ where: { weekKey }, select: { coachId: true } }),
      prisma.coachSession.count({ where: { startAt: { gte: now }, status: { not: "CANCELLED" } } }),
      prisma.coachRequest.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
      prisma.projectSubmission.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
      prisma.payrollRecord.findMany({ where: { status: "PENDING" } }),
      prisma.payrollRecord.findMany({ where: { status: { not: "VOID" }, approvedAt: { gte: range.from, lte: range.to } } }),
      prisma.taskAssignment.count({ where: { status: { in: ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "REVISION"] } } }),
      prisma.taskAssignment.count({ where: { status: { in: ["NOT_STARTED", "IN_PROGRESS", "REVISION"] }, task: { dueAt: { lt: now } } } }),
      prisma.coachResource.count({ where: { status: "SUBMITTED" } }),
      prisma.policy.findMany({ where: { status: "PUBLISHED", requiresAck: true, currentVersion: { gt: 0 } }, include: { versions: { include: { acks: true } } } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    ]);
  const booked = new Set(weekSessions.map((s) => s.coachId));
  const missing = coaches.filter((coach) => !booked.has(coach.id));
  const coachUserIds = new Set(coaches.map((c) => c.userId));
  const outstandingAcks = policies.reduce((total, policy) => {
    const current = policy.versions.find((v) => v.version === policy.currentVersion);
    const acked = new Set(current?.acks.map((a) => a.userId));

    return total + [...coachUserIds].filter((userId) => !acked.has(userId)).length;
  }, 0);
  const names = await userNames(recent.map((entry) => entry.actorId));
  const currency = config.currency || "USD";

  return (
    <>
      <PageTitle
        title="Leadership overview"
        description="Live figures from the coach dashboard database."
      />
      {!process.env.DISCORD_BOT_TOKEN && (
        <Notice tone="warning">DISCORD_BOT_TOKEN isn&apos;t set, so coach roles can&apos;t be verified and coaches can&apos;t sign in.</Notice>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Active coaches"
          value={coaches.length}
          note={`${deactivated} deactivated`}
          href="/coach/leadership/coaches"
        />
        <Stat
          label="Weekly calls this week"
          value={`${booked.size} booked`}
          note={`${missing.length} coach${missing.length === 1 ? "" : "es"} missing`}
          href="/coach/leadership/sessions"
        />
        <Stat
          label="Upcoming sessions"
          value={upcoming}
          href="/coach/leadership/sessions"
        />
        <Stat
          label="Requests awaiting review"
          value={requests}
          href="/coach/leadership/requests"
        />
        <Stat
          label="Project work awaiting approval"
          value={submissions}
          href="/coach/leadership/payroll"
        />
        <Stat
          label="Approved, awaiting payment"
          value={formatMoney(sumCents(pending), currency)}
          note={`${pending.length} record${pending.length === 1 ? "" : "s"}`}
          href="/coach/leadership/payroll"
        />
        <Stat
          label="Open tasks"
          value={tasks}
          note={`${overdue} overdue`}
          href="/coach/leadership/tasks"
        />
        <Stat
          label="Lessons awaiting review"
          value={lessons}
          href="/coach/leadership/resources"
        />
        <Stat
          label="Policy acks outstanding"
          value={outstandingAcks}
          href="/coach/leadership/policies"
        />
      </div>

      <Panel title="Approved compensation by period">
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
        <p className="mt-4 text-sm text-slate">
          Approved {range.fromText} to {range.toText}:{" "}
          <span className="font-display text-lg text-cream">{formatMoney(sumCents(approved), currency)}</span> across {approved.length} record
          {approved.length === 1 ? "" : "s"}. Approved ≠ paid.
        </p>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Missing this week's call">
          {missing.length === 0 ? (
            <Empty>Every active coach has booked this week&apos;s call.</Empty>
          ) : (
            <List>
              {missing.map((coach) => (
                <Link
                  key={coach.id}
                  href={`/coach/leadership/coaches/${coach.id}`}
                  className="block py-2 text-sm text-cream hover:text-gold"
                >
                  {coach.user.profile?.displayName ?? "Coach"}
                </Link>
              ))}
            </List>
          )}
        </Panel>
        <Panel
          title="Recent activity"
          action={
            <Link
              href="/coach/leadership/settings#audit"
              className="text-xs text-gold"
            >
              Audit log
            </Link>
          }
        >
          {recent.length === 0 ? (
            <Empty>No administrative activity yet.</Empty>
          ) : (
            <ul className="space-y-2 text-sm text-slate">
              {recent.map((entry) => (
                <li key={entry.id}>
                  <span className="text-cream">{names.get(entry.actorId) ?? "Someone"}</span> {entry.action.replace(/_/g, " ").toLowerCase()} ·{" "}
                  {formatDateTime(entry.createdAt, tz)}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
