import { acknowledgePolicy } from "@/app/actions/coach";
import { ActionForm } from "@/components/coach/ActionForm";
import { Hidden } from "@/components/coach/fields";
import { Badge, TextBlock } from "@/components/ui";
import { Empty, PageTitle, Panel } from "@/components/coach/ui";
import { requireCoach } from "@/lib/coach/access";
import { getPolicyStatus } from "@/lib/coach/queries";
import { formatDate } from "@/lib/dates";

export const metadata = { title: "Policies" };

export default async function CoachPoliciesPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const ctx = await requireCoach();
  const q = typeof searchParams.q === "string" ? searchParams.q.trim().toLowerCase().slice(0, 80) : "";
  const all = await getPolicyStatus(ctx.userId);
  const policies = all.filter(
    ({ policy, current }) => !q || policy.title.toLowerCase().includes(q) || current?.content.toLowerCase().includes(q),
  );
  const history = all.flatMap(({ policy, current }) =>
    policy.versions.flatMap((version) =>
      version.acks.map((ack) => ({ id: ack.id, title: policy.title, version: version.version, at: ack.acknowledgedAt, current: version.id === current?.id })),
    ),
  );

  return (
    <>
      <PageTitle
        title="Policies"
        description="Ventrio's coach handbook. Each new version needs its own acknowledgment."
      />
      <form className="flex gap-3">
        <input
          name="q"
          defaultValue={q}
          className="field-input"
          placeholder="Search policies"
          aria-label="Search policies"
        />
        <button
          type="submit"
          className="btn btn-outline btn-sm"
        >
          Search
        </button>
      </form>
      {policies.length === 0 ? (
        <Empty>{q ? "No policies match your search." : "Policy pending leadership approval."}</Empty>
      ) : (
        policies.map(({ policy, current, acknowledged, needsAck }) => (
          <Panel key={policy.id}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{policy.category}</Badge>
              <span className="text-xs text-slate">
                Version {policy.currentVersion}
                {current && ` · Published ${formatDate(current.publishedAt, ctx.timezone)}`}
              </span>
              {needsAck && <Badge tone="gold">Acknowledgment required</Badge>}
              {acknowledged && <Badge tone="green">Acknowledged</Badge>}
            </div>
            <h2 className="mt-3 font-display text-lg font-semibold text-cream">{policy.title}</h2>
            <details
              className="mt-3"
              open={needsAck}
            >
              <summary className="cursor-pointer text-sm text-gold">Read policy</summary>
              <div className="mt-3">{current ? <TextBlock text={current.content} /> : null}</div>
            </details>
            {needsAck && current && (
              <div className="mt-4">
                <ActionForm
                  action={acknowledgePolicy}
                  submitLabel={`I acknowledge version ${current.version}`}
                >
                  <Hidden
                    name="versionId"
                    value={current.id}
                  />
                </ActionForm>
              </div>
            )}
          </Panel>
        ))
      )}
      <Panel title="Your acknowledgment history">
        {history.length === 0 ? (
          <Empty>No acknowledgments yet.</Empty>
        ) : (
          <ul className="space-y-2 text-sm text-slate">
            {history.map((entry) => (
              <li key={entry.id}>
                <span className="text-cream">{entry.title}</span> v{entry.version} · {formatDate(entry.at, ctx.timezone)}
                {!entry.current && " · superseded"}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
