import { Notice } from "@/components/ui";
import { SessionForm } from "@/components/coach/SessionForm";
import { Empty, List, PageTitle, Panel, Row, StatusBadge } from "@/components/coach/ui";
import { requireCoach } from "@/lib/coach/access";
import { getCoachConfig, notConfigured } from "@/lib/coach/config";
import { SESSION_STATUSES } from "@/lib/coach/constants";
import { isoWeekKey, weekStartUtc } from "@/lib/coach/rules";
import { formatDate, formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Sessions" };

export default async function CoachSessionsPage() {
  const ctx = await requireCoach();
  const tz = ctx.timezone;
  const now = new Date();
  const weekKey = isoWeekKey(now, tz);
  const [config, sessions] = await Promise.all([
    getCoachConfig(),
    prisma.coachSession.findMany({ where: { coachId: ctx.coach.id }, orderBy: { startAt: "desc" } }),
  ]);
  const weekly = sessions.find((session) => session.weekKey === weekKey);
  const upcoming = sessions.filter((s) => s.startAt >= now && s.status !== "CANCELLED").reverse();
  const history = sessions.filter((s) => s.startAt < now || s.status === "CANCELLED");

  return (
    <>
      <PageTitle
        title="Sessions"
        description="Every active coach schedules one weekly coaching call. Extra sessions are welcome and don't count twice."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs tracking-wide text-slate uppercase">This week</p>
          <p className="mt-2 text-sm text-cream">Week of {formatDate(weekStartUtc(weekKey), "UTC")}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs tracking-wide text-slate uppercase">Weekly call</p>
          <p className={`mt-2 text-sm ${weekly ? "text-emerald-300" : "text-gold"}`}>
            {weekly ? `Scheduled · ${formatDateTime(weekly.startAt, tz)}` : "Not scheduled yet"}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs tracking-wide text-slate uppercase">Scheduling deadline</p>
          <p className="mt-2 text-sm text-cream">{notConfigured(config.schedulingDeadline)}</p>
        </div>
      </div>
      {!weekly && <Notice tone="warning">You haven&apos;t scheduled your weekly coaching call for this week.</Notice>}
      {config.cancellationRules && <Notice title="Cancellation and rescheduling">{config.cancellationRules}</Notice>}

      <Panel title="Schedule a session">
        <SessionForm
          config={config}
          timezone={tz}
          hasWeeklyCall={Boolean(weekly)}
        />
      </Panel>

      <Panel title="Upcoming">
        {upcoming.length === 0 ? (
          <Empty>No upcoming sessions.</Empty>
        ) : (
          <SessionList
            sessions={upcoming}
            tz={tz}
          />
        )}
      </Panel>
      <Panel title="History">
        {history.length === 0 ? (
          <Empty>Past and cancelled sessions will appear here.</Empty>
        ) : (
          <SessionList
            sessions={history}
            tz={tz}
          />
        )}
      </Panel>
    </>
  );
}

function SessionList({
  sessions,
  tz,
}: {
  sessions: { id: string; title: string; startAt: Date; status: string; weekKey: string | null; sessionType: string }[];
  tz: string;
}) {
  return (
    <List>
      {sessions.map((session) => (
        <Row
          key={session.id}
          href={`/coach/sessions/${session.id}`}
        >
          <div>
            <p className="text-sm text-cream">
              {session.title}
              {session.weekKey && <span className="ml-2 text-xs text-gold">Weekly call</span>}
            </p>
            <p className="text-xs text-slate">
              {session.sessionType} · {formatDateTime(session.startAt, tz)}
            </p>
          </div>
          <StatusBadge
            status={session.status}
            options={SESSION_STATUSES}
          />
        </Row>
      ))}
    </List>
  );
}
