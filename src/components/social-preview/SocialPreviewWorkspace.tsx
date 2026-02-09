import { useSocialStore } from "@/stores/social-store";
import { useEditorStore } from "@/stores/editor-store";
import { OGMetaEditor } from "./OGMetaEditor";
import { TwitterPreview } from "./TwitterPreview";
import { LinkedInPreview } from "./LinkedInPreview";
import { FacebookPreview } from "./FacebookPreview";
import { EmailPreview } from "./EmailPreview";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

const PLATFORMS = [
  { id: "all" as const, label: "All" },
  { id: "twitter" as const, label: "Twitter/X" },
  { id: "linkedin" as const, label: "LinkedIn" },
  { id: "facebook" as const, label: "Facebook" },
  { id: "email" as const, label: "Email" },
];

export default function SocialPreviewWorkspace() {
  const { ogMeta, activePlatform, setActivePlatform, deriveFromEditor } = useSocialStore();
  const { currentDocument } = useEditorStore();

  const handleSync = () => {
    deriveFromEditor(currentDocument.title, currentDocument.htmlContent);
  };

  const showPlatform = (p: typeof activePlatform) =>
    activePlatform === "all" || activePlatform === p;

  return (
    <div className="h-full flex">
      {/* Left: OG Meta Editor */}
      <div className="w-72 border-r border-border bg-card/50 shrink-0 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Meta Tags</h2>
            <button
              onClick={handleSync}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Sync from editor"
            >
              <RefreshCw className="w-3 h-3" />
              Sync
            </button>
          </div>
          <OGMetaEditor />
        </div>
      </div>

      {/* Right: Previews */}
      <div className="flex-1 overflow-y-auto">
        {/* Platform filter tabs */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-2 flex items-center gap-1">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePlatform(p.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                activePlatform === p.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Preview cards */}
        <div className="p-6 space-y-6">
          {!ogMeta.title && !currentDocument.title ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-sm">
                Write something in the editor, then click "Sync" to preview how it'll look on social platforms.
              </p>
            </div>
          ) : (
            <>
              {showPlatform("twitter") && <TwitterPreview meta={ogMeta} />}
              {showPlatform("linkedin") && <LinkedInPreview meta={ogMeta} />}
              {showPlatform("facebook") && <FacebookPreview meta={ogMeta} />}
              {showPlatform("email") && (
                <EmailPreview meta={ogMeta} content={currentDocument.htmlContent} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
