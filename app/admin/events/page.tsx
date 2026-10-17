import Link from "next/link";
import { AdminListHeader, AdminTable, cell } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui";
import { EVENT_STATUSES, EVENT_TYPES, labelFor } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function AdminEventsPage(props: PageProps<"/admin/events">) {
  const searchParams = await props.searchParams;
  const events = await prisma.event.findMany({
    orderBy: { startsAt: "desc" },
    include: { _count: { select: { registrations: { where: { status: "CONFIRMED" } } } } },
  });

  return (
    <div className="space-y-6">
      <AdminListHeader
        title="Events"
        newHref="/admin/events/new"
        newLabel="New event"
        saved={searchParams.saved === "1"}
        deleted={searchParams.deleted === "1"}
      />
      <AdminTable
        headers={["Title", "Type", "Starts", "Status", "Registered", ""]}
        empty={events.length === 0}
      >
        {events.map((event) => (
          <tr key={event.id}>
            <td className={`${cell} text-cream`}>{event.title}</td>
            <td className={cell}>{labelFor(EVENT_TYPES, event.type)}</td>
            <td className={cell}>{formatDateTime(event.startsAt, event.timezone)}</td>
            <td className={cell}>
              <Badge
                tone={
                  event.status === "PUBLISHED" ? "green" : event.status === "CANCELLED" ? "red" : "neutral"
                }
              >
                {labelFor(EVENT_STATUSES, event.status)}
              </Badge>
            </td>
            <td className={cell}>
              {event._count.registrations}
              {event.capacity !== null ? ` / ${event.capacity}` : ""}
            </td>
            <td className={`${cell} text-right`}>
              <Link
                href={`/admin/events/${event.id}`}
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
