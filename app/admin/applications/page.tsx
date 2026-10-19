import Link from "next/link";
import { AdminListHeader, AdminTable, cell } from "@/components/admin/AdminTable";
import { Badge, FilterPills } from "@/components/ui";
import { APPLICATION_STATUSES, APPLICATION_TONE, COACH_POSITIONS } from "@/lib/careers";
import { labelFor, valuesOf } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function AdminApplicationsPage(props: PageProps<"/admin/applications">) {
  const searchParams = await props.searchParams;
  const statusParam = typeof searchParams.status === "string" ? searchParams.status : "";
  const status = valuesOf(APPLICATION_STATUSES).includes(statusParam) ? statusParam : "";
  const applications = await prisma.coachApplication.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <AdminListHeader title="Coach applications" />
      <FilterPills
        label="Status"
        param="status"
        options={APPLICATION_STATUSES}
        current={status}
        basePath="/admin/applications"
        searchParams={{ status: status || undefined }}
      />
      <AdminTable
        headers={["Applicant", "Position", "Email", "Status", "Submitted", ""]}
        empty={applications.length === 0}
      >
        {applications.map((application) => (
          <tr key={application.id}>
            <td className={`${cell} text-cream`}>@{application.discordUsername}</td>
            <td className={cell}>{labelFor(COACH_POSITIONS, application.position)}</td>
            <td className={cell}>{application.email}</td>
            <td className={cell}>
              <Badge tone={APPLICATION_TONE[application.status]}>
                {labelFor(APPLICATION_STATUSES, application.status)}
              </Badge>
            </td>
            <td className={cell}>{application.createdAt.toISOString().slice(0, 10)}</td>
            <td className={`${cell} text-right`}>
              <Link
                href={`/admin/applications/${application.id}`}
                className="text-gold hover:text-gold-soft"
              >
                Review
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
