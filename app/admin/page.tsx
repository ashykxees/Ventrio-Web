import Link from "next/link";
import { LaunchDmForm } from "@/components/admin/LaunchDmForm";
import { Badge } from "@/components/ui";
import { sendLaunchDmsAction } from "@/app/actions/admin";
import { prisma } from "@/lib/prisma";
import { isSiteLaunched } from "@/lib/site";

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

  const [waitlist, joinedGuild, notified, notifyFailed] = await Promise.all([
    prisma.profile.count({ where: { notifyOnLaunch: true } }),
    prisma.profile.count({ where: { joinedGuildAt: { not: null } } }),
    prisma.profile.count({ where: { launchNotifiedAt: { not: null }, launchNotifyError: null } }),
    prisma.profile.count({ where: { launchNotifyError: { not: null } } }),
  ]);
  const launched = isSiteLaunched();
  const botReady = Boolean(process.env.DISCORD_BOT_TOKEN);

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
      <section className="card mt-10 space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold text-cream">Launch</h2>
          <div className="flex gap-2">
            <Badge tone={launched ? "green" : "gold"}>{launched ? "Site launched" : "Teaser mode"}</Badge>
            <Badge tone={botReady ? "green" : "red"}>
              {botReady ? "Bot token set" : "Bot token missing"}
            </Badge>
          </div>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs tracking-wide text-slate uppercase">Waiting for launch DM</dt>
            <dd className="mt-1 font-display text-2xl text-cream">{waitlist}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-slate uppercase">Added to Discord server</dt>
            <dd className="mt-1 font-display text-2xl text-cream">{joinedGuild}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-slate uppercase">Launch DMs sent</dt>
            <dd className="mt-1 font-display text-2xl text-cream">{notified}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-slate uppercase">DMs failed</dt>
            <dd className="mt-1 font-display text-2xl text-cream">{notifyFailed}</dd>
          </div>
        </dl>
        <p className="text-sm leading-relaxed text-slate">
          Setting <code className="text-cream">SITE_LAUNCHED=true</code> opens the full site and automatically
          DMs everyone on the waitlist once, about 15 seconds after the deploy starts. Use the button to retry
          for anyone who signed up afterwards.
        </p>
        <LaunchDmForm
          action={sendLaunchDmsAction}
          disabled={!launched || !botReady}
        />
      </section>

      <p className="mt-10 text-sm text-slate">
        Admin access is granted by Discord user ID through the{" "}
        <code className="text-cream">ADMIN_DISCORD_IDS</code> environment variable.
      </p>
    </div>
  );
}
