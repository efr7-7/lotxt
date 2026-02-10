import { cn } from "@/lib/utils";

interface Props {
  title: string;
  previewText?: string;
  fromName?: string;
  fromEmail?: string;
  htmlContent: string;
}

export function NewsletterPreview({
  title,
  previewText,
  fromName = "Your Newsletter",
  fromEmail = "newsletter@example.com",
  htmlContent,
}: Props) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Email chrome header */}
      <div className="px-4 py-3 border-b border-border/40 bg-muted/30">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
            {fromName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-foreground">{fromName}</span>
              <span className="text-[10px] text-muted-foreground/40">&lt;{fromEmail}&gt;</span>
            </div>
            <span className="text-[10px] text-muted-foreground/40">to me</span>
          </div>
        </div>
        <p className="text-[13px] font-medium text-foreground mt-1">{title || "Untitled"}</p>
        {previewText && (
          <p className="text-[11px] text-muted-foreground/50 mt-0.5 truncate">{previewText}</p>
        )}
      </div>

      {/* Email body */}
      <div className="bg-white dark:bg-zinc-950">
        <div
          className="mx-auto max-w-[580px] px-5 py-6"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {htmlContent ? (
            <div
              className="text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed [&_h1]:text-[22px] [&_h1]:font-bold [&_h1]:text-zinc-900 [&_h1]:dark:text-zinc-100 [&_h1]:mb-4 [&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:text-zinc-800 [&_h2]:dark:text-zinc-200 [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:text-zinc-800 [&_h3]:dark:text-zinc-200 [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:mb-4 [&_p]:leading-[1.7] [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:list-disc [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:list-decimal [&_li]:mb-1 [&_blockquote]:border-l-3 [&_blockquote]:border-zinc-300 [&_blockquote]:dark:border-zinc-600 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-500 [&_blockquote]:dark:text-zinc-400 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-4 [&_hr]:border-zinc-200 [&_hr]:dark:border-zinc-700 [&_hr]:my-6"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          ) : (
            <p className="text-[13px] text-zinc-400 text-center py-8">
              No content to preview
            </p>
          )}
        </div>
      </div>

      {/* Email footer */}
      <div className="px-5 py-3 border-t border-border/30 bg-muted/20 text-center">
        <p className="text-[10px] text-muted-foreground/30">
          Preview only — actual rendering may vary by email client
        </p>
      </div>
    </div>
  );
}
