import Link from "next/link";
import { notFound } from "next/navigation";
import { reviewRequest } from "@/app/actions/leadership";
import { ActionForm } from "@/components/coach/ActionForm";
import { Hidden, Select, TextArea } from "@/components/coach/fields";
import { Detail, LinkList, PageTitle, Panel, StatusBadge } from "@/components/coach/ui";
import { coachName, getLeadershipUserIds, requireLeadership, userNames } from "@/lib/coach/access";
import { REQUEST_STATUSES } from "@/lib/coach/constants";
import { REQUEST_LEADERSHIP_TRANSITIONS } from "@/lib/coach/rules";
import { labelFor } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function LeadershipRequestPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const ctx = await requireLeadership();
  const request = await prisma.coachRequest.findFirst({
    where: { id, status: { not: "DRAFT" } },
    include: { coach: { include: { user: { include: { profile: true } } } }, history: { orderBy: { createdAt: "asc" } } },
  });

  if (!request) {
    notFound();
  }

  const leaders = await getLeadershipUserIds();
  const names = await userNames([...leaders, ...request.history.map((h) => h.actorId)]);
  const next = REQUEST_LEADERSHIP_TRANSITIONS[request.status] ?? [];

  return (
    <>
      <PageTitle
        title={request.title}
        description={`${coachName(request.coach)} · ${request.category} · ${formatDateTime(request.createdAt, ctx.timezone)}`}
      >
        <StatusBadge
          status={request.status}
          options={REQUEST_STATUSES}
        />
      </PageTitle>
      <Link
        href="/coach/leadership/requests"
        className="text-sm text-gold"
      >
        ← Request queue
      </Link>
      <Panel title="Request">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Description">{request.description}</Detail>
          <Detail label="Requested date">{request.requestedDate?.toISOString().slice(0, 10)}</Detail>
          <Detail label="Attachments">
            <LinkList text={request.links} />
          </Detail>
          <Detail label="Reviewer">{request.reviewerId ? (names.get(request.reviewerId) ?? "—") : "Unassigned"}</Detail>
        </dl>
      </Panel>
      <Panel title="Decision">
        <ActionForm action={reviewRequest}>
          <Hidden
            name="id"
            value={request.id}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Status"
              name="status"
              options={[request.status, ...next].map((value) => ({ value, label: labelFor(REQUEST_STATUSES, value) }))}
              defaultValue={request.status}
            />
            <Select
              label="Assigned reviewer"
              name="reviewerId"
              options={leaders.map((userId) => ({ value: userId, label: names.get(userId) ?? userId }))}
              defaultValue={request.reviewerId ?? ctx.userId}
            />
          </div>
          <TextArea
            label="Feedback to the coach"
            name="feedback"
            rows={3}
            defaultValue={request.feedback}
            hint="Required when rejecting or asking for more information."
          />
          <TextArea
            label="Internal notes (leadership only)"
            name="internalNotes"
            rows={3}
            defaultValue={request.internalNotes}
          />
        </ActionForm>
      </Panel>
      <Panel title="History">
        <ol className="space-y-3 text-sm">
          {request.history.map((entry) => (
            <li
              key={entry.id}
              className="text-slate"
            >
              {entry.previousStatus && `${labelFor(REQUEST_STATUSES, entry.previousStatus)} → `}
              <span className="text-cream">{labelFor(REQUEST_STATUSES, entry.newStatus)}</span> by {names.get(entry.actorId) ?? "—"} ·{" "}
              {formatDateTime(entry.createdAt, ctx.timezone)}
              {entry.comment && <p className="mt-1 whitespace-pre-line">{entry.comment}</p>}
            </li>
          ))}
        </ol>
      </Panel>
    </>
  );
}
