import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteContent, saveCompetition } from "@/app/actions/admin";
import { competitionFields } from "@/lib/admin-fields";
import { prisma } from "@/lib/prisma";

export default async function AdminCompetitionPage(props: PageProps<"/admin/competitions/[id]">) {
  const { id } = await props.params;
  const isNew = id === "new";
  const competition = isNew ? null : await prisma.competition.findUnique({ where: { id } });

  if (!isNew && !competition) {
    notFound();
  }

  return (
    <div className="max-w-3xl space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/competitions"
            className="text-sm text-slate hover:text-gold"
          >
            ← Competitions
          </Link>
          <h1 className="mt-2 font-display text-xl font-semibold text-cream">
            {isNew ? "New competition" : "Edit competition"}
          </h1>
        </div>
        {competition && (
          <div className="flex gap-3">
            <Link
              href={`/admin/competitions/${competition.id}/submissions`}
              className="btn btn-outline btn-sm"
            >
              Submissions
            </Link>
            <DeleteButton action={deleteContent.bind(null, "competition", competition.id)} />
          </div>
        )}
      </div>

      <AdminForm
        fields={competitionFields(competition)}
        action={saveCompetition.bind(null, competition?.id ?? null)}
        submitLabel={isNew ? "Create competition" : "Save changes"}
      />
    </div>
  );
}
