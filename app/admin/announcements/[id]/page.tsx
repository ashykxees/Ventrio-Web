import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteContent, saveAnnouncement } from "@/app/actions/admin";
import { announcementFields } from "@/lib/admin-fields";
import { prisma } from "@/lib/prisma";

export default async function AdminAnnouncementPage(props: PageProps<"/admin/announcements/[id]">) {
  const { id } = await props.params;
  const isNew = id === "new";
  const announcement = isNew ? null : await prisma.announcement.findUnique({ where: { id } });

  if (!isNew && !announcement) {
    notFound();
  }

  return (
    <div className="max-w-3xl space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/announcements"
            className="text-sm text-slate hover:text-gold"
          >
            ← Announcements
          </Link>
          <h1 className="mt-2 font-display text-xl font-semibold text-cream">
            {isNew ? "New announcement" : "Edit announcement"}
          </h1>
        </div>
        {announcement && <DeleteButton action={deleteContent.bind(null, "announcement", announcement.id)} />}
      </div>

      <AdminForm
        fields={announcementFields(announcement)}
        action={saveAnnouncement.bind(null, announcement?.id ?? null)}
        submitLabel={isNew ? "Create announcement" : "Save changes"}
      />
    </div>
  );
}
