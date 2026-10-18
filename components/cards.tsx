import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, UserRound } from "lucide-react";
import type { Competition, Event, Lesson } from "@prisma/client";
import { Badge } from "@/components/ui";
import {
  COMPETITION_PHASES,
  EVENT_FORMATS,
  EVENT_TYPES,
  LESSON_CATEGORIES,
  LESSON_REGISTRATION,
  LESSON_TYPES,
  labelFor,
} from "@/lib/constants";
import { PHASE_TONE, TIMING_BADGE, eventTiming } from "@/lib/content";
import { formatDateTime, formatRange, monthDay } from "@/lib/dates";

export function EventCard({ event, spotsLeft }: { event: Event; spotsLeft?: number | null }) {
  const timing = eventTiming(event);
  const badge = TIMING_BADGE[timing];
  const date = monthDay(event.startsAt, event.timezone);

  return (
    <Link
      href={`/events/${event.id}`}
      className="card card-hover group flex gap-5 p-5 sm:p-6"
    >
      <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-line-strong">
        <span className="font-display text-[0.6rem] font-semibold tracking-[0.2em] text-gold uppercase">
          {date.month}
        </span>
        <span className="font-display text-xl font-semibold text-cream">{date.day}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={badge.tone}>{badge.label}</Badge>
          <Badge>{labelFor(EVENT_TYPES, event.type)}</Badge>
          {spotsLeft === 0 && <Badge tone="red">Full</Badge>}
        </div>
        <h3 className="mt-3 font-display text-base font-semibold text-cream group-hover:text-gold">
          {event.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate">{event.description}</p>
        <div className="mt-4 flex flex-col gap-1.5 text-xs text-slate sm:flex-row sm:flex-wrap sm:gap-x-5">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-gold" />
            {formatRange(event.startsAt, event.endsAt, event.timezone)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gold" />
            {labelFor(EVENT_FORMATS, event.format)}
            {event.location ? ` · ${event.location}` : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function LessonCard({ lesson }: { lesson: Lesson }) {
  return (
    <Link
      href={`/academy/${lesson.id}`}
      className="card card-hover group flex h-full flex-col p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="gold">{labelFor(LESSON_CATEGORIES, lesson.category)}</Badge>
        <Badge>{labelFor(LESSON_TYPES, lesson.type)}</Badge>
      </div>
      <h3 className="mt-4 font-display text-base font-semibold text-cream group-hover:text-gold">
        {lesson.title}
      </h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate">{lesson.description}</p>
      <div className="mt-5 space-y-1.5 border-t border-line pt-4 text-xs text-slate">
        {lesson.instructor && (
          <p className="flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5 text-gold" />
            {lesson.instructor}
          </p>
        )}
        {lesson.startsAt && (
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-gold" />
            {formatDateTime(lesson.startsAt, lesson.timezone)}
          </p>
        )}
        <p className="flex items-center justify-between gap-2">
          <span>{labelFor(LESSON_REGISTRATION, lesson.registrationStatus)}</span>
          <ArrowUpRight className="h-4 w-4 text-gold opacity-0 transition-opacity group-hover:opacity-100" />
        </p>
      </div>
    </Link>
  );
}

export function CompetitionCard({ competition }: { competition: Competition }) {
  return (
    <Link
      href={`/competitions/${competition.id}`}
      className="card card-hover group flex h-full flex-col p-6"
    >
      <Badge tone={PHASE_TONE[competition.phase] ?? "neutral"}>
        {labelFor(COMPETITION_PHASES, competition.phase)}
      </Badge>
      <h3 className="mt-4 font-display text-lg font-semibold text-cream group-hover:text-gold">
        {competition.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate">{competition.summary}</p>
      {competition.deadline && (
        <p className="mt-5 border-t border-line pt-4 text-xs text-slate">
          <span className="text-gold">Deadline</span> ·{" "}
          {formatDateTime(competition.deadline, competition.timezone)}
        </p>
      )}
    </Link>
  );
}
