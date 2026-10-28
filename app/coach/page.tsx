import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus, FileText, Send, Wallet } from "lucide-react";
import { Notice } from "@/components/ui";
import { Empty, List, PageTitle, Panel, Row, Stat, StatusBadge } from "@/components/coach/ui";
import { requireCoachContext } from "@/lib/coach/access";
import { getCoachConfig } from "@/lib/coach/config";
import { REQUEST_STATUSES, SESSION_STATUSES, TASK_STATUSES } from "@/lib/coach/constants";
import { getPolicyStatus, getVisibleAnnouncements, sumCents } from "@/lib/coach/queries";
import { formatMoney, isoWeekKey, periodKey } from "@/lib/coach/rules";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function CoachOverviewPage() {
  const ctx = await requireCoachContext();

  if (!ctx.canCoach || !ctx.coach) {
    redirect("/coach/leadership");
  }

  const coach = ctx.coach;
  const tz = ctx.timezone;
  const now = new Date();
  const weekKey = isoWeekKey(now, tz);
  const soon = new Date(now.getTime() + 7 * 86400000);
  const [config, upcoming, weekly, requests, payroll, awaitingWork, tasks, resources, review, announcements, policies] =
    await Promise.all([
      getCoachConfig(),
      prisma.coachSession.findMany({
        where: { coachId: coach.id, startAt: { gte: now }, status: { not: "CANCELLED" } },
        orderBy: { startAt: "asc" },
        take: 5,
      }),
      prisma.coachSession.findFirst({ where: { coachId: coach.id, weekKey } }),
      prisma.coachRequest.findMany({
        where: { coachId: coach.id, status: { in: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "MORE_INFO"] } },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.payrollRecord.findMany({ where: { coachId: coach.id, status: { not: "VOID" } } }),
      prisma.projectSubmission.count({ where: { coachId: coach.id, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
      prisma.taskAssignment.findMany({
        where: { coachId: coach.id, status: { in: ["NOT_STARTED", "IN_PROGRESS", "REVISION"] } },
        include: { task: true },
      }),
      prisma.coachResource.count({ where: { authorId: ctx.userId, status: { in: ["SUBMITTED", "REVISION"] } } }),
      prisma.performanceReview.findFirst({ where: { coachId: coach.id, status: "FINAL" }, orderBy: { finalizedAt: "desc" } }),
      getVisibleAnnouncements(ctx),
      getPolicyStatus(ctx.userId),
    ]);

  const month = periodKey(now);
  const monthEarnings = sumCents(payroll.filter((record) => record.period === month));
  const outstanding = sumCents(payroll.filter((record) => record.status === "PENDING"));
  const overdue = tasks.filter((a) => a.task.dueAt && a.task.dueAt < now);
  const dueSoon = tasks.filter((a) => a.task.dueAt && a.task.dueAt >= now && a.task.dueAt <= soon);
  const unreadAnnouncements = announcements.filter((a) => a.reads.length === 0).length;
  const policiesToAck = policies.filter((p) => p.needsAck).length;
  const currency = config.currency || "USD";

  return (
    <>
      <PageTitle
        title={`Welcome, ${ctx.profile.displayName}`}
        description={`${coach.coachRole || "Coach"} · Account ${coach.status === "ACTIVE" ? "active" : "inactive"}`}
      />

      {weekly ? (
        <Notice tone="success">
          Your weekly coaching call is scheduled: <strong>{weekly.title}</strong>, {formatDateTime(weekly.startAt, tz)}.
        </Notice>
      ) : (
        <Notice
          tone="warning"
          title="Your weekly coaching call isn't scheduled yet"
        >
          {config.schedulingDeadline ? `${config.schedulingDeadline}. ` : ""}
          <Link
            href="/coach/sessions"
            className="text-gold underline"
          >
            Schedule this week&apos;s call
          </Link>
        </Notice>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { href: "/coach/sessions", label: "Schedule a session", icon: CalendarPlus },
          { href: "/coach/requests", label: "Submit a request", icon: Send },
          { href: "/coach/payroll", label: "Submit project work", icon: FileText },
          { href: "/coach/payroll", label: "View payroll", icon: Wallet },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="card card-hover flex items-center gap-3 p-4 text-sm text-cream"
          >
            <action.icon className="h-4 w-4 text-gold" />
            {action.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Earnings this month"
          value={formatMoney(monthEarnings, currency)}
          href="/coach/payroll"
        />
        <Stat
          label="Outstanding payments"
          value={formatMoney(outstanding, currency)}
          note={`${awaitingWork} project${awaitingWork === 1 ? "" : "s"} awaiting review`}
          href="/coach/payroll"
        />
        <Stat
          label="Tasks"
          value={`${overdue.length} overdue`}
          note={`${dueSoon.length} due in the next 7 days`}
          href="/coach/tasks"
        />
        <Stat
          label="To read"
          value={unreadAnnouncements + policiesToAck}
          note={`${unreadAnnouncements} announcements · ${policiesToAck} policies to acknowledge`}
          href={policiesToAck ? "/coach/policies" : "/coach/announcements"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Upcoming sessions"
          action={
            <Link
              href="/coach/sessions"
              className="text-xs text-gold"
            >
              All sessions
            </Link>
          }
        >
          {upcoming.length === 0 ? (
            <Empty>No upcoming sessions. Schedule your weekly call to get started.</Empty>
          ) : (
            <List>
              {upcoming.map((session) => (
                <Row
                  key={session.id}
                  href={`/coach/sessions/${session.id}`}
                >
                  <div>
                    <p className="text-sm text-cream">{session.title}</p>
                    <p className="text-xs text-slate">{formatDateTime(session.startAt, tz)}</p>
                  </div>
                  <StatusBadge
                    status={session.status}
                    options={SESSION_STATUSES}
                  />
                </Row>
              ))}
            </List>
          )}
        </Panel>

        <Panel title="Open requests">
          {requests.length === 0 ? (
            <Empty>No open requests.</Empty>
          ) : (
            <List>
              {requests.map((request) => (
                <Row
                  key={request.id}
                  href={`/coach/requests/${request.id}`}
                >
                  <p className="text-sm text-cream">{request.title}</p>
                  <StatusBadge
                    status={request.status}
                    options={REQUEST_STATUSES}
                  />
                </Row>
              ))}
            </List>
          )}
        </Panel>

        <Panel title="Tasks due soon">
          {overdue.length + dueSoon.length === 0 ? (
            <Empty>Nothing due in the next 7 days.</Empty>
          ) : (
            <List>
              {[...overdue, ...dueSoon].map((assignment) => (
                <Row
                  key={assignment.id}
                  href={`/coach/tasks/${assignment.id}`}
                >
                  <div>
                    <p className="text-sm text-cream">{assignment.task.title}</p>
                    <p className={`text-xs ${assignment.task.dueAt! < now ? "text-red-300" : "text-slate"}`}>
                      {assignment.task.dueAt! < now ? "Overdue · " : "Due "}
                      {formatDateTime(assignment.task.dueAt!, tz)}
                    </p>
                  </div>
                  <StatusBadge
                    status={assignment.status}
                    options={TASK_STATUSES}
                  />
                </Row>
              ))}
            </List>
          )}
        </Panel>

        <Panel title="Reviews & resources">
          <List>
            <Row href="/coach/resources">
              <p className="text-sm text-cream">Lessons or resources in review</p>
              <span className="text-sm text-gold">{resources}</span>
            </Row>
            <Row href="/coach/performance">
              <p className="text-sm text-cream">Latest performance review</p>
              <span className="text-sm text-slate">
                {review ? `${review.acknowledgedAt ? "Read" : "New"} · ${review.periodEnd.toISOString().slice(0, 10)}` : "None yet"}
              </span>
            </Row>
          </List>
        </Panel>
      </div>
    </>
  );
}
