import Link from "next/link";
import { notFound } from "next/navigation";
import { AnnouncementForm } from "@/components/coach/AnnouncementForm";
import { PageTitle, Panel } from "@/components/coach/ui";
import { requireLeadership } from "@/lib/coach/access";
import { getCoachConfig } from "@/lib/coach/config";
import { prisma } from "@/lib/prisma";

export default async function EditAnnouncementPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const ctx = await requireLeadership();
  const [config, announcement] = await Promise.all([getCoachConfig(), prisma.coachAnnouncement.findUnique({ where: { id } })]);

  if (!announcement) {
    notFound();
  }

  return (
    <>
      <PageTitle title="Edit announcement" />
      <Link
        href="/coach/leadership/announcements"
        className="text-sm text-gold"
      >
        ← All announcements
      </Link>
      <Panel>
        <AnnouncementForm
          roles={config.coachRoles}
          timezone={ctx.timezone}
          announcement={announcement}
        />
      </Panel>
    </>
  );
}
