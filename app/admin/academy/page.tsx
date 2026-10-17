import Link from "next/link";
import { AdminListHeader, AdminTable, cell } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui";
import { CONTENT_STATUSES, LESSON_CATEGORIES, LESSON_TYPES, labelFor } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function AdminAcademyPage(props: PageProps<"/admin/academy">) {
  const searchParams = await props.searchParams;
  const lessons = await prisma.lesson.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { registrations: { where: { status: "CONFIRMED" } } } } },
  });

  return (
    <div className="space-y-6">
      <AdminListHeader
        title="Academy"
        newHref="/admin/academy/new"
        newLabel="New lesson"
        saved={searchParams.saved === "1"}
        deleted={searchParams.deleted === "1"}
      />
      <AdminTable
        headers={["Title", "Category", "Type", "Status", "Registered", ""]}
        empty={lessons.length === 0}
      >
        {lessons.map((lesson) => (
          <tr key={lesson.id}>
            <td className={`${cell} text-cream`}>{lesson.title}</td>
            <td className={cell}>{labelFor(LESSON_CATEGORIES, lesson.category)}</td>
            <td className={cell}>{labelFor(LESSON_TYPES, lesson.type)}</td>
            <td className={cell}>
              <Badge tone={lesson.status === "PUBLISHED" ? "green" : "neutral"}>
                {labelFor(CONTENT_STATUSES, lesson.status)}
              </Badge>
            </td>
            <td className={cell}>{lesson._count.registrations}</td>
            <td className={`${cell} text-right`}>
              <Link
                href={`/admin/academy/${lesson.id}`}
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
