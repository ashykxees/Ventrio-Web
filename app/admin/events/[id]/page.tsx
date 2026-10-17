import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteContent, saveEvent } from "@/app/actions/admin";
import { eventFields } from "@/lib/admin-fields";
import { prisma } from "@/lib/prisma";

export default async function AdminEventPage(props: PageProps<"/admin/events/[id]">) {
  const { id } = await props.params;
  const isNew = id === "new";
  const event = isNew ? null : await prisma.event.findUnique({ where: { id } });

  if (!isNew && !event) {
    notFound();
  }

  const registrations = event
    ? await prisma.registration.findMany({
        where: { eventId: event.id, status: "CONFIRMED" },
        include: { user: { include: { profile: true } } },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return (
    <div className="max-w-3xl space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/events"
            className="text-sm text-slate hover:text-gold"
          >
            ← Events
          </Link>
          <h1 className="mt-2 font-display text-xl font-semibold text-cream">
            {isNew ? "New event" : "Edit event"}
          </h1>
        </div>
        {event && (
          <div className="flex gap-3">
            {["PUBLISHED", "CANCELLED"].includes(event.status) && (
              <Link
                href={`/events/${event.id}`}
                className="btn btn-outline btn-sm"
              >
                View
              </Link>
            )}
            <DeleteButton action={deleteContent.bind(null, "event", event.id)} />
          </div>
        )}
      </div>

      <AdminForm
        fields={eventFields(event)}
        action={saveEvent.bind(null, event?.id ?? null)}
        submitLabel={isNew ? "Create event" : "Save changes"}
      />

      {event && (
        <section className="border-t border-line pt-8">
          <h2 className="font-display text-base font-semibold text-cream">
            Registrations ({registrations.length})
          </h2>
          {registrations.length === 0 ? (
            <p className="mt-3 text-sm text-slate">No registrations yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line text-sm">
              {registrations.map((registration) => (
                <li
                  key={registration.id}
                  className="flex justify-between gap-4 py-2"
                >
                  <span className="text-cream">{registration.user.profile?.displayName ?? "Member"}</span>
                  <span className="text-slate">
                    @{registration.user.profile?.discordUsername ?? "unknown"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
