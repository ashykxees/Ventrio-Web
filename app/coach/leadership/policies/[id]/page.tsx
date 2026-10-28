import Link from "next/link";
import { notFound } from "next/navigation";
import { publishPolicyVersion, savePolicy } from "@/app/actions/leadership";
import { ActionForm } from "@/components/coach/ActionForm";
import { Checkbox, Field, Hidden, Select, TextArea } from "@/components/coach/fields";
import { PageTitle, Panel, StatusBadge } from "@/components/coach/ui";
import { coachName, getActiveCoaches, requireLeadership, userNames } from "@/lib/coach/access";
import { PUBLISH_STATUSES } from "@/lib/coach/constants";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function LeadershipPolicyPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const ctx = await requireLeadership();
  const [coaches, policy] = await Promise.all([
    getActiveCoaches(),
    prisma.policy.findUnique({ where: { id }, include: { versions: { include: { acks: true }, orderBy: { version: "desc" } } } }),
  ]);

  if (!policy) {
    notFound();
  }

  const current = policy.versions.find((v) => v.version === policy.currentVersion);
  const names = await userNames(policy.versions.map((v) => v.createdById));

  return (
    <>
      <PageTitle
        title={policy.title}
        description={`${policy.category} · current version ${policy.currentVersion || "none"}`}
      >
        <StatusBadge
          status={policy.status}
          options={PUBLISH_STATUSES}
        />
      </PageTitle>
      <Link
        href="/coach/leadership/policies"
        className="text-sm text-gold"
      >
        ← All policies
      </Link>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Settings">
          <ActionForm
            action={savePolicy}
            confirm="Save these policy settings?"
          >
            <Hidden
              name="id"
              value={policy.id}
            />
            <Field
              label="Title"
              name="title"
              required
              defaultValue={policy.title}
            />
            <Field
              label="Category"
              name="category"
              required
              defaultValue={policy.category}
            />
            <Select
              label="Status"
              name="status"
              options={PUBLISH_STATUSES}
              defaultValue={policy.status}
              hint="Archive to hide an obsolete policy. History is kept."
            />
            <Checkbox
              name="requiresAck"
              label="Acknowledgment required"
              defaultChecked={policy.requiresAck}
            />
          </ActionForm>
        </Panel>
        <Panel title={current ? `Acknowledgments for v${current.version}` : "Acknowledgments"}>
          {!current ? (
            <p className="text-sm text-slate">Publish a version first.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {coaches.map((coach) => {
                const ack = current.acks.find((a) => a.userId === coach.userId);

                return (
                  <li
                    key={coach.id}
                    className="flex justify-between gap-3"
                  >
                    <span className="text-cream">{coachName(coach)}</span>
                    <span className={ack ? "text-emerald-300" : "text-gold"}>
                      {ack ? formatDateTime(ack.acknowledgedAt, ctx.timezone) : "Outstanding"}
                    </span>
                  </li>
                );
              })}
              {coaches.length === 0 && <li className="text-slate">No active coaches.</li>}
            </ul>
          )}
        </Panel>
      </div>
      <Panel title={`Publish version ${policy.currentVersion + 1}`}>
        <ActionForm
          action={publishPolicyVersion}
          submitLabel="Publish new version"
          confirm="Publish this version? Coaches will need to acknowledge it again."
        >
          <Hidden
            name="id"
            value={policy.id}
          />
          <TextArea
            label="Policy text (approved handbook wording)"
            name="content"
            rows={12}
            maxLength={50000}
            required
            defaultValue={current?.content}
          />
        </ActionForm>
      </Panel>
      <Panel title="Version history">
        <ul className="space-y-2 text-sm text-slate">
          {policy.versions.map((version) => (
            <li key={version.id}>
              <span className="text-cream">v{version.version}</span> · {formatDateTime(version.publishedAt, ctx.timezone)} by{" "}
              {names.get(version.createdById) ?? "—"} · {version.acks.length} acknowledgment{version.acks.length === 1 ? "" : "s"}
            </li>
          ))}
          {policy.versions.length === 0 && <li>No versions yet.</li>}
        </ul>
      </Panel>
    </>
  );
}
