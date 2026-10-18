import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ExternalLink, MapPin, UserRound, Users } from "lucide-react";
import { SignInWithDiscord } from "@/components/AuthButtons";
import { RegistrationPanel } from "@/components/RegistrationPanel";
import { Badge, Notice, TextBlock } from "@/components/ui";
import { cancelEventRegistration, registerForEvent } from "@/app/actions/registrations";
import { EVENT_FORMATS, EVENT_TYPES, labelFor } from "@/lib/constants";
import { TIMING_BADGE, eventTiming } from "@/lib/content";
import { formatRange } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/session";

async function getEvent(id: string) {
  const event = await prisma.event.findUnique({ where: { id } });

  if (!event || !["PUBLISHED", "CANCELLED"].includes(event.status)) {
    return null;
  }

  return event;
}

export async function generateMetadata(props: PageProps<"/events/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const event = await getEvent(id);

  return { title: event?.title ?? "Event" };
}

export default async function EventPage(props: PageProps<"/events/[id]">) {
  const { id } = await props.params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  const member = await getCurrentMember();
  const timing = eventTiming(event);
  const badge = TIMING_BADGE[timing];

  const [confirmed, registration] = await Promise.all([
    prisma.registration.count({ where: { eventId: event.id, status: "CONFIRMED" } }),
    member
      ? prisma.registration.findUnique({
          where: { userId_eventId: { userId: member.userId, eventId: event.id } },
        })
      : null,
  ]);

  const registered = registration?.status === "CONFIRMED";
  const spotsLeft = event.capacity !== null ? Math.max(event.capacity - confirmed, 0) : null;
  const canRegister = timing === "upcoming";

  return (
    <article className="container-page py-12 sm:py-16">
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm text-slate hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4" />
        All events
      </Link>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={badge.tone}>{badge.label}</Badge>
            <Badge>{labelFor(EVENT_TYPES, event.type)}</Badge>
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold text-cream sm:text-4xl">{event.title}</h1>
          <span className="gold-rule mt-8" />

          {timing === "cancelled" && (
            <div className="mt-8">
              <Notice
                tone="error"
                title="This event has been cancelled"
              >
                We&apos;re sorry for the inconvenience. Check the events page for other sessions.
              </Notice>
            </div>
          )}

          <div className="mt-8">
            <TextBlock text={event.description} />
          </div>
        </div>

        <aside className="card h-fit space-y-6 p-6 lg:sticky lg:top-24">
          <dl className="space-y-4 text-sm">
            <div className="flex gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <div>
                <dt className="sr-only">When</dt>
                <dd className="text-cream">{formatRange(event.startsAt, event.endsAt, event.timezone)}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <div>
                <dt className="sr-only">Where</dt>
                <dd className="text-cream">
                  {labelFor(EVENT_FORMATS, event.format)}
                  {event.location && <span className="block text-slate">{event.location}</span>}
                </dd>
              </div>
            </div>
            {event.organizer && (
              <div className="flex gap-3">
                <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <div>
                  <dt className="sr-only">Organizer</dt>
                  <dd className="text-cream">Hosted by {event.organizer}</dd>
                </div>
              </div>
            )}
            {event.capacity !== null && (
              <div className="flex gap-3">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <div>
                  <dt className="sr-only">Capacity</dt>
                  <dd className="text-cream">
                    {event.registrationMode === "SITE" && spotsLeft !== null
                      ? `${spotsLeft} of ${event.capacity} spots left`
                      : `Capacity ${event.capacity}`}
                  </dd>
                </div>
              </div>
            )}
          </dl>

          <div className="border-t border-line pt-6">
            {!canRegister ? (
              <p className="text-sm text-slate">
                {timing === "cancelled"
                  ? "Registration is closed."
                  : "Registration for this event has closed."}
              </p>
            ) : event.registrationMode === "SITE" ? (
              member ? (
                <RegistrationPanel
                  registered={registered}
                  full={spotsLeft === 0}
                  register={registerForEvent.bind(null, event.id)}
                  cancel={cancelEventRegistration.bind(null, event.id)}
                />
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate">Sign in to register for this event.</p>
                  <SignInWithDiscord
                    callbackUrl={`/events/${event.id}`}
                    className="btn btn-gold w-full"
                  />
                </div>
              )
            ) : event.registrationMode === "EXTERNAL" && event.registrationUrl ? (
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-gold w-full"
              >
                Register
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <p className="text-sm text-slate">No registration needed — just show up.</p>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
