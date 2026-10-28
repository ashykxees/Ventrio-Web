import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelTask, reviewTaskAssignment } from "@/app/actions/leadership";
import { ActionForm } from "@/components/coach/ActionForm";
import { Hidden, Select, TextArea } from "@/components/coach/fields";
import { TextBlock } from "@/components/ui";
import { LinkList, PageTitle, Panel, StatusBadge } from "@/components/coach/ui";
import { coachName, requireLeadership, userNames } from "@/lib/coach/access";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/coach/constants";
import { TASK_LEADERSHIP_TRANSITIONS } from "@/lib/coach/rules";
import { labelFor } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function LeadershipTaskPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const ctx = await requireLeadership();
  const task = await prisma.coachTask.findUnique({
    where: { id },
    include: {
      assignments: { include: { coach: { include: { user: { include: { profile: true } } } } } },
      comments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!task) {
    notFound();
  }

  const names = await userNames(task.comments.map((c) => c.authorId));

  return (
    <>
      <PageTitle
        title={task.title}
        description={`${labelFor(TASK_PRIORITIES, task.priority)} priority · ${task.dueAt ? `Due ${formatDateTime(task.dueAt, ctx.timezone)}` : "No deadline"}`}
      >
        {task.status === "OPEN" && (
          <ActionForm
            action={cancelTask}
            className=""
            intents={[{ value: "cancel", label: "Cancel task", variant: "danger", confirm: "Cancel this task for everyone who hasn't completed it?" }]}
          >
            <Hidden
              name="id"
              value={task.id}
            />
          </ActionForm>
        )}
      </PageTitle>
      <Link
        href="/coach/leadership/tasks"
        className="text-sm text-gold"
      >
        ← All tasks
      </Link>
      <Panel>
        {task.description ? <TextBlock text={task.description} /> : <p className="text-sm text-slate">No description.</p>}
        <div className="mt-4 text-sm">
          <LinkList text={task.links} />
        </div>
        {task.checklist && <p className="mt-4 text-sm whitespace-pre-line text-slate">{task.checklist}</p>}
      </Panel>
      {task.assignments.map((assignment) => {
        const next = TASK_LEADERSHIP_TRANSITIONS[assignment.status] ?? [];
        const thread = task.comments.filter((c) => c.coachId === assignment.coachId);

        return (
          <Panel
            key={assignment.id}
            title={coachName(assignment.coach)}
            action={
              <StatusBadge
                status={assignment.status}
                options={TASK_STATUSES}
              />
            }
          >
            {assignment.submission && <p className="text-sm whitespace-pre-line text-cream">Submission: {assignment.submission}</p>}
            {thread.length > 0 && (
              <ul className="mt-3 space-y-2 text-sm">
                {thread.map((comment) => (
                  <li key={comment.id}>
                    <span className="text-xs text-slate">
                      {names.get(comment.authorId) ?? "—"} · {formatDateTime(comment.createdAt, ctx.timezone)}
                    </span>
                    <p className="whitespace-pre-line text-slate">{comment.comment}</p>
                  </li>
                ))}
              </ul>
            )}
            {task.status === "OPEN" && next.length > 0 && (
              <div className="mt-4">
                <ActionForm action={reviewTaskAssignment}>
                  <Hidden
                    name="id"
                    value={assignment.id}
                  />
                  <Select
                    label="Status"
                    name="status"
                    options={[assignment.status, ...next].map((value) => ({ value, label: labelFor(TASK_STATUSES, value) }))}
                    defaultValue={assignment.status}
                  />
                  <TextArea
                    label="Comment to the coach"
                    name="comment"
                    rows={2}
                  />
                </ActionForm>
              </div>
            )}
          </Panel>
        );
      })}
    </>
  );
}
