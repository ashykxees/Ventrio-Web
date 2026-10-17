import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteContent, saveLesson } from "@/app/actions/admin";
import { lessonFields } from "@/lib/admin-fields";
import { prisma } from "@/lib/prisma";

export default async function AdminLessonPage(props: PageProps<"/admin/academy/[id]">) {
  const { id } = await props.params;
  const isNew = id === "new";
  const lesson = isNew ? null : await prisma.lesson.findUnique({ where: { id } });

  if (!isNew && !lesson) {
    notFound();
  }

  return (
    <div className="max-w-3xl space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/academy"
            className="text-sm text-slate hover:text-gold"
          >
            ← Academy
          </Link>
          <h1 className="mt-2 font-display text-xl font-semibold text-cream">
            {isNew ? "New lesson" : "Edit lesson"}
          </h1>
        </div>
        {lesson && (
          <div className="flex gap-3">
            {lesson.status === "PUBLISHED" && (
              <Link
                href={`/academy/${lesson.id}`}
                className="btn btn-outline btn-sm"
              >
                View
              </Link>
            )}
            <DeleteButton action={deleteContent.bind(null, "lesson", lesson.id)} />
          </div>
        )}
      </div>

      <AdminForm
        fields={lessonFields(lesson)}
        action={saveLesson.bind(null, lesson?.id ?? null)}
        submitLabel={isNew ? "Create lesson" : "Save changes"}
      />
    </div>
  );
}
