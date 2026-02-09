import { useState } from "react";
import { useAccountsStore } from "@/stores/accounts-store";
import { PLATFORMS, type PlatformId } from "@/lib/platforms";
import { X, Loader2, ExternalLink } from "lucide-react";

interface Props {
  onClose: () => void;
}

export function AddAccountDialog({ onClose }: Props) {
  const { addAccount } = useAccountsStore();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platform = PLATFORMS.find((p) => p.id === selectedPlatform);

  const handleSubmit = async () => {
    if (!selectedPlatform) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await addAccount(selectedPlatform, fields);
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-popover border border-border rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            {selectedPlatform ? `Connect ${platform?.name}` : "Add Account"}
          </h2>
          <button
            onClick={onClose}
            className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          {!selectedPlatform ? (
            /* Platform selection */
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                Choose a newsletter platform to connect:
              </p>
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPlatform(p.id);
                    setFields({});
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.description}
                    </p>
                  </div>
                  {!p.hasOfficialApi && (
                    <span className="text-[10px] text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                      Unofficial
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            /* Credential form */
            <div className="space-y-3">
              {/* Back button */}
              <button
                onClick={() => setSelectedPlatform(null)}
                className="text-xs text-muted-foreground hover:text-foreground mb-2"
              >
                ← Back to platforms
              </button>

              {platform?.fields.map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={fields[field.key] || ""}
                      onChange={(e) =>
                        setFields((f) => ({ ...f, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-ring resize-none"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={fields[field.key] || ""}
                      onChange={(e) =>
                        setFields((f) => ({ ...f, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-ring"
                    />
                  )}
                </div>
              ))}

              {/* API docs link */}
              {platform && (
                <a
                  href={platform.apiDocsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Where do I find my API key?
                </a>
              )}

              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Connect Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
