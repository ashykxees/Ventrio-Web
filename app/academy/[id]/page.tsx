import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ExternalLink, UserRound, Users } from "lucide-react";
import { SignInWithDiscord } from "@/components/AuthButtons";
import { RegistrationPanel } from "@/components/RegistrationPanel";
import { Badge, TextBlock } from "@/components/ui";
import { cancelLessonRegistration, registerForLesson } from "@/app/actions/registrations";
import { LESSON_CATEGORIES, LESSON_REGISTRATION, LESSON_TYPES, labelFor } from "@/lib/constants";
import { formatRange } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/session";

async function getLesson(id: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id } });

  return lesson?.status === "PUBLISHED" ? lesson : null;
}

export async function generateMetadata(props: PageProps<"/academy/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const lesson = await getLesson(id);

  return { title: lesson?.title ?? "Academy" };
}

export default async function LessonPage(props: PageProps<"/academy/[id]">) {
  const { id } = await props.params;
  const lesson = await getLesson(id);

  if (!lesson) {
    notFound();
  }

  const member = await getCurrentMember();
  const [confirmed, registration] = await Promise.all([
    prisma.registration.count({ where: { lessonId: lesson.id, status: "CONFIRMED" } }),
    member
      ? prisma.registration.findUnique({
          where: { userId_lessonId: { userId: member.userId, lessonId: lesson.id } },
        })
      : null,
  ]);

  const registered = registration?.status === "CONFIRMED";
  const spotsLeft = lesson.capacity !== null ? Math.max(lesson.capacity - confirmed, 0) : null;

  return (
    <article className="container-page py-12 sm:py-16">
      <Link
        href="/academy"
        className="inline-flex items-center gap-2 text-sm text-slate hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4" />
        Academy
      </Link>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="gold">{labelFor(LESSON_CATEGORIES, lesson.category)}</Badge>
            <Badge>{labelFor(LESSON_TYPES, lesson.type)}</Badge>
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold text-cream sm:text-4xl">{lesson.title}</h1>
          <span className="gold-rule mt-8" />
          <p className="mt-8 text-lg leading-relaxed text-cream/90">{lesson.description}</p>
          {lesson.details && (
            <div className="mt-8">
              <TextBlock text={lesson.details} />
            </div>
          )}
        </div>

        <aside className="card h-fit space-y-6 p-6 lg:sticky lg:top-24">
          <dl className="space-y-4 text-sm">
            {lesson.instructor && (
              <div className="flex gap-3">
                <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <div>
                  <dt className="sr-only">Instructor</dt>
                  <dd className="text-cream">{lesson.instructor}</dd>
                </div>
              </div>
            )}
            {lesson.startsAt && (
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <div>
                  <dt className="sr-only">When</dt>
                  <dd className="text-cream">
                    {formatRange(lesson.startsAt, lesson.endsAt, lesson.timezone)}
                  </dd>
                </div>
              </div>
            )}
            {lesson.capacity !== null && lesson.registrationStatus === "OPEN" && (
              <div className="flex gap-3">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <div>
                  <dt className="sr-only">Spots</dt>
                  <dd className="text-cream">
                    {spotsLeft} of {lesson.capacity} spots left
                  </dd>
                </div>
              </div>
            )}
          </dl>

          {lesson.resourceUrl && (
            <a
              href={lesson.resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline w-full"
            >
              Open resource
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          <div className="border-t border-line pt-6">
            {lesson.registrationStatus === "OPEN" ? (
              member ? (
                <RegistrationPanel
                  registered={registered}
                  full={spotsLeft === 0}
                  register={registerForLesson.bind(null, lesson.id)}
                  cancel={cancelLessonRegistration.bind(null, lesson.id)}
                />
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate">Sign in to register.</p>
                  <SignInWithDiscord
                    callbackUrl={`/academy/${lesson.id}`}
                    className="btn btn-gold w-full"
                  />
                </div>
              )
            ) : (
              <p className="text-sm text-slate">{labelFor(LESSON_REGISTRATION, lesson.registrationStatus)}</p>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
