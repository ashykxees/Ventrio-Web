import { saveSettings } from "@/app/actions/leadership";
import { ActionForm } from "@/components/coach/ActionForm";
import { Checkbox, Field, TextArea } from "@/components/coach/fields";
import { Empty, PageTitle, Panel } from "@/components/coach/ui";
import { getCoachRoleIds, getLeadershipRoleIds, requireLeadership, userNames } from "@/lib/coach/access";
import { CONFIG_FIELDS, getCoachConfig } from "@/lib/coach/config";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Admin Settings" };

export default async function LeadershipSettingsPage() {
  const ctx = await requireLeadership();
  const [config, row, logs] = await Promise.all([
    getCoachConfig(),
    prisma.coachSetting.findUnique({ where: { key: "config" } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  const names = await userNames([row?.updatedById, ...logs.map((l) => l.actorId)]);
  const groups = Array.from(new Set(CONFIG_FIELDS.map((f) => f.group)));
  const leadershipRoles = getLeadershipRoleIds();

  return (
    <>
      <PageTitle
        title="Admin Settings"
        description={
          row
            ? `Last changed by ${names.get(row.updatedById) ?? "—"} on ${formatDateTime(row.updatedAt, ctx.timezone)}.`
            : "Blank fields show as \"Not configured\" to coaches. Nothing here is enforced until you fill it in."
        }
      />
      <Panel title="Access">
        <p className="text-sm text-slate">
          Coach roles: {getCoachRoleIds().join(", ")} (COACH_ROLE_IDS). Leadership: Discord IDs in ADMIN_DISCORD_IDS
          {leadershipRoles.length ? ` and roles ${leadershipRoles.join(", ")} (LEADERSHIP_ROLE_IDS)` : ""}. These are set as Railway
          variables. Notifications are in-app only.
        </p>
      </Panel>
      <ActionForm
        action={saveSettings}
        submitLabel="Save settings"
        className="space-y-6"
      >
        {groups.map((group) => (
          <Panel
            key={group}
            title={group}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {CONFIG_FIELDS.filter((f) => f.group === group).map((field) => {
                const value = config[field.key];

                if (field.kind === "boolean") {
                  return (
                    <Checkbox
                      key={field.key}
                      name={field.key}
                      label={field.label}
                      defaultChecked={Boolean(value)}
                    />
                  );
                }

                if (field.kind === "list") {
                  return (
                    <TextArea
                      key={field.key}
                      name={field.key}
                      label={field.label}
                      hint={field.hint ?? "One per line."}
                      rows={4}
                      defaultValue={(value as string[]).join("\n")}
                    />
                  );
                }

                return (
                  <Field
                    key={field.key}
                    name={field.key}
                    label={field.label}
                    hint={field.hint}
                    placeholder="Not configured"
                    defaultValue={value as string}
                  />
                );
              })}
            </div>
          </Panel>
        ))}
      </ActionForm>
      <div id="audit">
        <Panel title="Audit log">
          {logs.length === 0 ? (
            <Empty>No administrative actions yet.</Empty>
          ) : (
            <ul className="space-y-2 text-sm text-slate">
              {logs.map((log) => (
                <li key={log.id}>
                  <span className="text-cream">{names.get(log.actorId) ?? log.actorId}</span> · {log.action.replace(/_/g, " ").toLowerCase()} ·{" "}
                  {log.entityType} · {formatDateTime(log.createdAt, ctx.timezone)}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
