import Link from "next/link";
import { notFound } from "next/navigation";
import { ResourceForm } from "@/components/coach/ResourceForm";
import { Notice, TextBlock } from "@/components/ui";
import { Detail, LinkList, PageTitle, Panel, StatusBadge } from "@/components/coach/ui";
import { requireCoach, userNames } from "@/lib/coach/access";
import { getCoachConfig } from "@/lib/coach/config";
import { RESOURCE_STATUSES } from "@/lib/coach/constants";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function CoachResourcePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const ctx = await requireCoach();
  const [config, resource] = await Promise.all([
    getCoachConfig(),
    // Unpublished materials are only visible to their author.
    prisma.coachResource.findFirst({
      where: { id, OR: [{ status: "PUBLISHED" }, { authorId: ctx.userId }] },
      include: { reviews: { orderBy: { createdAt: "desc" } } },
    }),
  ]);

  if (!resource) {
    notFound();
  }

  const names = await userNames([resource.authorId]);
  const isAuthor = resource.authorId === ctx.userId;
  const editable = isAuthor && ["DRAFT", "REVISION"].includes(resource.status);
  const latestFeedback = resource.reviews.find((review) => review.feedback);

  return (
    <>
      <PageTitle
        title={resource.title}
        description={`${resource.category} · ${names.get(resource.authorId) ?? "Ventrio"} · Added ${formatDate(resource.createdAt, ctx.timezone)} · Updated ${formatDate(resource.updatedAt, ctx.timezone)}`}
      >
        <StatusBadge
          status={resource.status}
          options={RESOURCE_STATUSES}
        />
      </PageTitle>
      <Link
        href="/coach/resources"
        className="text-sm text-gold"
      >
        ← Lessons & Resources
      </Link>
      {isAuthor && latestFeedback && <Notice title="Leadership feedback">{latestFeedback.feedback}</Notice>}
      {editable ? (
        <Panel title="Edit">
          <ResourceForm
            categories={config.resourceCategories}
            resource={resource}
          />
        </Panel>
      ) : (
        <Panel>
          <dl className="space-y-4">
            <Detail label="Description">{resource.description}</Detail>
            <Detail label="Link">
              <LinkList text={resource.url} />
            </Detail>
            <Detail label="Version">v{resource.version}</Detail>
          </dl>
          {resource.content && (
            <div className="mt-6 border-t border-line pt-6">
              <TextBlock text={resource.content} />
            </div>
          )}
        </Panel>
      )}
    </>
  );
}
