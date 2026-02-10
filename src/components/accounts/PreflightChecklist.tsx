import { useMemo } from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreflightCheck {
  label: string;
  status: "pass" | "warn" | "fail";
  detail?: string;
}

interface PreflightProps {
  title: string;
  htmlContent: string;
  wordCount: number;
  hasSubjectLine?: boolean;
  hasPreviewText?: boolean;
}

function runChecks({
  title,
  htmlContent,
  wordCount,
  hasSubjectLine,
  hasPreviewText,
}: PreflightProps): PreflightCheck[] {
  const checks: PreflightCheck[] = [];

  // Title present
  checks.push({
    label: "Title present",
    status: title.trim().length > 0 ? "pass" : "fail",
    detail: title.trim().length > 0 ? `"${title.slice(0, 50)}${title.length > 50 ? "..." : ""}"` : "Add a title before publishing",
  });

  // Content length
  if (wordCount >= 100) {
    checks.push({ label: "Content length", status: "pass", detail: `${wordCount} words` });
  } else if (wordCount >= 30) {
    checks.push({ label: "Content length", status: "warn", detail: `Only ${wordCount} words — consider adding more` });
  } else {
    checks.push({ label: "Content length", status: "fail", detail: `${wordCount} words — too short for a newsletter` });
  }

  // Images have alt text
  const imgRegex = /<img[^>]*>/gi;
  const images = htmlContent.match(imgRegex) || [];
  if (images.length > 0) {
    const withoutAlt = images.filter((img) => !img.includes('alt=') || /alt=["']\s*["']/i.test(img));
    if (withoutAlt.length === 0) {
      checks.push({ label: "Image alt text", status: "pass", detail: `All ${images.length} images have alt text` });
    } else {
      checks.push({ label: "Image alt text", status: "warn", detail: `${withoutAlt.length} of ${images.length} images missing alt text` });
    }
  } else {
    checks.push({ label: "Images", status: "pass", detail: "No images (text-only)" });
  }

  // Broken links (href="#")
  const brokenLinks = (htmlContent.match(/href=["']#["']/gi) || []).length;
  if (brokenLinks > 0) {
    checks.push({ label: "Links check", status: "warn", detail: `${brokenLinks} link(s) point to "#"` });
  } else {
    const linkCount = (htmlContent.match(/href=/gi) || []).length;
    checks.push({ label: "Links check", status: "pass", detail: linkCount > 0 ? `${linkCount} links found` : "No links" });
  }

  // Subject line
  if (hasSubjectLine !== undefined) {
    checks.push({
      label: "Subject line",
      status: hasSubjectLine ? "pass" : "warn",
      detail: hasSubjectLine ? "Set" : "Consider setting a custom subject line",
    });
  }

  // Preview text
  if (hasPreviewText !== undefined) {
    checks.push({
      label: "Preview text",
      status: hasPreviewText ? "pass" : "warn",
      detail: hasPreviewText ? "Set" : "Preview text improves open rates",
    });
  }

  return checks;
}

const STATUS_ICONS = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle,
};

const STATUS_COLORS = {
  pass: "text-emerald-400",
  warn: "text-amber-400",
  fail: "text-red-400",
};

export function PreflightChecklist(props: PreflightProps) {
  const checks = useMemo(() => runChecks(props), [props.title, props.htmlContent, props.wordCount, props.hasSubjectLine, props.hasPreviewText]);

  const allPass = checks.every((c) => c.status === "pass");
  const hasFailures = checks.some((c) => c.status === "fail");

  return (
    <div className="space-y-3">
      {/* Status banner */}
      <div className={cn(
        "px-3 py-2 rounded-lg text-[12px] font-medium flex items-center gap-2",
        allPass ? "bg-emerald-500/10 text-emerald-400" :
        hasFailures ? "bg-red-500/10 text-red-400" :
        "bg-amber-500/10 text-amber-400",
      )}>
        {allPass ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            All clear! Ready to publish.
          </>
        ) : hasFailures ? (
          <>
            <XCircle className="w-4 h-4" />
            Some checks failed — fix before publishing.
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4" />
            Looks good, but there are some suggestions.
          </>
        )}
      </div>

      {/* Check list */}
      <div className="space-y-1">
        {checks.map((check, i) => {
          const Icon = STATUS_ICONS[check.status];
          return (
            <div key={i} className="flex items-start gap-2.5 py-1.5 px-1">
              <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", STATUS_COLORS[check.status])} />
              <div className="flex-1 min-w-0">
                <span className="text-[12px] text-foreground/80 font-medium block">{check.label}</span>
                {check.detail && (
                  <span className="text-[10px] text-muted-foreground/40">{check.detail}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
