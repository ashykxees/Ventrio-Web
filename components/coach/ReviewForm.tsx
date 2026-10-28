import { saveReview } from "@/app/actions/leadership";
import { ActionForm } from "@/components/coach/ActionForm";
import { Field, Hidden, Select, TextArea } from "@/components/coach/fields";
import type { CoachConfig } from "@/lib/coach/config";

export function ReviewForm({
  config,
  coaches,
  review,
}: {
  config: CoachConfig;
  coaches: { value: string; label: string }[];
  review?: { id: string; coachId: string; periodStart: Date; periodEnd: Date; content: string; rating: string; internalNotes: string };
}) {
  const content = review ? (JSON.parse(review.content) as Record<string, string>) : {};

  return (
    <ActionForm
      action={saveReview}
      intents={[
        { value: "draft", label: "Save draft", variant: "outline" },
        { value: "finalize", label: "Finalize & share", confirm: "Finalize this review? The coach will see it and it can't be edited afterwards." },
      ]}
    >
      {review && (
        <Hidden
          name="id"
          value={review.id}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="Coach"
          name="coachId"
          options={coaches}
          defaultValue={review?.coachId}
        />
        <Field
          label="Period start"
          name="periodStart"
          type="date"
          required
          defaultValue={review?.periodStart.toISOString().slice(0, 10)}
        />
        <Field
          label="Period end"
          name="periodEnd"
          type="date"
          required
          defaultValue={review?.periodEnd.toISOString().slice(0, 10)}
        />
      </div>
      {config.reviewCategories.map((category, index) => (
        <TextArea
          key={category}
          label={category}
          name={`category_${index}`}
          rows={3}
          maxLength={4000}
          defaultValue={content[category]}
        />
      ))}
      {config.ratingScale.length > 0 && (
        <Select
          label="Overall rating"
          name="rating"
          options={config.ratingScale}
          placeholder="No rating"
          defaultValue={review?.rating}
        />
      )}
      <TextArea
        label="Internal leadership notes"
        name="internalNotes"
        rows={3}
        defaultValue={review?.internalNotes}
        hint="Never shown to the coach."
      />
    </ActionForm>
  );
}
