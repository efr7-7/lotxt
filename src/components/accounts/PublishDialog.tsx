import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAccountsStore } from "@/stores/accounts-store";
import { useEditorStore } from "@/stores/editor-store";
import { getPlatform } from "@/lib/platforms";
import { X, Loader2, Send, CheckCircle2 } from "lucide-react";

interface Props {
  onClose: () => void;
}

export function PublishDialog({ onClose }: Props) {
  const { accounts } = useAccountsStore();
  const { currentDocument } = useEditorStore();
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [isPublishing, setIsPublishing] = useState(false);
  const [results, setResults] = useState<
    { key: string; success: boolean; message: string }[]
  >([]);

  const connectedAccounts = accounts.filter((a) => a.isConnected);

  const toggleAccount = (key: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    const newResults: typeof results = [];

    for (const key of selectedAccounts) {
      const [platform, accountId] = key.split(":");
      const account = accounts.find(
        (a) => a.platform === platform && a.accountId === accountId,
      );
      if (!account) continue;

      const pubId = account.publications[0]?.id || "default";

      try {
        const postId = await invoke<string>("publish_post", {
          platform,
          accountId,
          publicationId: pubId,
          request: {
            title: currentDocument.title || "Untitled",
            html_content: currentDocument.htmlContent,
            subtitle: null,
            preview_text: null,
            status,
          },
        });
        newResults.push({
          key,
          success: true,
          message: `Published! Post ID: ${postId}`,
        });
      } catch (e) {
        newResults.push({ key, success: false, message: String(e) });
      }
    }

    setResults(newResults);
    setIsPublishing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-popover border border-border rounded-xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            Publish Newsletter
          </h2>
          <button
            onClick={onClose}
            className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Document preview */}
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium text-foreground">
              {currentDocument.title || "Untitled"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentDocument.wordCount} words
            </p>
          </div>

          {/* Account selection */}
          {connectedAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No connected accounts. Go to Accounts to add one.
            </p>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Publish to:
              </label>
              {connectedAccounts.map((acc) => {
                const key = `${acc.platform}:${acc.accountId}`;
                const platform = getPlatform(acc.platform);
                const isSelected = selectedAccounts.includes(key);
                const result = results.find((r) => r.key === key);

                return (
                  <button
                    key={key}
                    onClick={() => toggleAccount(key)}
                    disabled={isPublishing || !!result}
                    className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-colors text-left ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent"
                    } ${result ? "opacity-80" : ""}`}
                  >
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: platform?.color || "#666" }}
                    >
                      {platform?.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {acc.accountName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {platform?.name}
                      </p>
                    </div>
                    {result && (
                      <span
                        className={`text-xs ${result.success ? "text-green-500" : "text-destructive"}`}
                      >
                        {result.success ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          result.message
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Publish as draft or live */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatus("draft")}
              className={`flex-1 h-9 rounded-md text-sm font-medium transition-colors ${
                status === "draft"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              Save as Draft
            </button>
            <button
              onClick={() => setStatus("published")}
              className={`flex-1 h-9 rounded-md text-sm font-medium transition-colors ${
                status === "published"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              Publish Live
            </button>
          </div>

          {/* Publish button */}
          <button
            onClick={handlePublish}
            disabled={isPublishing || selectedAccounts.length === 0}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPublishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isPublishing
              ? "Publishing..."
              : `Publish to ${selectedAccounts.length} account${selectedAccounts.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
