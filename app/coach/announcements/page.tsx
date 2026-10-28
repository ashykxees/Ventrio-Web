import { markAnnouncementsRead } from "@/app/actions/coach";
import { ActionForm } from "@/components/coach/ActionForm";
import { Hidden } from "@/components/coach/fields";
import { Badge, TextBlock } from "@/components/ui";
import { Empty, PageTitle, Panel } from "@/components/coach/ui";
import { requireCoach } from "@/lib/coach/access";
import { getVisibleAnnouncements } from "@/lib/coach/queries";
import { formatDate } from "@/lib/dates";

export const metadata = { title: "Announcements" };

export default async function CoachAnnouncementsPage() {
  const ctx = await requireCoach();
  const announcements = await getVisibleAnnouncements(ctx);
  const unread = announcements.filter((a) => a.reads.length === 0);

  return (
    <>
      <PageTitle
        title="Announcements"
        description="Updates from Ventrio leadership."
      >
        {unread.length > 0 && (
          <ActionForm
            action={markAnnouncementsRead}
            submitLabel="Mark all read"
            variant="outline"
            className=""
          >
            <Hidden
              name="ids"
              value={unread.map((a) => a.id).join(",")}
            />
          </ActionForm>
        )}
      </PageTitle>
      {announcements.length === 0 ? (
        <Empty>No announcements right now.</Empty>
      ) : (
        announcements.map((announcement) => (
          <Panel key={announcement.id}>
            <div className="flex flex-wrap items-center gap-2">
              {announcement.pinned && <Badge tone="gold">Pinned</Badge>}
              {announcement.important && <Badge tone="red">Important</Badge>}
              {announcement.reads.length === 0 && <Badge tone="blue">New</Badge>}
              <span className="text-xs text-slate">
                {announcement.category} · {formatDate(announcement.publishAt ?? announcement.createdAt, ctx.timezone)}
              </span>
            </div>
            <h2 className="mt-3 font-display text-lg font-semibold text-cream">{announcement.title}</h2>
            <div className="mt-3">
              <TextBlock text={announcement.body} />
            </div>
            {announcement.reads.length === 0 && (
              <div className="mt-4">
                <ActionForm
                  action={markAnnouncementsRead}
                  submitLabel="Mark read"
                  variant="outline"
                >
                  <Hidden
                    name="ids"
                    value={announcement.id}
                  />
                </ActionForm>
              </div>
            )}
          </Panel>
        ))
      )}
    </>
  );
}
