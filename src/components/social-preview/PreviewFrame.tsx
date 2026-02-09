interface Props {
  platform: string;
  label: string;
  children: React.ReactNode;
}

export function PreviewFrame({ platform, label, children }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="bg-card rounded-xl border border-border p-5 flex justify-center">
        {children}
      </div>
    </div>
  );
}
