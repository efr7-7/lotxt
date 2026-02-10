import { useState, useEffect } from "react";
import { useDistributeStore, type DistributionChannel } from "@/stores/distribute-store";
import { useAccountsStore } from "@/stores/accounts-store";
import { useSocialStore } from "@/stores/social-store";
import { useAiStore } from "@/stores/ai-store";
import { useEditorStore } from "@/stores/editor-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Twitter,
  Linkedin,
  Mail,
  FileText,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  Zap,
  AlertCircle,
  ArrowRight,
  Settings2,
  Wand2,
  Eye,
  Globe,
  Facebook,
  Send,
  Youtube,
  Instagram,
  Music2,
} from "lucide-react";

// Lazy import social preview components
import { OGMetaEditor } from "@/components/social-preview/OGMetaEditor";
import { TwitterPreview } from "@/components/social-preview/TwitterPreview";
import { LinkedInPreview } from "@/components/social-preview/LinkedInPreview";
import { FacebookPreview } from "@/components/social-preview/FacebookPreview";
import { EmailPreview } from "@/components/social-preview/EmailPreview";
import { YouTubePreview } from "@/components/social-preview/YouTubePreview";
import { TikTokPreview } from "@/components/social-preview/TikTokPreview";

/* ─── Channel definitions ─── */
const CHANNELS: {
  id: DistributionChannel;
  label: string;
  icon: typeof Twitter;
  color: string;
  description: string;
  postable?: boolean;
}[] = [
  {
    id: "twitter",
    label: "Twitter/X Thread",
    icon: Twitter,
    color: "#1DA1F2",
    description: "Auto-split into numbered tweets with hooks",
    postable: true,
  },
  {
    id: "linkedin",
    label: "LinkedIn Post",
    icon: Linkedin,
    color: "#0A66C2",
    description: "Professional tone, optimized for engagement",
    postable: true,
  },
  {
    id: "email_subject",
    label: "Email Subject Lines",
    icon: Mail,
    color: "#FF6719",
    description: "5 high-open-rate subject line options",
  },
  {
    id: "summary",
    label: "TL;DR Summary",
    icon: FileText,
    color: "#A78BFA",
    description: "2-3 sentence teaser for cross-posting",
  },
  {
    id: "youtube_description",
    label: "YouTube Description",
    icon: Youtube,
    color: "#FF0000",
    description: "SEO-optimized video description with timestamps",
  },
  {
    id: "tiktok_caption",
    label: "TikTok Caption",
    icon: Music2,
    color: "#000000",
    description: "Viral hook + trending hashtags",
  },
  {
    id: "reels_caption",
    label: "Reels Caption",
    icon: Instagram,
    color: "#E1306C",
    description: "Hook + CTA with hashtags",
  },
];

/* ─── Preview platform filter ─── */
const PREVIEW_PLATFORMS = [
  { id: "all" as const, label: "All Platforms" },
  { id: "twitter" as const, label: "Twitter/X" },
  { id: "linkedin" as const, label: "LinkedIn" },
  { id: "facebook" as const, label: "Facebook" },
  { id: "email" as const, label: "Email" },
  { id: "youtube" as const, label: "YouTube" },
  { id: "tiktok" as const, label: "TikTok" },
];

type TabId = "preview" | "adapt";

