import { assignProject, createAdjustment, createProject, reviewSubmission, setPayrollStatus, setProjectStatus } from "@/app/actions/leadership";
import { ActionForm } from "@/components/coach/ActionForm";
import { Field, Hidden, Select, TextArea } from "@/components/coach/fields";
import { FilterPills } from "@/components/ui";
import { Empty, LinkList, List, PageTitle, Panel, Stat, StatusBadge } from "@/components/coach/ui";
import { coachName, getActiveCoaches, requireLeadership, userNames } from "@/lib/coach/access";
import { getCoachConfig } from "@/lib/coach/config";
import { PAYROLL_STATUSES, WORK_STATUSES } from "@/lib/coach/constants";
import { formatMoney, periodKey, SUBMISSION_LEADERSHIP_TRANSITIONS } from "@/lib/coach/rules";
import { labelFor } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Payroll Management" };

export default async function LeadershipPayrollPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await props.searchParams;
  const ctx = await requireLeadership();
  const tz = ctx.timezone;
  const status = typeof sp.status === "string" ? sp.status : "PENDING";
  const [config, coaches, projects, submissions, records] = await Promise.all([
    getCoachConfig(),
    getActiveCoaches(),
    prisma.project.findMany({
      include: { assignments: { include: { coach: { include: { user: { include: { profile: true } } } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.projectSubmission.findMany({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "REVISION"] } },
      include: { assignment: { include: { project: true } }, coach: { include: { user: { include: { profile: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.payrollRecord.findMany({
      where: status ? { status } : {},
      include: { coach: { include: { user: { include: { profile: true } } } }, assignment: { include: { project: true } } },
      orderBy: { approvedAt: "desc" },
      take: 200,
    }),
  ]);
  const totals = await prisma.payrollRecord.groupBy({ by: ["status"], _sum: { amountCents: true } });
  const total = (s: string) => totals.find((t) => t.status === s)?._sum.amountCents ?? 0;
  const names = await userNames(records.flatMap((r) => [r.approvedById, r.paidById]));
  const currency = config.currency || "USD";
  const coachOptions = coaches.map((c) => ({ value: c.id, label: coachName(c) }));

  return (
    <>
      <PageTitle
        title="Payroll Management"
        description={`${config.compensationType} · ${config.compensationRange} · paid ${config.paymentFrequency.toLowerCase()}. This tracks approvals and payments; it doesn't send money.`}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Approved, awaiting payment"
          value={formatMoney(total("PENDING"), currency)}
        />
        <Stat
          label="Marked as paid"
          value={formatMoney(total("PAID"), currency)}
        />
        <Stat
          label="Work awaiting review"
          value={submissions.filter((s) => s.status !== "REVISION").length}
        />
      </div>

      <Panel title="Work submissions">
        {submissions.length === 0 ? (
          <Empty>No project work waiting for review.</Empty>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="rounded-lg border border-line p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-cream">
                    {submission.assignment.project.title} · {coachName(submission.coach)}
                  </p>
                  <StatusBadge
                    status={submission.status}
                    options={WORK_STATUSES}
                  />
                </div>
                <p className="mt-1 text-xs text-slate">
                  Agreed {formatMoney(submission.assignment.amountCents, submission.assignment.currency)} · Completed{" "}
                  {formatDate(submission.completedAt, "UTC")} · Submitted {formatDate(submission.updatedAt, tz)}
                </p>
                <p className="mt-2 text-sm whitespace-pre-line text-slate">{submission.description}</p>
                <div className="mt-2 text-sm">
                  <LinkList text={submission.links} />
                </div>
                {submission.notes && <p className="mt-2 text-sm text-slate">Notes: {submission.notes}</p>}
                {submission.status !== "REVISION" && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-gold">Review</summary>
                    <div className="mt-3">
                      <ActionForm
                        action={reviewSubmission}
                        confirm="Save this decision? Approving creates a pending payroll record."
                      >
                        <Hidden
                          name="id"
                          value={submission.id}
                        />
                        <div className="grid gap-4 sm:grid-cols-3">
                          <Select
                            label="Decision"
                            name="status"
                            options={(SUBMISSION_LEADERSHIP_TRANSITIONS[submission.status] ?? []).map((value) => ({
                              value,
                              label: labelFor(WORK_STATUSES, value),
                            }))}
                          />
                          <Field
                            label="Confirmed amount (if approving)"
                            name="amount"
                            defaultValue={(submission.assignment.amountCents / 100).toFixed(2)}
                          />
                          <Field
                            label="Payment period"
                            name="period"
                            type="month"
                            defaultValue={periodKey(new Date())}
                          />
                        </div>
                        <TextArea
                          label="Feedback"
                          name="feedback"
                          rows={2}
                          hint="Required for revisions, rejections, or an amount different from the agreed fee."
                        />
                      </ActionForm>
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Payroll records">
        <div className="mb-4">
          <FilterPills
            label="Status"
            param="status"
            options={PAYROLL_STATUSES}
            current={status}
            basePath="/coach/leadership/payroll"
            searchParams={{ status: status || undefined }}
          />
        </div>
        {records.length === 0 ? (
          <Empty>No records.</Empty>
        ) : (
          <List>
            {records.map((record) => (
              <div
                key={record.id}
                className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <p className="text-sm text-cream">
                    {coachName(record.coach)} · {formatMoney(record.amountCents, record.currency)} ·{" "}
                    {record.assignment?.project.title ?? (record.isAdjustment ? "Adjustment" : "Payment")}
                  </p>
                  <p className="text-xs text-slate">
                    Period {record.period} · Approved {formatDate(record.approvedAt, tz)} by {names.get(record.approvedById) ?? "—"}
                    {record.paidAt && ` · Paid ${formatDate(record.paidAt, tz)} by ${names.get(record.paidById ?? "") ?? "—"}`}
                    {record.adminNotes && ` · ${record.adminNotes}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge
                    status={record.status}
                    options={PAYROLL_STATUSES}
                  />
                  {record.status === "PENDING" && (
                    <ActionForm
                      action={setPayrollStatus}
                      className="flex flex-wrap items-center gap-2"
                      intents={[
                        {
                          value: "PAID",
                          label: "Mark paid",
                          confirm: `Confirm ${formatMoney(record.amountCents, record.currency)} has actually been paid to ${coachName(record.coach)}?`,
                        },
                        { value: "VOID", label: "Void", variant: "danger", confirm: "Void this record? Add a note first." },
                      ]}
                    >
                      <Hidden
                        name="id"
                        value={record.id}
                      />
                      <input
                        name="note"
                        placeholder="Note (required to void)"
                        className="field-input max-w-[14rem] !min-h-9 !py-1.5 text-sm"
                        aria-label="Note"
                      />
                    </ActionForm>
                  )}
                </div>
              </div>
            ))}
          </List>
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="New project">
          <ActionForm
            action={createProject}
            submitLabel="Create project"
            resetOnSuccess
          >
            <Field
              label="Title"
              name="title"
              required
            />
            <Field
              label="Project type"
              name="projectType"
            />
            <TextArea
              label="Description"
              name="description"
              rows={3}
            />
          </ActionForm>
        </Panel>
        <Panel title="Assign a project">
          {projects.filter((p) => p.status === "OPEN").length === 0 || coachOptions.length === 0 ? (
            <Empty>Create a project and make sure at least one coach is active.</Empty>
          ) : (
            <ActionForm
              action={assignProject}
              submitLabel="Assign"
              resetOnSuccess
            >
              <Select
                label="Project"
                name="projectId"
                options={projects.filter((p) => p.status === "OPEN").map((p) => ({ value: p.id, label: p.title }))}
              />
              <Select
                label="Coach"
                name="coachId"
                options={coachOptions}
              />
              <Field
                label={`Agreed fee (${currency})`}
                name="amount"
                required
                hint={`Stated range: ${config.compensationRange}. Record the exact agreed amount.`}
              />
              <Field
                label="Terms or reference"
                name="terms"
              />
            </ActionForm>
          )}
        </Panel>
      </div>

      <Panel title="Projects">
        {projects.length === 0 ? (
          <Empty>No projects yet.</Empty>
        ) : (
          <List>
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm text-cream">
                    {project.title} <span className="text-xs text-slate">{project.projectType}</span>
                  </p>
                  <p className="text-xs text-slate">
                    {project.assignments.length === 0
                      ? "Not assigned"
                      : project.assignments.map((a) => `${coachName(a.coach)} (${formatMoney(a.amountCents, a.currency)})`).join(", ")}
                  </p>
                </div>
                <ActionForm
                  action={setProjectStatus}
                  className=""
                  intents={[project.status === "OPEN" ? { value: "CLOSED", label: "Close", variant: "outline" } : { value: "OPEN", label: "Reopen", variant: "outline" }]}
                >
                  <Hidden
                    name="id"
                    value={project.id}
                  />
                </ActionForm>
              </div>
            ))}
          </List>
        )}
      </Panel>

      <Panel title="Record an adjustment">
        <p className="mb-4 text-sm text-slate">For a legitimate correction not tied to a project submission. Requires a note and is logged.</p>
        {coachOptions.length === 0 ? (
          <Empty>No active coaches.</Empty>
        ) : (
          <ActionForm
            action={createAdjustment}
            submitLabel="Record adjustment"
            confirm="Record this payroll adjustment?"
            resetOnSuccess
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                label="Coach"
                name="coachId"
                options={coachOptions}
              />
              <Field
                label={`Amount (${currency})`}
                name="amount"
                required
              />
              <Field
                label="Period"
                name="period"
                type="month"
                defaultValue={periodKey(new Date())}
                required
              />
            </div>
            <Field
              label="Reason"
              name="note"
              required
            />
          </ActionForm>
        )}
      </Panel>
    </>
  );
}
