import { saveResource } from "@/app/actions/coach";
import { ActionForm } from "@/components/coach/ActionForm";
import { Field, Hidden, Select, TextArea } from "@/components/coach/fields";

export function ResourceForm({
  categories,
  resource,
}: {
  categories: string[];
  resource?: { id: string; title: string; description: string; category: string; url: string; content: string };
}) {
  return (
    <ActionForm
      action={saveResource}
      resetOnSuccess={!resource}
      intents={[
        { value: "submit", label: "Submit for review" },
        { value: "draft", label: "Save draft", variant: "outline" },
      ]}
    >
      {resource && (
        <Hidden
          name="id"
          value={resource.id}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Title"
          name="title"
          required
          maxLength={150}
          defaultValue={resource?.title}
        />
        <Select
          label="Category"
          name="category"
          required
          options={categories}
          defaultValue={resource?.category ?? categories[0]}
        />
      </div>
      <TextArea
        label="Short description"
        name="description"
        rows={2}
        maxLength={1000}
        defaultValue={resource?.description}
      />
      <Field
        label="Link to the material"
        name="url"
        type="url"
        defaultValue={resource?.url}
        hint="Google Drive, Docs, Slides, Canva… Make sure Ventrio leadership has access."
      />
      <TextArea
        label="Lesson plan or content"
        name="content"
        rows={8}
        maxLength={20000}
        defaultValue={resource?.content}
      />
    </ActionForm>
  );
}
