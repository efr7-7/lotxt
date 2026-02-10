import { useState } from "react";
import { usePublishStore, type PublishTarget } from "@/stores/publish-store";
import { useAccountsStore } from "@/stores/accounts-store";
import { useEditorStore } from "@/stores/editor-store";
import { getPlatform, NEWSLETTER_PLATFORMS } from "@/lib/platforms";
import { PreflightChecklist } from "./PreflightChecklist";
import { NewsletterPreview } from "./NewsletterPreview";
import {
  X, Loader2, Send, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft,
  Settings2, ClipboardCheck, Eye, Clock, Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "preflight" | "select" | "configure" | "publishing" | "results";

const ALL_STEPS: Step[] = ["preflight", "select", "configure", "publishing", "results"];

interface Props {
  onClose: () => void;
}

export function PublishDialog({ onClose }: Props) {
  const { accounts } = useAccountsStore();
  const { currentDocument } = useEditorStore();
  const { targets, addTarget, removeTarget, updateTarget, publishToAll, isPublishing, reset } = usePublishStore();
  const [step, setStep] = useState<Step>("preflight");
  const [showPreview, setShowPreview] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  const newsletterAccounts = accounts.filter(
    (a) => a.isConnected && NEWSLETTER_PLATFORMS.some((p) => p.id === a.platform)
  );

  const isSelected = (accountId: string) => targets.some((t) => t.accountId === accountId);

  const toggleAccount = (acc: typeof accounts[0]) => {
    if (isSelected(acc.accountId)) {
      removeTarget(acc.accountId);
    } else {
      addTarget({
        platform: acc.platform,
        accountId: acc.accountId,
        publicationId: acc.publications[0]?.id || "default",
        accountName: acc.accountName,
        title: currentDocument.title || "Untitled",
        subtitle: "",
        previewText: "",
        status: "draft",
      });
    }
  };

  const handlePublish = async () => {
    // Set scheduledAt on all targets if schedule mode is active
    if (scheduleMode && scheduledAt) {
      const isoDate = new Date(scheduledAt).toISOString();
      targets.forEach((t) => updateTarget(t.accountId, { scheduledAt: isoDate }));
    } else {
      targets.forEach((t) => updateTarget(t.accountId, { scheduledAt: null }));
    }
    setStep("publishing");
    await publishToAll(currentDocument.htmlContent);
    setStep("results");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const goBack = () => {
    const idx = ALL_STEPS.indexOf(step);
    if (idx > 0) setStep(ALL_STEPS[idx - 1]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={step !== "publishing" ? handleClose : undefined} />

      <div className={cn(
        "relative bg-popover border border-border rounded-xl shadow-2xl max-h-[80vh] flex flex-col",
        showPreview && step === "configure" ? "w-full max-w-4xl" : "w-full max-w-lg",
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {(step === "select" || step === "configure") && (
              <button
                onClick={goBack}
                className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <Send className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              {step === "preflight" && "Pre-flight Checklist"}
              {step === "select" && "Select Destinations"}
              {step === "configure" && "Configure Publishing"}
              {step === "publishing" && "Publishing..."}
              {step === "results" && "Publishing Results"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={step === "publishing"}
            className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 shrink-0">
          {ALL_STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                s === step ? "bg-primary text-primary-foreground" :
                ALL_STEPS.indexOf(step) > i
                  ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/40"
              )}>
                {i + 1}
              </div>
              {i < ALL_STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/30" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className={cn("flex-1 overflow-y-auto", showPreview && step === "configure" ? "flex min-h-0" : "")}>
          <div className={cn("p-4", showPreview && step === "configure" ? "w-1/2 overflow-y-auto border-r border-border/30" : "")}>
            {/* Document preview */}
            <div className="p-3 rounded-lg bg-muted/50 mb-4">
              <p className="text-sm font-medium text-foreground">
                {currentDocument.title || "Untitled"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentDocument.wordCount} words
              </p>
            </div>

            {/* Step 0: Preflight */}
            {step === "preflight" && (
              <PreflightChecklist
                title={currentDocument.title || ""}
                htmlContent={currentDocument.htmlContent || ""}
                wordCount={currentDocument.wordCount}
              />
            )}

            {/* Step 1: Select */}
            {step === "select" && (
              <div className="space-y-2">
                {newsletterAccounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No connected newsletter accounts. Go to Accounts to add one.
                  </p>
                ) : (
                  newsletterAccounts.map((acc) => {
                    const platform = getPlatform(acc.platform);
                    const selected = isSelected(acc.accountId);
                    return (
                      <button
                        key={`${acc.platform}:${acc.accountId}`}
                        onClick={() => toggleAccount(acc)}
                        className={cn(
                          "flex items-center gap-3 w-full p-3 rounded-lg border transition-colors text-left",
                          selected ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
                        )}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: platform?.color || "#666" }}
                        >
                          {platform?.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{acc.accountName}</p>
                          <p className="text-xs text-muted-foreground">{platform?.name}</p>
                        </div>
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                          selected ? "bg-primary border-primary" : "border-border"
                        )}>
                          {selected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* Step 2: Configure */}
            {step === "configure" && (
              <div className="space-y-4">
                {targets.map((target) => {
                  const platform = getPlatform(target.platform);
                  return (
                    <div key={target.accountId} className="rounded-lg border border-border/60 overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border/40">
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                          style={{ backgroundColor: platform?.color || "#666" }}
                        >
                          {platform?.name[0]}
                        </div>
                        <span className="text-[12px] font-medium text-foreground">{target.accountName}</span>
                        <span className="text-[10px] text-muted-foreground">({platform?.name})</span>
                      </div>
                      <div className="p-3 space-y-2">
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Title</label>
                          <input
                            value={target.title}
                            onChange={(e) => updateTarget(target.accountId, { title: e.target.value })}
                            className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Subtitle (optional)</label>
                          <input
                            value={target.subtitle}
                            onChange={(e) => updateTarget(target.accountId, { subtitle: e.target.value })}
                            className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
                            placeholder="Brief subtitle..."
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Preview text (optional)</label>
                          <input
                            value={target.previewText}
                            onChange={(e) => updateTarget(target.accountId, { previewText: e.target.value })}
                            className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
                            placeholder="Email preview text..."
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateTarget(target.accountId, { status: "draft" })}
                            className={cn(
                              "flex-1 h-8 rounded-md text-[11px] font-medium transition-colors",
                              target.status === "draft"
                                ? "bg-muted text-foreground"
                                : "text-muted-foreground hover:bg-muted/50"
                            )}
                          >
                            Draft
                          </button>
                          <button
                            onClick={() => updateTarget(target.accountId, { status: "published" })}
                            className={cn(
                              "flex-1 h-8 rounded-md text-[11px] font-medium transition-colors",
                              target.status === "published"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted/50"
                            )}
                          >
                            Publish Live
                          </button>
                        </div>

                        {/* Schedule toggle */}
                        <div className="mt-2 pt-2 border-t border-border/30">
                          <div className="flex items-center gap-2 mb-2">
                            <button
                              onClick={() => setScheduleMode(false)}
                              className={cn(
                                "flex items-center gap-1.5 flex-1 h-8 rounded-md text-[11px] font-medium transition-colors justify-center",
                                !scheduleMode
                                  ? "bg-muted text-foreground"
                                  : "text-muted-foreground hover:bg-muted/50"
                              )}
                            >
                              <Send className="w-3 h-3" /> Now
                            </button>
                            <button
                              onClick={() => setScheduleMode(true)}
                              className={cn(
                                "flex items-center gap-1.5 flex-1 h-8 rounded-md text-[11px] font-medium transition-colors justify-center",
                                scheduleMode
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                  : "text-muted-foreground hover:bg-muted/50"
                              )}
                            >
                              <Clock className="w-3 h-3" /> Schedule
                            </button>
                          </div>
                          {scheduleMode && (
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <input
                                type="datetime-local"
                                value={scheduledAt}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                min={new Date().toISOString().slice(0, 16)}
                                className="flex-1 h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 3: Publishing */}
            {step === "publishing" && (
              <div className="space-y-2">
                {targets.map((target) => {
                  const platform = getPlatform(target.platform);
                  return (
                    <div key={target.accountId} className="flex items-center gap-3 p-3 rounded-lg border border-border/40">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                        style={{ backgroundColor: platform?.color || "#666" }}
                      >
                        {platform?.name[0]}
                      </div>
                      <span className="text-[12px] font-medium text-foreground flex-1">{target.accountName}</span>
                      {target.publishStatus === "publishing" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      {target.publishStatus === "success" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {target.publishStatus === "error" && <AlertCircle className="w-4 h-4 text-destructive" />}
                      {target.publishStatus === "idle" && <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/20" />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 4: Results */}
            {step === "results" && (
              <div className="space-y-2">
                {targets.map((target) => {
                  const platform = getPlatform(target.platform);
                  return (
                    <div key={target.accountId} className={cn(
                      "p-3 rounded-lg border",
                      target.publishStatus === "success" ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"
                    )}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                          style={{ backgroundColor: platform?.color || "#666" }}
                        >
                          {platform?.name[0]}
                        </div>
                        <span className="text-[12px] font-medium text-foreground flex-1">{target.accountName}</span>
                        {target.publishStatus === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                      {target.resultMessage && (
                        <p className={cn(
                          "text-[10px] mt-1 ml-7",
                          target.publishStatus === "success" ? "text-green-600/70" : "text-destructive/70"
                        )}>
                          {target.resultMessage}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Newsletter preview panel (right side, configure step only) */}
          {showPreview && step === "configure" && (
            <div className="w-1/2 overflow-y-auto p-4 bg-muted/10">
              <NewsletterPreview
                title={currentDocument.title || "Untitled"}
                previewText={targets[0]?.previewText}
                htmlContent={currentDocument.htmlContent || ""}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border shrink-0">
          {step === "preflight" && (
            <button
              onClick={() => setStep("select")}
              className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Continue to Destinations
            </button>
          )}

          {step === "select" && (
            <button
              onClick={() => setStep("configure")}
              disabled={targets.length === 0}
              className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Configure {targets.length} Destination{targets.length !== 1 ? "s" : ""}
            </button>
          )}

          {step === "configure" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={cn(
                  "h-9 px-4 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                  showPreview
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                {showPreview ? "Hide Preview" : "Preview"}
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing || (scheduleMode && !scheduledAt)}
                className={cn(
                  "flex-1 h-9 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2",
                  scheduleMode
                    ? "bg-amber-500 text-white hover:bg-amber-500/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {scheduleMode ? <Clock className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                {scheduleMode
                  ? `Schedule for ${targets.length} Platform${targets.length !== 1 ? "s" : ""}`
                  : `Publish to ${targets.length} Platform${targets.length !== 1 ? "s" : ""}`
                }
              </button>
            </div>
          )}

          {step === "results" && (
            <button
              onClick={handleClose}
              className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
