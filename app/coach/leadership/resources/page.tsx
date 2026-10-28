import Link from "next/link";
import { createLeadershipResource } from "@/app/actions/leadership";
import { ActionForm } from "@/components/coach/ActionForm";
import { Field, Select, TextArea } from "@/components/coach/fields";
import { FilterPills } from "@/components/ui";
import { Empty, List, PageTitle, Panel, Row, StatusBadge } from "@/components/coach/ui";
import { requireLeadership, userNames } from "@/lib/coach/access";
import { getCoachConfig } from "@/lib/coach/config";
import { RESOURCE_STATUSES } from "@/lib/coach/constants";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Lessons & Resources" };

export default async function LeadershipResourcesPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await props.searchParams;
  const ctx = await requireLeadership();
  const status = typeof sp.status === "string" ? sp.status : "SUBMITTED";
  const [config, resources] = await Promise.all([
    getCoachConfig(),
    prisma.coachResource.findMany({
      // Coach drafts stay private until submitted.
      where: status ? { status } : { status: { not: "DRAFT" } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  const names = await userNames(resources.map((r) => r.authorId));

  return (
    <>
      <PageTitle
        title="Lessons & Resources"
        description="Review coach submissions, publish materials and archive outdated ones."
      />
      <FilterPills
        label="Status"
        param="status"
        options={RESOURCE_STATUSES.filter((s) => s.value !== "DRAFT")}
        current={status}
        basePath="/coach/leadership/resources"
        searchParams={{ status: status || undefined }}
      />
      <Panel>
        {resources.length === 0 ? (
          <Empty>Nothing here.</Empty>
        ) : (
          <List>
            {resources.map((resource) => (
              <Row
                key={resource.id}
                href={`/coach/leadership/resources/${resource.id}`}
              >
                <div>
                  <p className="text-sm text-cream">
                    {resource.title} <span className="text-xs text-slate">v{resource.version}</span>
                  </p>
                  <p className="text-xs text-slate">
                    {resource.category} · {names.get(resource.authorId) ?? "—"} · {formatDate(resource.updatedAt, ctx.timezone)}
                  </p>
                </div>
                <StatusBadge
                  status={resource.status}
                  options={RESOURCE_STATUSES}
                />
              </Row>
            ))}
          </List>
        )}
      </Panel>
      <Panel title="Publish a resource">
        <ActionForm
          action={createLeadershipResource}
          submitLabel="Publish"
          resetOnSuccess
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Title"
              name="title"
              required
            />
            <Select
              label="Category"
              name="category"
              options={config.resourceCategories}
            />
          </div>
          <TextArea
            label="Description"
            name="description"
            rows={2}
          />
          <Field
            label="Link"
            name="url"
            type="url"
          />
          <TextArea
            label="Content"
            name="content"
            rows={6}
            maxLength={20000}
          />
        </ActionForm>
        <p className="mt-4 text-xs text-slate">
          Files are shared as links (e.g. Google Drive). <Link href="/coach/resources" className="text-gold">View the coach library</Link>
        </p>
      </Panel>
    </>
  );
}
