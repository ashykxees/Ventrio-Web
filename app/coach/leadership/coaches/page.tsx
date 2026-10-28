import { AdminTable, cell } from "@/components/admin/AdminTable";
import Link from "next/link";
import { Notice } from "@/components/ui";
import { PageTitle, StatusBadge } from "@/components/coach/ui";
import { coachName, getCoachRoleIds, requireLeadership } from "@/lib/coach/access";
import { hasAnyRole, splitIds } from "@/lib/coach/rules";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Coaches" };

const STATUS = [
  { value: "ACTIVE", label: "Active" },
  { value: "DEACTIVATED", label: "Deactivated" },
];

export default async function LeadershipCoachesPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const ctx = await requireLeadership();
  const q = typeof searchParams.q === "string" ? searchParams.q.trim().slice(0, 80) : "";
  const roleIds = getCoachRoleIds();
  const coaches = await prisma.coachProfile.findMany({
    where: q
      ? {
          OR: [
            { user: { profile: { displayName: { contains: q } } } },
            { user: { profile: { discordUsername: { contains: q } } } },
            { coachRole: { contains: q } },
            { expertise: { contains: q } },
          ],
        }
      : {},
    include: { user: { include: { profile: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <PageTitle
        title="Coaches"
        description="Coach access comes from the Discord coach roles. A coach appears here the first time they open the dashboard."
      />
      <Notice>
        To add a coach, give them one of the coach roles in the Ventrio Discord server ({roleIds.join(", ")}). To remove access,
        take the role away or deactivate them here. Deactivating keeps all their records.
      </Notice>
      <form className="flex gap-3">
        <input
          name="q"
          defaultValue={q}
          className="field-input"
          placeholder="Search by name, username, role or expertise"
          aria-label="Search coaches"
        />
        <button
          type="submit"
          className="btn btn-outline btn-sm"
        >
          Search
        </button>
      </form>
      <AdminTable
        headers={["Coach", "Role", "Discord role", "Status", "Joined", ""]}
        empty={coaches.length === 0}
      >
        {coaches.map((coach) => (
          <tr key={coach.id}>
            <td className={`${cell} text-cream`}>
              {coachName(coach)}
              <span className="block text-xs text-slate">@{coach.user.profile?.discordUsername}</span>
            </td>
            <td className={cell}>{coach.coachRole || "—"}</td>
            <td className={cell}>
              {hasAnyRole(splitIds(coach.discordRoles), roleIds) ? "Has coach role" : <span className="text-red-300">Role missing</span>}
              {coach.rolesCheckedAt && <span className="block text-xs">checked {formatDate(coach.rolesCheckedAt, ctx.timezone)}</span>}
            </td>
            <td className={cell}>
              <StatusBadge
                status={coach.status}
                options={STATUS}
              />
            </td>
            <td className={cell}>{formatDate(coach.createdAt, ctx.timezone)}</td>
            <td className={`${cell} text-right`}>
              <Link
                href={`/coach/leadership/coaches/${coach.id}`}
                className="text-gold"
              >
                Manage
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
