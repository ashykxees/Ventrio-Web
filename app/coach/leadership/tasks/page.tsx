import { createTask } from "@/app/actions/leadership";
import { ActionForm } from "@/components/coach/ActionForm";
import { Checkbox, Field, Select, TextArea } from "@/components/coach/fields";
import { Empty, List, PageTitle, Panel, Row, StatusBadge } from "@/components/coach/ui";
import { coachName, getActiveCoaches, requireLeadership } from "@/lib/coach/access";
import { TASK_PRIORITIES } from "@/lib/coach/constants";
import { TIMEZONES } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Task Management" };

export default async function LeadershipTasksPage() {
  const ctx = await requireLeadership();
  const now = new Date();
  const [coaches, tasks] = await Promise.all([
    getActiveCoaches(),
    prisma.coachTask.findMany({ include: { assignments: true }, orderBy: { createdAt: "desc" }, take: 200 }),
  ]);

  return (
    <>
      <PageTitle
        title="Task Management"
        description="Assign work with deadlines, then review what coaches submit."
      />
      <Panel title="New task">
        {coaches.length === 0 ? (
          <Empty>No active coaches to assign tasks to yet.</Empty>
        ) : (
          <ActionForm
            action={createTask}
            submitLabel="Create & assign"
            resetOnSuccess
          >
            <Field
              label="Title"
              name="title"
              required
              maxLength={150}
            />
            <TextArea
              label="Description"
              name="description"
              rows={4}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                label="Priority"
                name="priority"
                options={TASK_PRIORITIES}
                defaultValue="NORMAL"
              />
              <Field
                label="Due"
                name="due"
                type="datetime-local"
              />
              <Select
                label="Time zone"
                name="timezone"
                options={TIMEZONES}
                defaultValue={ctx.timezone}
              />
            </div>
            <TextArea
              label="Reference links"
              name="links"
              rows={2}
              hint="Full https:// links, one per line."
            />
            <TextArea
              label="Checklist (one item per line)"
              name="checklist"
              rows={3}
            />
            <fieldset className="space-y-2">
              <legend className="field-label">Assign to</legend>
              <Checkbox
                name="allCoaches"
                label="All active coaches"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {coaches.map((coach) => (
                  <Checkbox
                    key={coach.id}
                    name="coachIds"
                    value={coach.id}
                    label={coachName(coach)}
                  />
                ))}
              </div>
            </fieldset>
          </ActionForm>
        )}
      </Panel>
      <Panel title="Tasks">
        {tasks.length === 0 ? (
          <Empty>No tasks yet.</Empty>
        ) : (
          <List>
            {tasks.map((task) => {
              const done = task.assignments.filter((a) => a.status === "COMPLETED").length;
              const toReview = task.assignments.filter((a) => a.status === "SUBMITTED").length;
              const overdue = task.dueAt && task.dueAt < now && done < task.assignments.length && task.status === "OPEN";

              return (
                <Row
                  key={task.id}
                  href={`/coach/leadership/tasks/${task.id}`}
                >
                  <div>
                    <p className="text-sm text-cream">{task.title}</p>
                    <p className={`text-xs ${overdue ? "text-red-300" : "text-slate"}`}>
                      {done}/{task.assignments.length} completed · {toReview} to review ·{" "}
                      {task.dueAt ? `${overdue ? "Overdue · " : "Due "}${formatDateTime(task.dueAt, ctx.timezone)}` : "No deadline"}
                    </p>
                  </div>
                  <StatusBadge
                    status={task.status}
                    options={[
                      { value: "OPEN", label: "Open" },
                      { value: "CANCELLED", label: "Cancelled" },
                    ]}
                  />
                </Row>
              );
            })}
          </List>
        )}
      </Panel>
    </>
  );
}
