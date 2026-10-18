import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { EventCard } from "@/components/cards";
import { EmptyState, FilterPills, PageHeader } from "@/components/ui";
import { EVENT_TYPES, valuesOf } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Events",
  description: "Classes, coaching calls, networking sessions, faith sessions and pitch competitions.",
};

const STATUS_FILTERS = [
  { value: "past", label: "Past" },
  { value: "all", label: "All dates" },
];

export default async function EventsPage(props: PageProps<"/events">) {
  const searchParams = await props.searchParams;
  const typeParam = typeof searchParams.type === "string" ? searchParams.type : "";
  const statusParam = typeof searchParams.status === "string" ? searchParams.status : "upcoming";
  const type = valuesOf(EVENT_TYPES).includes(typeParam) ? typeParam : "";
  const status = statusParam === "past" ? "past" : statusParam === "all" ? "" : "upcoming";
  const now = new Date();

  const where: Prisma.EventWhereInput = {
    status: { in: ["PUBLISHED", "CANCELLED"] },
    ...(type ? { type } : {}),
  };

  if (status === "upcoming") {
    where.OR = [{ endsAt: { gte: now } }, { endsAt: null, startsAt: { gte: now } }];
  } else if (status === "past") {
    where.OR = [{ endsAt: { lt: now } }, { endsAt: null, startsAt: { lt: now } }];
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { startsAt: status === "past" ? "desc" : "asc" },
    include: {
      _count: {
        select: { registrations: { where: { status: "CONFIRMED" } } },
      },
    },
  });

  const filterState = {
    type: type || undefined,
    status: status === "upcoming" ? undefined : status || "all",
  };

  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="Learn, connect and compete"
        description="Classes, coaching calls, networking sessions, faith sessions and pitch competitions for Ventrio members."
      />
      <section className="container-page py-12 sm:py-16">
        <div className="flex flex-col gap-4 border-b border-line pb-8">
          <FilterPills
            label="Type"
            param="type"
            options={EVENT_TYPES}
            current={type}
            basePath="/events"
            searchParams={filterState}
          />
          <FilterPills
            label="When"
            allLabel="Upcoming"
            param="status"
            options={STATUS_FILTERS}
            current={status === "upcoming" ? "" : status === "past" ? "past" : "all"}
            basePath="/events"
            searchParams={filterState}
          />
        </div>

        <div className="mt-10">
          {events.length > 0 ? (
            <div className="grid gap-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  spotsLeft={
                    event.capacity !== null && event.registrationMode === "SITE"
                      ? Math.max(event.capacity - event._count.registrations, 0)
                      : null
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={status === "past" ? "No past events" : "New events coming soon"}
              description={
                type || status === "past"
                  ? "Nothing matches these filters yet. Try a different filter."
                  : "We're planning classes, coaching calls and pitch competitions. Join the community to hear about them first."
              }
            />
          )}
        </div>
      </section>
    </>
  );
}
