import Link from "next/link";
import { notFound } from "next/navigation";
import { reviewResource } from "@/app/actions/leadership";
import { ActionForm } from "@/components/coach/ActionForm";
import { Hidden, TextArea } from "@/components/coach/fields";
import { TextBlock } from "@/components/ui";
import { Detail, LinkList, PageTitle, Panel, StatusBadge } from "@/components/coach/ui";
import { requireLeadership, userNames } from "@/lib/coach/access";
import { RESOURCE_STATUSES } from "@/lib/coach/constants";
import { labelFor } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function LeadershipResourcePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const ctx = await requireLeadership();
  const resource = await prisma.coachResource.findFirst({
    where: { id, status: { not: "DRAFT" } },
    include: { reviews: { orderBy: { createdAt: "desc" } } },
  });

  if (!resource) {
    notFound();
  }

  const names = await userNames([resource.authorId, ...resource.reviews.map((r) => r.reviewerId)]);
  const intents = [
    ...(resource.status !== "PUBLISHED" ? [{ value: "PUBLISHED", label: "Approve & publish" }] : []),
    ...(resource.status === "SUBMITTED" ? [{ value: "REVISION", label: "Request revisions", variant: "outline" as const }] : []),
    ...(resource.status !== "ARCHIVED" ? [{ value: "ARCHIVED", label: "Archive", variant: "danger" as const, confirm: "Archive this resource?" }] : []),
  ];

  return (
    <>
      <PageTitle
        title={resource.title}
        description={`${resource.category} · ${names.get(resource.authorId) ?? "—"} · v${resource.version}`}
      >
        <StatusBadge
          status={resource.status}
          options={RESOURCE_STATUSES}
        />
      </PageTitle>
      <Link
        href="/coach/leadership/resources"
        className="text-sm text-gold"
      >
        ← Resources
      </Link>
      <Panel>
        <dl className="space-y-4">
          <Detail label="Description">{resource.description}</Detail>
          <Detail label="Link">
            <LinkList text={resource.url} />
          </Detail>
        </dl>
        {resource.content && (
          <div className="mt-6 border-t border-line pt-6">
            <TextBlock text={resource.content} />
          </div>
        )}
      </Panel>
      {intents.length > 0 && (
        <Panel title="Review">
          <ActionForm
            action={reviewResource}
            intents={intents}
          >
            <Hidden
              name="id"
              value={resource.id}
            />
            <TextArea
              label="Feedback to the author"
              name="feedback"
              rows={3}
              hint="Required when requesting revisions."
            />
          </ActionForm>
        </Panel>
      )}
      <Panel title="Review history">
        <ul className="space-y-2 text-sm text-slate">
          {resource.reviews.map((review) => (
            <li key={review.id}>
              <span className="text-cream">{labelFor(RESOURCE_STATUSES, review.status)}</span> by {names.get(review.reviewerId) ?? "—"} ·{" "}
              {formatDateTime(review.createdAt, ctx.timezone)}
              {review.feedback && ` · ${review.feedback}`}
            </li>
          ))}
          {resource.reviews.length === 0 && <li>No reviews yet.</li>}
        </ul>
      </Panel>
    </>
  );
}
