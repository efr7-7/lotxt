import { useSocialStore } from "@/stores/social-store";

export function OGMetaEditor() {
  const { ogMeta, setOGMeta } = useSocialStore();

  return (
    <div className="space-y-3">
      <Field
        label="Title"
        value={ogMeta.title}
        onChange={(v) => setOGMeta({ title: v })}
        placeholder="Newsletter title"
        maxLength={70}
      />
      <Field
        label="Description"
        value={ogMeta.description}
        onChange={(v) => setOGMeta({ description: v })}
        placeholder="Brief description of your newsletter"
        maxLength={200}
        multiline
      />
      <Field
        label="Image URL"
        value={ogMeta.image}
        onChange={(v) => setOGMeta({ image: v })}
        placeholder="https://..."
      />
      <Field
        label="Site Name"
        value={ogMeta.siteName}
        onChange={(v) => setOGMeta({ siteName: v })}
        placeholder="Your Newsletter"
      />
      <Field
        label="Author"
        value={ogMeta.author}
        onChange={(v) => setOGMeta({ author: v })}
        placeholder="Author name"
      />
      <Field
        label="URL"
        value={ogMeta.url}
        onChange={(v) => setOGMeta({ url: v })}
        placeholder="https://yournewsletter.com/post-slug"
      />

      {/* Preview of character counts */}
      <div className="pt-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          Title: {ogMeta.title.length}/70 · Desc: {ogMeta.description.length}/200
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength?: number;
  multiline?: boolean;
}) {
  const Component = multiline ? "textarea" : "input";
  return (
    <div>
      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
        {label}
      </label>
      <Component
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={multiline ? 3 : undefined}
        className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-ring resize-none"
      />
    </div>
  );
}
