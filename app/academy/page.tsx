import type { Metadata } from "next";
import { LessonCard } from "@/components/cards";
import { EmptyState, FilterPills, PageHeader } from "@/components/ui";
import { LESSON_CATEGORIES, LESSON_TYPES, valuesOf } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Academy",
  description: "Lessons, classes, resources and coaching for young entrepreneurs.",
};

export default async function AcademyPage(props: PageProps<"/academy">) {
  const searchParams = await props.searchParams;
  const categoryParam = typeof searchParams.category === "string" ? searchParams.category : "";
  const typeParam = typeof searchParams.type === "string" ? searchParams.type : "";
  const category = valuesOf(LESSON_CATEGORIES).includes(categoryParam) ? categoryParam : "";
  const type = valuesOf(LESSON_TYPES).includes(typeParam) ? typeParam : "";

  const lessons = await prisma.lesson.findMany({
    where: {
      status: "PUBLISHED",
      ...(category ? { category } : {}),
      ...(type ? { type } : {}),
    },
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
  });

  const filterState = {
    category: category || undefined,
    type: type || undefined,
  };
  const filtered = Boolean(category || type);

  return (
    <>
      <PageHeader
        eyebrow="Ventrio Academy"
        title="Learn the business of building"
        description="Practical lessons, live classes, resources and coaching in entrepreneurship, marketing, branding, sales, leadership, AI and faith."
      />
      <section className="container-page py-12 sm:py-16">
        <div className="flex flex-col gap-4 border-b border-line pb-8">
          <FilterPills
            label="Category"
            param="category"
            options={LESSON_CATEGORIES}
            current={category}
            basePath="/academy"
            searchParams={filterState}
          />
          <FilterPills
            label="Type"
            param="type"
            options={LESSON_TYPES}
            current={type}
            basePath="/academy"
            searchParams={filterState}
          />
        </div>

        <div className="mt-10">
          {lessons.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={filtered ? "Nothing here yet" : "Lessons are on the way"}
              description={
                filtered
                  ? "No lessons match these filters yet. Try another category."
                  : "We're preparing our first lessons, classes and coaching sessions. Check back soon or join the community to be notified."
              }
            />
          )}
        </div>
      </section>
    </>
  );
}
