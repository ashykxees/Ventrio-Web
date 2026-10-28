import { FilterPills } from "@/components/ui";
import { Empty, List, PageTitle, Panel, Row, StatusBadge } from "@/components/coach/ui";
import { requireCoach } from "@/lib/coach/access";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/coach/constants";
import { labelFor } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Tasks" };

const PRIORITY_ORDER = ["URGENT", "HIGH", "NORMAL", "LOW"];

export default async function CoachTasksPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const ctx = await requireCoach();
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "";
  const now = new Date();
  const assignments = await prisma.taskAssignment.findMany({
    where: { coachId: ctx.coach.id },
    include: { task: true },
  });

  assignments.sort((a, b) => {
    if (sort === "priority") {
      return PRIORITY_ORDER.indexOf(a.task.priority) - PRIORITY_ORDER.indexOf(b.task.priority);
    }

    if (sort === "status") {
      return a.status.localeCompare(b.status);
    }

    return (a.task.dueAt?.getTime() ?? Infinity) - (b.task.dueAt?.getTime() ?? Infinity);
  });

  const open = assignments.filter((a) => !["COMPLETED", "CANCELLED"].includes(a.status));
  const done = assignments.filter((a) => ["COMPLETED", "CANCELLED"].includes(a.status));

  const renderList = (items: typeof assignments) => (
    <List>
      {items.map((assignment) => {
        const overdue = assignment.task.dueAt && assignment.task.dueAt < now && !["COMPLETED", "CANCELLED"].includes(assignment.status);

        return (
          <Row
            key={assignment.id}
            href={`/coach/tasks/${assignment.id}`}
          >
            <div>
              <p className="text-sm text-cream">{assignment.task.title}</p>
              <p className={`text-xs ${overdue ? "text-red-300" : "text-slate"}`}>
                {labelFor(TASK_PRIORITIES, assignment.task.priority)} priority ·{" "}
                {assignment.task.dueAt ? `${overdue ? "Overdue · " : "Due "}${formatDateTime(assignment.task.dueAt, ctx.timezone)}` : "No deadline"}
              </p>
            </div>
            <StatusBadge
              status={assignment.status}
              options={TASK_STATUSES}
            />
          </Row>
        );
      })}
    </List>
  );

  return (
    <>
      <PageTitle
        title="Tasks"
        description="Assignments and deadlines from leadership."
      />
      <FilterPills
        label="Sort by"
        param="sort"
        allLabel="Deadline"
        options={[
          { value: "priority", label: "Priority" },
          { value: "status", label: "Status" },
        ]}
        current={sort}
        basePath="/coach/tasks"
        searchParams={{ sort: sort || undefined }}
      />
      <Panel title="Open">{open.length === 0 ? <Empty>No open tasks.</Empty> : renderList(open)}</Panel>
      <Panel title="Completed & cancelled">{done.length === 0 ? <Empty>Nothing yet.</Empty> : renderList(done)}</Panel>
    </>
  );
}
