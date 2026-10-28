import { saveRequest } from "@/app/actions/coach";
import { ActionForm } from "@/components/coach/ActionForm";
import { Field, Hidden, Select, TextArea } from "@/components/coach/fields";

export function RequestForm({
  categories,
  request,
}: {
  categories: string[];
  request?: { id: string; title: string; category: string; description: string; requestedDate: Date | null; links: string };
}) {
  return (
    <ActionForm
      action={saveRequest}
      resetOnSuccess={!request}
      intents={[
        { value: "submit", label: "Submit request" },
        { value: "draft", label: "Save draft", variant: "outline" },
      ]}
    >
      {request && (
        <Hidden
          name="id"
          value={request.id}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Request title"
          name="title"
          required
          maxLength={150}
          defaultValue={request?.title}
        />
        <Select
          label="Category"
          name="category"
          required
          options={categories}
          defaultValue={request?.category ?? categories[0]}
        />
        <Field
          label="Requested date or deadline"
          name="requestedDate"
          type="date"
          defaultValue={request?.requestedDate?.toISOString().slice(0, 10)}
        />
      </div>
      <TextArea
        label="Description and justification"
        name="description"
        required
        rows={5}
        defaultValue={request?.description}
      />
      <TextArea
        label="Attachment links"
        name="links"
        rows={2}
        maxLength={2000}
        defaultValue={request?.links}
        hint="Optional. Full https:// links (Google Drive, Docs, etc.), one per line."
      />
    </ActionForm>
  );
}
