import { AnnouncementForm } from "@/components/coach/AnnouncementForm";
import { Empty, List, PageTitle, Panel, Row, StatusBadge } from "@/components/coach/ui";
import { requireLeadership } from "@/lib/coach/access";
import { getCoachConfig } from "@/lib/coach/config";
import { PUBLISH_STATUSES } from "@/lib/coach/constants";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Coach Announcements" };

export default async function LeadershipAnnouncementsPage() {
  const ctx = await requireLeadership();
  const [config, announcements] = await Promise.all([
    getCoachConfig(),
    prisma.coachAnnouncement.findMany({ include: { _count: { select: { reads: true } } }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <>
      <PageTitle
        title="Announcements"
        description="Coach-only announcements. Coaches get an in-app notification when one goes live."
      />
      <Panel title="New announcement">
        <AnnouncementForm
          roles={config.coachRoles}
          timezone={ctx.timezone}
        />
      </Panel>
      <Panel title="All announcements">
        {announcements.length === 0 ? (
          <Empty>No announcements yet.</Empty>
        ) : (
          <List>
            {announcements.map((a) => (
              <Row
                key={a.id}
                href={`/coach/leadership/announcements/${a.id}`}
              >
                <div>
                  <p className="text-sm text-cream">
                    {a.pinned && "[Pinned] "}
                    {a.title}
                  </p>
                  <p className="text-xs text-slate">
                    {a.audience || "All coaches"} · {a.publishAt ? formatDateTime(a.publishAt, ctx.timezone) : "Not published"} · read by {a._count.reads}
                  </p>
                </div>
                <StatusBadge
                  status={a.status}
                  options={PUBLISH_STATUSES}
                />
              </Row>
            ))}
          </List>
        )}
      </Panel>
    </>
  );
}
