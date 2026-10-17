import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminOverviewPage() {
  const [members, publicMembers, events, lessons, competitions, submissions, registrations] =
    await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({ where: { isPublic: true } }),
      prisma.event.count({ where: { status: "PUBLISHED" } }),
      prisma.lesson.count({ where: { status: "PUBLISHED" } }),
      prisma.competition.count({ where: { status: "PUBLISHED" } }),
      prisma.submission.count({ where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } } }),
      prisma.registration.count({ where: { status: "CONFIRMED" } }),
    ]);

  const stats = [
    { label: "Members", value: members, note: `${publicMembers} public` },
    { label: "Published events", value: events, href: "/admin/events" },
    { label: "Published lessons", value: lessons, href: "/admin/academy" },
    { label: "Published competitions", value: competitions, href: "/admin/competitions" },
    { label: "Submissions to review", value: submissions, href: "/admin/competitions" },
    { label: "Active registrations", value: registrations },
  ];

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-cream">Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const content = (
            <>
              <p className="text-xs tracking-wide text-slate uppercase">{stat.label}</p>
              <p className="mt-3 font-display text-3xl font-semibold text-cream">{stat.value}</p>
              {stat.note && <p className="mt-1 text-xs text-slate">{stat.note}</p>}
            </>
          );

          return stat.href ? (
            <Link
              key={stat.label}
              href={stat.href}
              className="card card-hover p-6"
            >
              {content}
            </Link>
          ) : (
            <div
              key={stat.label}
              className="card p-6"
            >
              {content}
            </div>
          );
        })}
      </div>
      <p className="mt-10 text-sm text-slate">
        Admin access is granted by Discord user ID through the{" "}
        <code className="text-cream">ADMIN_DISCORD_IDS</code> environment variable.
      </p>
    </div>
  );
}
