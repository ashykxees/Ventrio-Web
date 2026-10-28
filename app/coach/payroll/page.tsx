import { submitProjectWork } from "@/app/actions/coach";
import { ActionForm } from "@/components/coach/ActionForm";
import { Field, Hidden, TextArea } from "@/components/coach/fields";
import { Detail, Empty, List, PageTitle, Panel, Stat, StatusBadge } from "@/components/coach/ui";
import { requireCoach } from "@/lib/coach/access";
import { getCoachConfig, notConfigured } from "@/lib/coach/config";
import { PAYROLL_STATUSES, WORK_STATUSES } from "@/lib/coach/constants";
import { sumCents } from "@/lib/coach/queries";
import { formatMoney, periodKey } from "@/lib/coach/rules";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Payroll" };

export default async function CoachPayrollPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const ctx = await requireCoach();
  const tz = ctx.timezone;
  const from = typeof searchParams.from === "string" && /^\d{4}-\d{2}$/.test(searchParams.from) ? searchParams.from : "";
  const to = typeof searchParams.to === "string" && /^\d{4}-\d{2}$/.test(searchParams.to) ? searchParams.to : "";
  const [config, assignments, records] = await Promise.all([
    getCoachConfig(),
    prisma.projectAssignment.findMany({
      where: { coachId: ctx.coach.id },
      include: { project: true, submissions: { orderBy: { createdAt: "desc" } } },
      orderBy: { assignedAt: "desc" },
    }),
    // Coaches only ever load their own payroll records.
    prisma.payrollRecord.findMany({
      where: { coachId: ctx.coach.id },
      include: { assignment: { include: { project: true } } },
      orderBy: { approvedAt: "desc" },
    }),
  ]);
  const currency = config.currency || "USD";
  const live = records.filter((r) => r.status !== "VOID");
  const month = periodKey(new Date());
  const filtered = records.filter((r) => (!from || r.period >= from) && (!to || r.period <= to));
  const awaitingReview = assignments.filter((a) => ["SUBMITTED", "UNDER_REVIEW"].includes(a.submissions[0]?.status ?? ""));

  return (
    <>
      <PageTitle
        title="Payroll"
        description="Project-based earnings. Approved work and payments actually made are tracked separately."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="This month"
          value={formatMoney(sumCents(live.filter((r) => r.period === month)), currency)}
        />
        <Stat
          label="Total approved"
          value={formatMoney(sumCents(live), currency)}
        />
        <Stat
          label="Approved, awaiting payment"
          value={formatMoney(sumCents(live.filter((r) => r.status === "PENDING")), currency)}
        />
        <Stat
          label="Paid"
          value={formatMoney(sumCents(live.filter((r) => r.status === "PAID")), currency)}
          note={`${awaitingReview.length} project${awaitingReview.length === 1 ? "" : "s"} awaiting review`}
        />
      </div>

      <Panel title="Compensation terms">
        <dl className="grid gap-4 sm:grid-cols-3">
          <Detail label="Type">{config.compensationType}</Detail>
          <Detail label="Stated range">{config.compensationRange}</Detail>
          <Detail label="Frequency">{config.paymentFrequency}</Detail>
          <Detail label="Eligibility">{config.paymentEligibility}</Detail>
          <Detail label="Payment date">{notConfigured(config.paymentDate)}</Detail>
          <Detail label="Payment method">{notConfigured(config.paymentMethods)}</Detail>
        </dl>
        <p className="mt-4 text-xs text-slate">The exact fee for each project is agreed when it&apos;s assigned and shown below.</p>
      </Panel>

      <Panel title="Your projects">
        {assignments.length === 0 ? (
          <Empty>No projects assigned yet. Leadership will assign projects with an agreed fee.</Empty>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const latest = assignment.submissions[0];
              const canSubmit = !latest || ["REVISION", "REJECTED"].includes(latest.status);

              return (
                <div
                  key={assignment.id}
                  className="rounded-lg border border-line p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-cream">{assignment.project.title}</p>
                      <p className="text-xs text-slate">
                        Agreed fee {formatMoney(assignment.amountCents, assignment.currency)} · Assigned {formatDate(assignment.assignedAt, tz)}
                      </p>
                    </div>
                    {latest ? (
                      <StatusBadge
                        status={latest.status}
                        options={WORK_STATUSES}
                      />
                    ) : (
                      <span className="text-xs text-slate">Not submitted</span>
                    )}
                  </div>
                  {assignment.project.description && <p className="mt-2 text-sm whitespace-pre-line text-slate">{assignment.project.description}</p>}
                  {latest?.feedback && <p className="mt-2 text-sm text-gold">Feedback: {latest.feedback}</p>}
                  {canSubmit && assignment.project.status === "OPEN" && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-gold">
                        {latest?.status === "REVISION" ? "Resubmit work" : "Submit completed work"}
                      </summary>
                      <div className="mt-4">
                        <ActionForm
                          action={submitProjectWork}
                          submitLabel="Submit for review"
                        >
                          <Hidden
                            name="assignmentId"
                            value={assignment.id}
                          />
                          <TextArea
                            label="Description of work completed"
                            name="description"
                            required
                            defaultValue={latest?.status === "REVISION" ? latest.description : undefined}
                          />
                          <Field
                            label="Completion date"
                            name="completedAt"
                            type="date"
                            required
                          />
                          <TextArea
                            label="Files or links"
                            name="links"
                            rows={2}
                            hint="Full https:// links, one per line."
                            defaultValue={latest?.status === "REVISION" ? latest.links : undefined}
                          />
                          <TextArea
                            label="Notes"
                            name="notes"
                            rows={2}
                          />
                        </ActionForm>
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Payment history">
        <form className="mb-4 flex flex-wrap items-end gap-3">
          <Field
            label="From (month)"
            name="from"
            type="month"
            defaultValue={from}
          />
          <Field
            label="To (month)"
            name="to"
            type="month"
            defaultValue={to}
          />
          <button
            type="submit"
            className="btn btn-outline btn-sm"
          >
            Filter
          </button>
        </form>
        {filtered.length === 0 ? (
          <Empty>No payroll records{from || to ? " in this range" : " yet"}.</Empty>
        ) : (
          <List>
            {filtered.map((record) => (
              <div
                key={record.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm text-cream">
                    {record.assignment?.project.title ?? (record.isAdjustment ? "Adjustment" : "Payment")} ·{" "}
                    {formatMoney(record.amountCents, record.currency)}
                  </p>
                  <p className="text-xs text-slate">
                    Period {record.period} · Approved {formatDate(record.approvedAt, tz)}
                    {record.paidAt && ` · Paid ${formatDate(record.paidAt, tz)}`}
                    {record.adminNotes && ` · ${record.adminNotes}`}
                  </p>
                </div>
                <StatusBadge
                  status={record.status}
                  options={PAYROLL_STATUSES}
                />
              </div>
            ))}
          </List>
        )}
      </Panel>
    </>
  );
}
