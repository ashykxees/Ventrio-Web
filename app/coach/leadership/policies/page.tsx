import { savePolicy } from "@/app/actions/leadership";
import { ActionForm } from "@/components/coach/ActionForm";
import { Checkbox, Field, Hidden } from "@/components/coach/fields";
import { Empty, List, PageTitle, Panel, Row, StatusBadge } from "@/components/coach/ui";
import { getActiveCoaches, requireLeadership } from "@/lib/coach/access";
import { PUBLISH_STATUSES } from "@/lib/coach/constants";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Policies & Acknowledgments" };

export default async function LeadershipPoliciesPage() {
  await requireLeadership();
  const [coaches, policies] = await Promise.all([
    getActiveCoaches(),
    prisma.policy.findMany({ include: { versions: { include: { acks: true } } }, orderBy: [{ category: "asc" }, { title: "asc" }] }),
  ]);
  const coachUserIds = coaches.map((c) => c.userId);

  return (
    <>
      <PageTitle
        title="Policies & Acknowledgments"
        description="Use Ventrio's approved handbook wording. Each published version needs a fresh acknowledgment."
      />
      <Panel title="New policy">
        <ActionForm
          action={savePolicy}
          submitLabel="Create policy"
          resetOnSuccess
        >
          <Hidden
            name="status"
            value="DRAFT"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Title"
              name="title"
              required
            />
            <Field
              label="Category"
              name="category"
              required
              placeholder="e.g. Professional conduct"
            />
          </div>
          <Checkbox
            name="requiresAck"
            label="Coaches must acknowledge this policy"
            defaultChecked
          />
        </ActionForm>
      </Panel>
      <Panel title="Policies">
        {policies.length === 0 ? (
          <Empty>No policies yet. Coaches see &quot;Policy pending leadership approval&quot; until one is published.</Empty>
        ) : (
          <List>
            {policies.map((policy) => {
              const current = policy.versions.find((v) => v.version === policy.currentVersion);
              const acked = current ? coachUserIds.filter((id) => current.acks.some((a) => a.userId === id)).length : 0;

              return (
                <Row
                  key={policy.id}
                  href={`/coach/leadership/policies/${policy.id}`}
                >
                  <div>
                    <p className="text-sm text-cream">{policy.title}</p>
                    <p className="text-xs text-slate">
                      {policy.category} · v{policy.currentVersion || "—"}
                      {policy.requiresAck && current && ` · ${acked}/${coachUserIds.length} active coaches acknowledged`}
                    </p>
                  </div>
                  <StatusBadge
                    status={policy.status}
                    options={PUBLISH_STATUSES}
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
