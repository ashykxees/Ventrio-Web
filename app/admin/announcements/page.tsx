import Link from "next/link";
import { AdminListHeader, AdminTable, cell } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui";
import { CONTENT_STATUSES, labelFor } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function AdminAnnouncementsPage(props: PageProps<"/admin/announcements">) {
  const searchParams = await props.searchParams;
  const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <AdminListHeader
        title="Announcements"
        newHref="/admin/announcements/new"
        newLabel="New announcement"
        saved={searchParams.saved === "1"}
        deleted={searchParams.deleted === "1"}
      />
      <AdminTable
        headers={["Title", "Status", "Published", ""]}
        empty={announcements.length === 0}
      >
        {announcements.map((announcement) => (
          <tr key={announcement.id}>
            <td className={`${cell} text-cream`}>{announcement.title}</td>
            <td className={cell}>
              <Badge tone={announcement.status === "PUBLISHED" ? "green" : "neutral"}>
                {labelFor(CONTENT_STATUSES, announcement.status)}
              </Badge>
            </td>
            <td className={cell}>
              {announcement.publishedAt ? announcement.publishedAt.toISOString().slice(0, 10) : "—"}
            </td>
            <td className={`${cell} text-right`}>
              <Link
                href={`/admin/announcements/${announcement.id}`}
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
