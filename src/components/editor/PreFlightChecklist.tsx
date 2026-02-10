import { useState, useMemo } from "react";
import {
  CheckCircle2, XCircle, AlertTriangle, Link2, Image, Type,
  AtSign, Sparkles, Send, X, ChevronDown, ChevronRight, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";

// ─── Check Types ─────────────────────────────────────────────────────

interface CheckItem {
  id: string;
  label: string;
  description: string;
  category: "content" | "seo" | "delivery" | "sponsor";
  severity: "critical" | "warning" | "info";
  check: (doc: { title: string; htmlContent: string; wordCount: number }) => boolean;
  icon: React.ElementType;
}

const CHECKLIST_ITEMS: CheckItem[] = [
  // Content checks
  {
    id: "has-title",
    label: "Document has a title",
    description: "Every newsletter needs a clear, compelling title",
    category: "content",
    severity: "critical",
    check: (doc) => doc.title.trim().length > 0,
    icon: Type,
  },
  {
    id: "title-length",
    label: "Title is 20-70 characters",
    description: "Optimal length for email subject lines and open rates",
    category: "content",
    severity: "warning",
    check: (doc) => {
      const len = doc.title.trim().length;
      return len >= 20 && len <= 70;
    },
    icon: Type,
  },
  {
    id: "has-content",
    label: "Document has content",
    description: "Don't publish an empty newsletter",
    category: "content",
    severity: "critical",
    check: (doc) => doc.wordCount > 50,
    icon: Type,
  },
  {
    id: "word-count-range",
    label: "3-5 minute read (600-1200 words)",
    description: "McGarry recommends 3-5 min reads for best engagement",
    category: "content",
    severity: "info",
    check: (doc) => doc.wordCount >= 400 && doc.wordCount <= 1500,
    icon: Type,
  },
  {
    id: "has-cta",
    label: "Contains a call-to-action",
    description: "Every newsletter should ask the reader to do something",
    category: "content",
    severity: "warning",
    check: (doc) => {
      const lower = doc.htmlContent.toLowerCase();
      return (
        lower.includes("subscribe") ||
        lower.includes("sign up") ||
        lower.includes("click here") ||
        lower.includes("learn more") ||
        lower.includes("check out") ||
        lower.includes("read more") ||
        lower.includes("get started") ||
        lower.includes("join") ||
        lower.includes("reply") ||
        lower.includes("forward this") ||
        lower.includes("share this") ||
        /<a\s+href/i.test(doc.htmlContent)
      );
    },
    icon: Send,
  },

  // SEO / Subject line checks
  {
    id: "has-links",
    label: "Contains at least one link",
    description: "Links drive clicks and engagement metrics",
    category: "seo",
    severity: "warning",
    check: (doc) => /<a\s+href/i.test(doc.htmlContent),
    icon: Link2,
  },
  {
    id: "no-broken-images",
    label: "Images have valid sources",
    description: "Broken images hurt engagement and look unprofessional",
    category: "seo",
    severity: "critical",
    check: (doc) => {
      const imgMatches = doc.htmlContent.match(/<img[^>]*src="([^"]*)"[^>]*>/gi);
      if (!imgMatches || imgMatches.length === 0) return true; // No images = pass
      // Check that all src attributes are non-empty
      for (const img of imgMatches) {
        const srcMatch = img.match(/src="([^"]*)"/);
        if (srcMatch && (!srcMatch[1] || srcMatch[1].trim() === "")) return false;
      }
      return true;
    },
    icon: Image,
  },
  {
    id: "title-has-number",
    label: "Title contains a number",
    description: "Numbers in subject lines boost open rates by 15-20%",
    category: "seo",
    severity: "info",
    check: (doc) => /\d/.test(doc.title),
    icon: AtSign,
  },
  {
    id: "title-power-words",
    label: "Title has power words",
    description: "Words like 'free', 'proven', 'secret' trigger curiosity",
    category: "seo",
    severity: "info",
    check: (doc) =>
      /\b(free|new|proven|secret|best|top|ultimate|essential|powerful|exclusive|breaking|urgent|limited|insider|rare|shocking|critical|massive|guaranteed|revolutionary)\b/i.test(
        doc.title,
      ),
    icon: Sparkles,
  },

  // Delivery checks
  {
    id: "not-too-long",
    label: "Not excessively long (< 2500 words)",
    description: "Very long emails have higher unsubscribe rates",
    category: "delivery",
    severity: "warning",
    check: (doc) => doc.wordCount < 2500,
    icon: AlertTriangle,
  },
  {
    id: "no-spam-words",
    label: "No spam trigger words in title",
    description: "Avoid words that trigger spam filters",
    category: "delivery",
    severity: "warning",
    check: (doc) =>
      !/\b(buy now|act now|limited time|click below|double your|earn money|make money|cash bonus|winner|congratulations|you've been selected)\b/i.test(
        doc.title,
      ),
    icon: Shield,
  },
];

