import Link from "next/link";
import { notFound } from "next/navigation";
import { recheckCoachRoles, setCoachStatus, updateCoach } from "@/app/actions/leadership";
import { ActionForm } from "@/components/coach/ActionForm";
import { CallFeedbackPanel } from "@/components/coach/CallFeedback";
import { Field, Hidden, Select, TextArea } from "@/components/coach/fields";
import { Detail, List, PageTitle, Panel, Row, StatusBadge } from "@/components/coach/ui";
import { coachName, getCoachRoleIds, requireLeadership } from "@/lib/coach/access";
import { getCoachConfig } from "@/lib/coach/config";
import { REQUEST_STATUSES, SESSION_STATUSES, TASK_STATUSES } from "@/lib/coach/constants";
import { hasAnyRole, splitIds } from "@/lib/coach/rules";
import { formatDate, formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function LeadershipCoachPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const ctx = await requireLeadership();
  const tz = ctx.timezone;
  const [config, coach] = await Promise.all([
    getCoachConfig(),
    prisma.coachProfile.findUnique({
      where: { id },
      include: {
        user: { include: { profile: true } },
        sessions: { orderBy: { startAt: "desc" }, take: 10 },
        requests: { orderBy: { createdAt: "desc" }, take: 10 },
        tasks: { include: { task: true }, orderBy: { assignedAt: "desc" }, take: 10 },
        reviews: { orderBy: { periodEnd: "desc" } },
        assignments: { include: { project: true } },
      },
    }),
  ]);

  if (!coach) {
    notFound();
  }

  const [acks, policyCount] = await Promise.all([
    prisma.policyAck.count({ where: { userId: coach.userId } }),
    prisma.policy.count({ where: { status: "PUBLISHED", requiresAck: true } }),
  ]);
  const hasRole = hasAnyRole(splitIds(coach.discordRoles), getCoachRoleIds());
  const roleOptions = Array.from(new Set([...config.coachRoles, ...(coach.coachRole ? [coach.coachRole] : [])]));

  return (
    <>
      <PageTitle
        title={coachName(coach)}
        description={`@${coach.user.profile?.discordUsername} · Discord ID ${coach.discordId}`}
      >
        <StatusBadge
          status={coach.status}
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "DEACTIVATED", label: "Deactivated" },
          ]}
        />
      </PageTitle>
      <Link
        href="/coach/leadership/coaches"
        className="text-sm text-gold"
      >
        ← All coaches
      </Link>
      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Panel title="Profile & assignment">
          <ActionForm action={updateCoach}>
            <Hidden
              name="id"
              value={coach.id}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Coach role"
                name="coachRole"
                options={roleOptions}
                placeholder="Not assigned"
                defaultValue={coach.coachRole}
              />
              <Field
                label="Start date"
                name="startDate"
                type="date"
                defaultValue={coach.startDate?.toISOString().slice(0, 10)}
              />
            </div>
            <Field
              label="Expertise"
              name="expertise"
              defaultValue={coach.expertise}
            />
            <TextArea
              label="Responsibilities"
              name="responsibilities"
              rows={3}
              defaultValue={coach.responsibilities}
            />
            <TextArea
              label="Private leadership notes"
              name="leadershipNotes"
              rows={4}
              defaultValue={coach.leadershipNotes}
              hint="Never shown to the coach."
            />
          </ActionForm>
        </Panel>
        <div className="space-y-6">
          <Panel title="Access">
            <dl className="space-y-3">
              <Detail label="Discord coach role">{hasRole ? "Yes" : "No — they can't open the dashboard"}</Detail>
              <Detail label="Last checked">{coach.rolesCheckedAt ? formatDateTime(coach.rolesCheckedAt, tz) : "Never"}</Detail>
              <Detail label="Policy acknowledgments">{`${acks} recorded · ${policyCount} policies require one`}</Detail>
              <Detail label="Bio">{coach.bio}</Detail>
              <Detail label="Availability">{coach.availability}</Detail>
            </dl>
            <div className="mt-4 space-y-3">
              <ActionForm
                action={recheckCoachRoles}
                submitLabel="Re-check Discord roles"
                variant="outline"
              >
                <Hidden
                  name="id"
                  value={coach.id}
                />
              </ActionForm>
              <ActionForm
                action={setCoachStatus}
                intents={[
                  coach.status === "ACTIVE"
                    ? { value: "DEACTIVATED", label: "Deactivate coach", variant: "danger", confirm: "Deactivate this coach? They lose dashboard access; their records are kept." }
                    : { value: "ACTIVE", label: "Reactivate coach", confirm: "Reactivate this coach?" },
                ]}
              >
                <Hidden
                  name="id"
                  value={coach.id}
                />
              </ActionForm>
            </div>
          </Panel>
        </div>
      </div>
      <CallFeedbackPanel
        coachId={coach.id}
        timezone={tz}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Recent sessions">
          <List>
            {coach.sessions.map((s) => (
              <Row key={s.id}>
                <span className="text-sm text-cream">
                  {s.title} <span className="text-xs text-slate">{formatDateTime(s.startAt, tz)}</span>
                </span>
                <StatusBadge
                  status={s.status}
                  options={SESSION_STATUSES}
                />
              </Row>
            ))}
          </List>
          {coach.sessions.length === 0 && <p className="text-sm text-slate">None yet.</p>}
        </Panel>
        <Panel title="Recent requests">
          <List>
            {coach.requests.map((r) => (
              <Row
                key={r.id}
                href={`/coach/leadership/requests/${r.id}`}
              >
                <span className="text-sm text-cream">{r.title}</span>
                <StatusBadge
                  status={r.status}
                  options={REQUEST_STATUSES}
                />
              </Row>
            ))}
          </List>
          {coach.requests.length === 0 && <p className="text-sm text-slate">None yet.</p>}
        </Panel>
        <Panel title="Tasks">
          <List>
            {coach.tasks.map((a) => (
              <Row
                key={a.id}
                href={`/coach/leadership/tasks/${a.taskId}`}
              >
                <span className="text-sm text-cream">{a.task.title}</span>
                <StatusBadge
                  status={a.status}
                  options={TASK_STATUSES}
                />
              </Row>
            ))}
          </List>
          {coach.tasks.length === 0 && <p className="text-sm text-slate">None yet.</p>}
        </Panel>
        <Panel title="Projects & reviews">
          <ul className="space-y-2 text-sm text-slate">
            {coach.assignments.map((a) => (
              <li key={a.id}>Project: {a.project.title}</li>
            ))}
            {coach.reviews.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/coach/leadership/reviews/${r.id}`}
                  className="text-gold"
                >
                  Review {formatDate(r.periodStart, "UTC")} – {formatDate(r.periodEnd, "UTC")} ({r.status === "FINAL" ? "final" : "draft"})
                </Link>
              </li>
            ))}
            {coach.assignments.length + coach.reviews.length === 0 && <li>None yet.</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