export default function DistributeWorkspace() {
  const { variants, generateVariant, generateAll, updateVariant, refineVariant, postToTwitter, postToLinkedin, postingTwitter, postingLinkedin } = useDistributeStore();
  const { accounts } = useAccountsStore();
  const { ogMeta, activePlatform, setActivePlatform, deriveFromEditor } = useSocialStore();
  const { activeProviderId, providers, loadProviders } = useAiStore();
  const { currentDocument } = useEditorStore();
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("preview");

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  // Auto-sync OG meta from editor on mount
  useEffect(() => {
    if (currentDocument.title || currentDocument.htmlContent) {
      deriveFromEditor(currentDocument.title, currentDocument.htmlContent);
    }
  }, []);

  const hasContent = currentDocument.title || currentDocument.htmlContent;
  const hasProvider = activeProviderId && providers.length > 0;
  const activeProvider = providers.find((p) => p.id === activeProviderId);
  const isAnyGenerating = Object.values(variants).some((v) => v.isGenerating);
  const hasOGContent = ogMeta.title || currentDocument.title;

  const hasTwitterAccount = accounts.some((a) => a.platform === "twitter" && a.isConnected);
  const hasLinkedinAccount = accounts.some((a) => a.platform === "linkedin" && a.isConnected);

  const handleManualSync = () => {
    deriveFromEditor(currentDocument.title, currentDocument.htmlContent);
  };

  const handleGenerate = async (channel: DistributionChannel) => {
    setError(null);
    try {
      await generateVariant(channel);
    } catch (e) {
      setError(String(e));
    }
  };

  const handleGenerateAll = async () => {
    setError(null);
    try {
      await generateAll();
    } catch (e) {
      setError(String(e));
    }
  };

  const handleCopy = (channel: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedChannel(channel);
    setTimeout(() => setCopiedChannel(null), 2000);
  };

  const handlePostTwitter = async () => {
    setError(null);
    try {
      const ids = await postToTwitter();
      toast.success(`Thread posted! ${ids.length} tweet${ids.length !== 1 ? "s" : ""}`);
    } catch (e) {
      setError(String(e));
    }
  };

  const handlePostLinkedin = async () => {
    setError(null);
    try {
      await postToLinkedin();
      toast.success("Posted to LinkedIn!");
    } catch (e) {
      setError(String(e));
    }
  };

  const showPlatform = (p: string) =>
    activePlatform === "all" || activePlatform === p;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-border/40 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-foreground">Distribute</h1>
              <p className="text-[11px] text-muted-foreground/60">
                Preview, adapt & publish everywhere
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active provider badge */}
            {activeProvider && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/50 border border-border/40">
                <Zap className="w-3 h-3 text-primary/60" />
                <span className="text-[11px] text-muted-foreground">
                  {activeProvider.name} · {activeProvider.model}
                </span>
              </div>
            )}

            {/* Generate all button — only show on Adapt tab */}
            {activeTab === "adapt" && (
              <button
                onClick={handleGenerateAll}
                disabled={!hasContent || !hasProvider || isAnyGenerating}
                className={cn(
                  "flex items-center gap-2 h-8 px-4 rounded-lg text-[12px] font-semibold",
                  "transition-all duration-200",
                  hasContent && hasProvider && !isAnyGenerating
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                    : "bg-accent text-muted-foreground/40 cursor-not-allowed"
                )}
              >
                {isAnyGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    Generate All
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
            <p className="text-[12px] text-destructive/80 line-clamp-2">{error}</p>
          </div>
        )}
      </div>

      {/* Main layout: OG Meta (left) + Tabbed Content (right) */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel: OG Meta Editor */}
        <div className="w-[260px] border-r border-border/40 bg-background shrink-0 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-muted-foreground/50" />
                <h2 className="text-[12px] font-semibold text-foreground/80">Meta Tags</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[9px] text-primary/50">
                  <Zap className="w-2.5 h-2.5" />
                  Auto-sync
                </span>
                <button
                  onClick={handleManualSync}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground/40 hover:text-foreground transition-colors"
                  title="Force sync from editor"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>
            <OGMetaEditor />
          </div>
        </div>

        {/* Right panel: Tabbed Preview / Adapt */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Tab bar */}
          <div className="shrink-0 border-b border-border/40 px-6 flex items-center gap-0">
            <TabButton
              active={activeTab === "preview"}
              onClick={() => setActiveTab("preview")}
              icon={Eye}
              label="Preview"
            />
            <TabButton
              active={activeTab === "adapt"}
              onClick={() => setActiveTab("adapt")}
              icon={Wand2}
              label="Adapt"
            />

            {/* Platform filter — only on Preview tab */}
            {activeTab === "preview" && (
              <div className="ml-auto flex items-center gap-1">
                {PREVIEW_PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePlatform(p.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                      activePlatform === p.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground/40 hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "preview" ? (
              <PreviewTab
                hasOGContent={!!hasOGContent}
                ogMeta={ogMeta}
                showPlatform={showPlatform}
                htmlContent={currentDocument.htmlContent}
              />
            ) : (
              <AdaptTab
                hasContent={!!hasContent}
                hasProvider={!!hasProvider}
                currentDocument={currentDocument}
                variants={variants}
                channels={CHANNELS}
                copiedChannel={copiedChannel}
                onGenerate={handleGenerate}
                onCopy={handleCopy}
                onUpdateVariant={updateVariant}
                onRefine={refineVariant}
                onPostTwitter={handlePostTwitter}
                onPostLinkedin={handlePostLinkedin}
                hasTwitterAccount={hasTwitterAccount}
                hasLinkedinAccount={hasLinkedinAccount}
                postingTwitter={postingTwitter}
                postingLinkedin={postingLinkedin}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab Button ─── */
function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Eye;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-4 h-10 text-[12px] font-medium transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground/45 hover:text-foreground/70"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      {active && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2px] bg-primary rounded-full" />
      )}
    </button>
  );
}

/* ─── Preview Tab ─── */
function PreviewTab({
  hasOGContent,
  ogMeta,
  showPlatform,
  htmlContent,
}: {
  hasOGContent: boolean;
  ogMeta: any;
  showPlatform: (p: string) => boolean;
  htmlContent: string;
}) {
  if (!hasOGContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center mb-5">
          <Eye className="w-6 h-6 text-primary/40" />
        </div>
        <p className="text-[14px] font-semibold text-foreground/70 mb-1.5">
          Live social previews
        </p>
        <p className="text-[13px] text-muted-foreground/40 text-center max-w-sm leading-relaxed">
          Start writing in the Editor — previews for Twitter, LinkedIn,
          Facebook, and email will update automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {showPlatform("twitter") && <TwitterPreview meta={ogMeta} />}
      {showPlatform("linkedin") && <LinkedInPreview meta={ogMeta} />}
      {showPlatform("facebook") && <FacebookPreview meta={ogMeta} />}
      {showPlatform("email") && (
        <EmailPreview meta={ogMeta} content={htmlContent} />
      )}
      {showPlatform("youtube") && <YouTubePreview meta={ogMeta} />}
      {showPlatform("tiktok") && <TikTokPreview meta={ogMeta} />}
    </div>
  );
}

/* ─── Adapt Tab ─── */
function AdaptTab({
  hasContent,
  hasProvider,
  currentDocument,
  variants,
  channels,
  copiedChannel,
  onGenerate,
  onCopy,
  onUpdateVariant,
  onRefine,
  onPostTwitter,
  onPostLinkedin,
  hasTwitterAccount,
  hasLinkedinAccount,
  postingTwitter,
  postingLinkedin,
}: {
  hasContent: boolean;
  hasProvider: boolean;
  currentDocument: any;
  variants: any;
  channels: typeof CHANNELS;
  copiedChannel: string | null;
  onGenerate: (channel: DistributionChannel) => void;
  onCopy: (channel: string, content: string) => void;
  onUpdateVariant: (channel: DistributionChannel, content: string) => void;
  onRefine: (channel: DistributionChannel, instruction: string) => Promise<void>;
  onPostTwitter: () => void;
  onPostLinkedin: () => void;
  hasTwitterAccount: boolean;
  hasLinkedinAccount: boolean;
  postingTwitter: boolean;
  postingLinkedin: boolean;
}) {
  const [refineInputs, setRefineInputs] = useState<Record<string, string>>({});
  const [refiningChannel, setRefiningChannel] = useState<string | null>(null);

  const handleRefine = async (channel: DistributionChannel) => {
    const instruction = refineInputs[channel]?.trim();
    if (!instruction) return;

    setRefiningChannel(channel);
    try {
      await onRefine(channel, instruction);
      setRefineInputs((prev) => ({ ...prev, [channel]: "" }));
    } catch {
      // Error handled by parent
    } finally {
      setRefiningChannel(null);
    }
  };

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 border border-violet-500/10 flex items-center justify-center mb-5">
          <FileText className="w-6 h-6 text-violet-400/50" />
        </div>
        <p className="text-[14px] font-semibold text-foreground/70 mb-1.5">
          No content to adapt
        </p>
        <p className="text-[13px] text-muted-foreground/40 text-center max-w-sm leading-relaxed">
          Write something in the Editor first — then come here to generate
          platform-optimized versions with one click.
        </p>
      </div>
    );
  }

  if (!hasProvider) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border/30 flex items-center justify-center mb-5">
          <Settings2 className="w-6 h-6 text-muted-foreground/35" />
        </div>
        <p className="text-[14px] font-semibold text-foreground/70 mb-1.5">
          Connect an AI provider
        </p>
        <p className="text-[13px] text-muted-foreground/40 text-center max-w-sm mb-5 leading-relaxed">
          Add your Claude, GPT, Gemini, or OpenRouter API key in Accounts to
          enable AI-powered content adaptation.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Source content indicator */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/30 border border-border/30">
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40" />
        <p className="text-[12px] text-muted-foreground/60">
          Source:{" "}
          <span className="text-foreground/70 font-medium">
            {currentDocument.title || "Untitled"}
          </span>
          <span className="text-muted-foreground/40 ml-2">
            {currentDocument.wordCount} words
          </span>
        </p>
      </div>

      {/* Channel cards */}
      {channels.map((channel) => {
        const variant = variants[channel.id];
        const isCopied = copiedChannel === channel.id;
        const Icon = channel.icon;
        const isPosting =
          (channel.id === "twitter" && postingTwitter) ||
          (channel.id === "linkedin" && postingLinkedin);
        const canPost =
          (channel.id === "twitter" && hasTwitterAccount) ||
          (channel.id === "linkedin" && hasLinkedinAccount);

        return (
          <div
            key={channel.id}
            className="rounded-xl border border-border/40 bg-card/50 overflow-hidden"
          >
            {/* Channel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${channel.color}15` }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: channel.color }}
                  />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">
                    {channel.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50">
                    {channel.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Post button for social channels */}
                {channel.postable && variant.content && !variant.isGenerating && canPost && (
                  <button
                    onClick={channel.id === "twitter" ? onPostTwitter : onPostLinkedin}
                    disabled={isPosting}
                    className="h-7 px-2.5 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
                  >
                    {isPosting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        Post to {channel.id === "twitter" ? "X" : "LinkedIn"}
                      </>
                    )}
                  </button>
                )}
                {variant.content && (
                  <button
                    onClick={() => onCopy(channel.id, variant.content)}
                    className="h-7 px-2.5 rounded-md text-[11px] flex items-center gap-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-accent/50 transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => onGenerate(channel.id)}
                  disabled={variant.isGenerating}
                  className={cn(
                    "h-7 px-2.5 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors",
                    variant.isGenerating
                      ? "text-muted-foreground/40 cursor-wait"
                      : variant.content
                        ? "text-muted-foreground/60 hover:text-foreground hover:bg-accent/50"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  {variant.isGenerating ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Generating...
                    </>
                  ) : variant.content ? (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      Regenerate
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Content area — now shows partial streaming content */}
            <div className="px-4 py-3">
              {variant.isGenerating && variant.content ? (
                // Streaming: show partial content with cursor
                <div>
                  <textarea
                    value={variant.content}
                    readOnly
                    className={cn(
                      "w-full bg-transparent text-[13px] text-foreground/80 leading-relaxed resize-none outline-none",
                      "min-h-[100px]"
                    )}
                    rows={Math.min(
                      Math.max(variant.content.split("\n").length + 1, 4),
                      20
                    )}
                  />
                  <div className="flex items-center gap-2 text-muted-foreground/40 mt-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-[11px]">Streaming...</span>
                  </div>
                </div>
              ) : variant.isGenerating ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground/40">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[12px]">
                      Adapting content for {channel.label}...
                    </span>
                  </div>
                </div>
              ) : variant.content ? (
                <textarea
                  value={variant.content}
                  onChange={(e) => onUpdateVariant(channel.id, e.target.value)}
                  className={cn(
                    "w-full bg-transparent text-[13px] text-foreground/80 leading-relaxed resize-none outline-none",
                    "placeholder:text-muted-foreground/30",
                    "min-h-[100px]"
                  )}
                  rows={Math.min(
                    Math.max(variant.content.split("\n").length + 1, 4),
                    20
                  )}
                />
              ) : (
                <div className="flex items-center justify-center py-6">
                  <p className="text-[12px] text-muted-foreground/30">
                    Click Generate to create {channel.label.toLowerCase()}{" "}
                    content
                  </p>
                </div>
              )}

              {/* Metadata line */}
              {variant.content && !variant.isGenerating && (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/20">
                  <span className="text-[10px] text-muted-foreground/30">
                    {variant.content.length} chars
                  </span>
                  {variant.isEdited && (
                    <span className="text-[10px] text-amber-500/50">
                      Edited
                    </span>
                  )}
                  {variant.lastGenerated && (
                    <span className="text-[10px] text-muted-foreground/30">
                      Generated{" "}
                      {new Date(variant.lastGenerated).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              )}

              {/* Refine input — visible when content exists and not generating */}
              {variant.content && !variant.isGenerating && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/20">
                  <input
                    value={refineInputs[channel.id] || ""}
                    onChange={(e) =>
                      setRefineInputs((prev) => ({ ...prev, [channel.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRefine(channel.id);
                    }}
                    placeholder="Refine: e.g. make it shorter, more casual..."
                    className="flex-1 h-7 px-2 rounded-md border border-border/40 bg-background text-[11px] outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/30"
                    disabled={refiningChannel === channel.id}
                  />
                  <button
                    onClick={() => handleRefine(channel.id)}
                    disabled={!refineInputs[channel.id]?.trim() || refiningChannel === channel.id}
                    className="h-7 px-2.5 rounded-md text-[11px] font-medium flex items-center gap-1 bg-accent hover:bg-accent/80 text-muted-foreground disabled:opacity-30 transition-colors"
                  >
                    {refiningChannel === channel.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Wand2 className="w-3 h-3" />
                    )}
                    Refine
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
