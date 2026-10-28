import Link from "next/link";
import { notFound } from "next/navigation";
import { updateMyTask } from "@/app/actions/coach";
import { ActionForm } from "@/components/coach/ActionForm";
import { Hidden, Select, TextArea } from "@/components/coach/fields";
import { TextBlock } from "@/components/ui";
import { Detail, LinkList, PageTitle, Panel, StatusBadge } from "@/components/coach/ui";
import { requireCoach, userNames } from "@/lib/coach/access";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/coach/constants";
import { TASK_COACH_TRANSITIONS } from "@/lib/coach/rules";
import { labelFor } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function CoachTaskPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const ctx = await requireCoach();
  const assignment = await prisma.taskAssignment.findFirst({
    where: { id, coachId: ctx.coach.id },
    include: { task: { include: { comments: { where: { coachId: ctx.coach.id }, orderBy: { createdAt: "asc" } } } } },
  });

  if (!assignment) {
    notFound();
  }

  const { task } = assignment;
  const names = await userNames([task.createdById, ...task.comments.map((c) => c.authorId)]);
  const nextStatuses = TASK_COACH_TRANSITIONS[assignment.status] ?? [];
  const checklist = task.checklist.split("\n").filter((line) => line.trim());

  return (
    <>
      <PageTitle
        title={task.title}
        description={`${labelFor(TASK_PRIORITIES, task.priority)} priority · ${task.dueAt ? `Due ${formatDateTime(task.dueAt, ctx.timezone)}` : "No deadline"} · From ${names.get(task.createdById) ?? "leadership"}`}
      >
        <StatusBadge
          status={assignment.status}
          options={TASK_STATUSES}
        />
      </PageTitle>
      <Link
        href="/coach/tasks"
        className="text-sm text-gold"
      >
        ← All tasks
      </Link>
      <Panel>
        {task.description ? <TextBlock text={task.description} /> : <p className="text-sm text-slate">No description.</p>}
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <Detail label="Reference links">
            <LinkList text={task.links} />
          </Detail>
          <Detail label="Your submission">{assignment.submission}</Detail>
        </dl>
        {checklist.length > 0 && (
          <ul className="mt-6 list-inside list-disc space-y-1 text-sm text-slate">
            {checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </Panel>

      {task.status !== "CANCELLED" && nextStatuses.length > 0 && (
        <Panel title="Update">
          <ActionForm action={updateMyTask}>
            <Hidden
              name="id"
              value={assignment.id}
            />
            <Select
              label="Status"
              name="status"
              options={[assignment.status, ...nextStatuses].map((value) => ({ value, label: labelFor(TASK_STATUSES, value) }))}
              defaultValue={assignment.status}
            />
            <TextArea
              label="Work submission (description or links)"
              name="submission"
              rows={3}
              defaultValue={assignment.submission}
            />
            <TextArea
              label="Comment or progress note"
              name="comment"
              rows={2}
              maxLength={2000}
            />
          </ActionForm>
        </Panel>
      )}

      <Panel title="Comments">
        {task.comments.length === 0 ? (
          <p className="text-sm text-slate">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {task.comments.map((comment) => (
              <li
                key={comment.id}
                className="text-sm"
              >
                <p className="text-xs text-slate">
                  {names.get(comment.authorId) ?? "Ventrio"} · {formatDateTime(comment.createdAt, ctx.timezone)}
                </p>
                <p className="mt-1 whitespace-pre-line text-cream">{comment.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