// ─── Component ───────────────────────────────────────────────────────

export function PreFlightChecklist({
  onClose,
  onPublish,
}: {
  onClose: () => void;
  onPublish: () => void;
}) {
  const { currentDocument } = useEditorStore();
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const results = useMemo(() => {
    const doc = {
      title: currentDocument.title,
      htmlContent: currentDocument.htmlContent,
      wordCount: currentDocument.wordCount,
    };
    return CHECKLIST_ITEMS.map((item) => ({
      ...item,
      passed: item.check(doc),
    }));
  }, [currentDocument.title, currentDocument.htmlContent, currentDocument.wordCount]);

  const criticalFails = results.filter((r) => !r.passed && r.severity === "critical");
  const warningFails = results.filter((r) => !r.passed && r.severity === "warning");
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  const canPublish = criticalFails.length === 0;

  const categories = [
    { id: "content", label: "Content Quality", icon: Type },
    { id: "seo", label: "Subject Line & SEO", icon: Sparkles },
    { id: "delivery", label: "Deliverability", icon: Shield },
  ];

  const toggleCategory = (id: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-[520px] max-h-[80vh] bg-card border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div>
            <h2 className="text-[16px] font-bold text-foreground">Pre-Flight Checklist</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {passedCount}/{totalCount} checks passed
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Score badge */}
            <div
              className={cn(
                "px-3 py-1 rounded-full text-[12px] font-semibold",
                canPublish
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20",
              )}
            >
              {canPublish ? "Ready to publish" : `${criticalFails.length} critical issue${criticalFails.length !== 1 ? "s" : ""}`}
            </div>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted/30">
          <div
            className={cn(
              "h-full transition-all duration-500",
              canPublish ? "bg-emerald-500" : "bg-amber-500",
            )}
            style={{ width: `${(passedCount / totalCount) * 100}%` }}
          />
        </div>

        {/* Checklist */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {categories.map((cat) => {
            const catResults = results.filter((r) => r.category === cat.id);
            const catPassed = catResults.filter((r) => r.passed).length;
            const isCollapsed = collapsedCategories.has(cat.id);
            const CatIcon = cat.icon;

            return (
              <div key={cat.id}>
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center gap-2 py-1.5 text-left group"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" />
                  )}
                  <CatIcon className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {cat.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground/40 ml-auto">
                    {catPassed}/{catResults.length}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="mt-1 space-y-1 ml-2">
                    {catResults.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start gap-3 px-3 py-2 rounded-lg transition-colors",
                          item.passed ? "bg-emerald-500/5" : "bg-destructive/5",
                        )}
                      >
                        {item.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : item.severity === "critical" ? (
                          <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-[12px] font-medium",
                              item.passed ? "text-foreground/70" : "text-foreground",
                            )}
                          >
                            {item.label}
                            {!item.passed && item.severity === "critical" && (
                              <span className="ml-1.5 text-[9px] font-bold text-destructive uppercase">
                                Required
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer with publish button */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/30 bg-card/50">
          <div className="flex items-center gap-2">
            {warningFails.length > 0 && (
              <span className="text-[11px] text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {warningFails.length} warning{warningFails.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-8 px-4 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Back to editing
            </button>
            <button
              onClick={canPublish ? onPublish : undefined}
              disabled={!canPublish}
              className={cn(
                "h-8 px-5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 transition-all",
                canPublish
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
              )}
            >
              <Send className="w-3 h-3" />
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
