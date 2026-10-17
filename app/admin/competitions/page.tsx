import Link from "next/link";
import { AdminListHeader, AdminTable, cell } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui";
import { COMPETITION_PHASES, CONTENT_STATUSES, labelFor } from "@/lib/constants";
import { PHASE_TONE } from "@/lib/content";
import { prisma } from "@/lib/prisma";

export default async function AdminCompetitionsPage(props: PageProps<"/admin/competitions">) {
  const searchParams = await props.searchParams;
  const competitions = await prisma.competition.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });

  return (
    <div className="space-y-6">
      <AdminListHeader
        title="Competitions"
        newHref="/admin/competitions/new"
        newLabel="New competition"
        saved={searchParams.saved === "1"}
        deleted={searchParams.deleted === "1"}
      />
      <AdminTable
        headers={["Title", "Phase", "Visibility", "Submissions", ""]}
        empty={competitions.length === 0}
      >
        {competitions.map((competition) => (
          <tr key={competition.id}>
            <td className={`${cell} text-cream`}>{competition.title}</td>
            <td className={cell}>
              <Badge tone={PHASE_TONE[competition.phase]}>
                {labelFor(COMPETITION_PHASES, competition.phase)}
              </Badge>
            </td>
            <td className={cell}>{labelFor(CONTENT_STATUSES, competition.status)}</td>
            <td className={cell}>
              <Link
                href={`/admin/competitions/${competition.id}/submissions`}
                className="text-gold hover:text-gold-soft"
              >
                {competition._count.submissions} — review
              </Link>
            </td>
            <td className={`${cell} text-right`}>
              <Link
                href={`/admin/competitions/${competition.id}`}
                className="text-gold hover:text-gold-soft"
              >
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
