import { useEffect } from "react";
import { useSocialStore } from "@/stores/social-store";
import { useEditorStore } from "@/stores/editor-store";
import { OGMetaEditor } from "./OGMetaEditor";
import { TwitterPreview } from "./TwitterPreview";
import { LinkedInPreview } from "./LinkedInPreview";
import { FacebookPreview } from "./FacebookPreview";
import { EmailPreview } from "./EmailPreview";
import { cn } from "@/lib/utils";
import { RefreshCw, Zap } from "lucide-react";

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

  // Auto-sync from editor on mount and when switching to this workspace
  useEffect(() => {
    if (currentDocument.title || currentDocument.htmlContent) {
      deriveFromEditor(currentDocument.title, currentDocument.htmlContent);
    }
  }, []); // Only on mount — live sync happens via EditorContext debounce

  const handleManualSync = () => {
    deriveFromEditor(currentDocument.title, currentDocument.htmlContent);
  };

  const showPlatform = (p: typeof activePlatform) =>
    activePlatform === "all" || activePlatform === p;

  const hasContent = ogMeta.title || currentDocument.title;

  return (
    <div className="h-full flex">
      {/* Left: OG Meta Editor */}
      <div className="w-[280px] border-r border-border/40 bg-background shrink-0 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-foreground">Meta Tags</h2>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-primary/60">
                <Zap className="w-2.5 h-2.5" />
                Auto-sync
              </span>
              <button
                onClick={handleManualSync}
                className="flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors"
                title="Force sync from editor"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
          <OGMetaEditor />
        </div>
      </div>

      {/* Right: Previews */}
      <div className="flex-1 overflow-y-auto">
        {/* Platform filter tabs */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/40 px-6 py-2 flex items-center gap-1">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePlatform(p.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                activePlatform === p.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground/60 hover:text-foreground hover:bg-accent/50",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Preview cards */}
        <div className="p-6 space-y-6">
          {!hasContent ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary/40" />
              </div>
              <p className="text-[14px] font-semibold text-foreground/70 mb-1.5">
                Live social previews
              </p>
              <p className="text-[13px] text-muted-foreground/40 leading-relaxed max-w-[280px] mx-auto">
                Start writing in the editor — previews for
                Twitter, LinkedIn, Facebook, and email will update automatically.
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
