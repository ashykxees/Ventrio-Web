import { ResourceForm } from "@/components/coach/ResourceForm";
import { Empty, List, PageTitle, Panel, Row, StatusBadge } from "@/components/coach/ui";
import { requireCoach, userNames } from "@/lib/coach/access";
import { getCoachConfig } from "@/lib/coach/config";
import { RESOURCE_STATUSES } from "@/lib/coach/constants";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Lessons & Resources" };

export default async function CoachResourcesPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const ctx = await requireCoach();
  const q = typeof searchParams.q === "string" ? searchParams.q.trim().slice(0, 80) : "";
  const category = typeof searchParams.category === "string" ? searchParams.category : "";
  const [config, library, mine] = await Promise.all([
    getCoachConfig(),
    prisma.coachResource.findMany({
      where: {
        status: "PUBLISHED",
        ...(category ? { category } : {}),
        ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] } : {}),
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.coachResource.findMany({
      where: { authorId: ctx.userId, status: { not: "PUBLISHED" } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  const authors = await userNames(library.map((r) => r.authorId));

  return (
    <>
      <PageTitle
        title="Lessons & Resources"
        description="Approved coaching materials, plus your own lessons in progress."
      />
      <Panel title="Library">
        <form className="mb-4 grid gap-3 sm:grid-cols-[1fr_14rem_auto] sm:items-end">
          <label className="block">
            <span className="field-label">Search</span>
            <input
              name="q"
              defaultValue={q}
              className="field-input"
              placeholder="Title or description"
            />
          </label>
          <label className="block">
            <span className="field-label">Category</span>
            <select
              name="category"
              defaultValue={category}
              className="field-input"
            >
              <option value="">All categories</option>
              {config.resourceCategories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="btn btn-outline btn-sm"
          >
            Search
          </button>
        </form>
        {library.length === 0 ? (
          <Empty>{q || category ? "No resources match your search." : "No published resources yet."}</Empty>
        ) : (
          <List>
            {library.map((resource) => (
              <Row
                key={resource.id}
                href={`/coach/resources/${resource.id}`}
              >
                <div>
                  <p className="text-sm text-cream">{resource.title}</p>
                  <p className="text-xs text-slate">
                    {resource.category} · {authors.get(resource.authorId) ?? "Ventrio"} · Updated {formatDate(resource.updatedAt, ctx.timezone)}
                  </p>
                  {resource.description && <p className="mt-1 text-xs text-slate">{resource.description}</p>}
                </div>
              </Row>
            ))}
          </List>
        )}
      </Panel>
      <Panel title="Your submissions">
        {mine.length === 0 ? (
          <Empty>Drafts and lessons you submit for review appear here.</Empty>
        ) : (
          <List>
            {mine.map((resource) => (
              <Row
                key={resource.id}
                href={`/coach/resources/${resource.id}`}
              >
                <p className="text-sm text-cream">
                  {resource.title} <span className="text-xs text-slate">v{resource.version}</span>
                </p>
                <StatusBadge
                  status={resource.status}
                  options={RESOURCE_STATUSES}
                />
              </Row>
            ))}
          </List>
        )}
      </Panel>
      <Panel title="Submit a lesson or resource">
        <ResourceForm categories={config.resourceCategories} />
      </Panel>
    </>
  );
}
