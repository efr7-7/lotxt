import { useState } from "react";
import { useCalendarStore } from "@/stores/calendar-store";
import { useAccountsStore } from "@/stores/accounts-store";
import { useEditorStore } from "@/stores/editor-store";
import { getPlatform, NEWSLETTER_PLATFORMS } from "@/lib/platforms";
import { X, CalendarDays, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/stores/toast-store";

interface Props {
  onClose: () => void;
  initialDate?: Date;
}

export function ScheduleDialog({ onClose, initialDate }: Props) {
  const { schedulePost } = useCalendarStore();
  const { accounts } = useAccountsStore();
  const { currentDocument } = useEditorStore();

  const newsletterAccounts = accounts.filter(
    (a) => a.isConnected && NEWSLETTER_PLATFORMS.some((p) => p.id === a.platform)
  );

  const defaultDate = initialDate || new Date();
  defaultDate.setHours(defaultDate.getHours() + 1, 0, 0, 0);

  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState(
    defaultDate.toISOString().slice(0, 16)
  );
  const [title, setTitle] = useState(currentDocument.title || "Untitled");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAcc = accounts.find((a) => a.accountId === selectedAccount);

  const handleSchedule = async () => {
    if (!selectedAccount || !selectedAcc) {
      toast.warning("Select a platform account");
      return;
    }
    setIsSubmitting(true);
    try {
      await schedulePost({
        documentId: currentDocument.id,
        platform: selectedAcc.platform,
        accountId: selectedAcc.accountId,
        publicationId: selectedAcc.publications[0]?.id,
        title,
        scheduledAt: new Date(scheduledAt).toISOString(),
      });
      toast.success("Post scheduled!");
      onClose();
    } catch (e) {
      toast.error("Failed to schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-popover border border-border rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Schedule Post</h2>
          </div>
          <button onClick={onClose} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Document info */}
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium text-foreground">{currentDocument.title || "Untitled"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{currentDocument.wordCount} words</p>
          </div>

          {/* Title override */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Date/time picker */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Schedule Date & Time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-[12px] outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Platform selector */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Platform</label>
            <div className="space-y-1.5">
              {newsletterAccounts.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 py-2">No connected accounts. Go to Accounts to add one.</p>
              ) : (
                newsletterAccounts.map((acc) => {
                  const platform = getPlatform(acc.platform);
                  const isSelected = selectedAccount === acc.accountId;
                  return (
                    <button
                      key={acc.accountId}
                      onClick={() => setSelectedAccount(acc.accountId)}
                      className={cn(
                        "flex items-center gap-2 w-full p-2 rounded-lg border transition-colors text-left",
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
                      )}
                    >
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                        style={{ backgroundColor: platform?.color || "#666" }}
                      >
                        {platform?.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-foreground">{acc.accountName}</p>
                        <p className="text-[9px] text-muted-foreground">{platform?.name}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleSchedule}
            disabled={!selectedAccount || isSubmitting}
            className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            Schedule Post
          </button>
        </div>
      </div>
    </div>
  );
}
