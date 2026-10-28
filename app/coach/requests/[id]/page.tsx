import Link from "next/link";
import { notFound } from "next/navigation";
import { withdrawRequest } from "@/app/actions/coach";
import { ActionForm } from "@/components/coach/ActionForm";
import { Hidden } from "@/components/coach/fields";
import { RequestForm } from "@/components/coach/RequestForm";
import { Notice } from "@/components/ui";
import { Detail, LinkList, PageTitle, Panel, StatusBadge } from "@/components/coach/ui";
import { requireCoach, userNames } from "@/lib/coach/access";
import { getCoachConfig } from "@/lib/coach/config";
import { REQUEST_STATUSES } from "@/lib/coach/constants";
import { canTransition, REQUEST_COACH_TRANSITIONS } from "@/lib/coach/rules";
import { labelFor } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function CoachRequestPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const ctx = await requireCoach();
  const [config, request] = await Promise.all([
    getCoachConfig(),
    // internalNotes is deliberately not selected: it's leadership-only.
    prisma.coachRequest.findFirst({
      where: { id, coachId: ctx.coach.id },
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        requestedDate: true,
        links: true,
        status: true,
        feedback: true,
        reviewedAt: true,
        createdAt: true,
        history: { orderBy: { createdAt: "asc" } },
      },
    }),
  ]);

  if (!request) {
    notFound();
  }

  const names = await userNames(request.history.map((entry) => entry.actorId));
  const editable = ["DRAFT", "MORE_INFO"].includes(request.status);

  return (
    <>
      <PageTitle
        title={request.title}
        description={`${request.category} · Submitted ${formatDate(request.createdAt, ctx.timezone)}`}
      >
        <StatusBadge
          status={request.status}
          options={REQUEST_STATUSES}
        />
      </PageTitle>
      <Link
        href="/coach/requests"
        className="text-sm text-gold"
      >
        ← All requests
      </Link>
      {request.feedback && <Notice title="Feedback from leadership">{request.feedback}</Notice>}

      {editable ? (
        <Panel title={request.status === "MORE_INFO" ? "Add the requested information and resubmit" : "Edit draft"}>
          <RequestForm
            categories={config.requestCategories}
            request={request}
          />
        </Panel>
      ) : (
        <Panel title="Request">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Description">{request.description}</Detail>
            <Detail label="Requested date">{request.requestedDate?.toISOString().slice(0, 10)}</Detail>
            <Detail label="Attachments">
              <LinkList text={request.links} />
            </Detail>
            <Detail label="Reviewed">{request.reviewedAt ? formatDateTime(request.reviewedAt, ctx.timezone) : "Not yet"}</Detail>
          </dl>
        </Panel>
      )}

      {canTransition(REQUEST_COACH_TRANSITIONS, request.status, "WITHDRAWN") && (
        <ActionForm
          action={withdrawRequest}
          intents={[{ value: "withdraw", label: "Withdraw request", variant: "danger", confirm: "Withdraw this request?" }]}
        >
          <Hidden
            name="id"
            value={request.id}
          />
        </ActionForm>
      )}

      <Panel title="History">
        <ol className="space-y-3 text-sm">
          {request.history.map((entry) => (
            <li
              key={entry.id}
              className="text-slate"
            >
              <span className="text-cream">{labelFor(REQUEST_STATUSES, entry.newStatus)}</span> by {names.get(entry.actorId) ?? "Ventrio"} ·{" "}
              {formatDateTime(entry.createdAt, ctx.timezone)}
              {entry.comment && <p className="mt-1 whitespace-pre-line">{entry.comment}</p>}
            </li>
          ))}
        </ol>
      </Panel>
    </>
  );
}
