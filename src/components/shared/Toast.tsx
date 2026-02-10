import { useState, useEffect } from "react";
import { useToastStore, type ToastVariant } from "@/stores/toast-store";
import { Check, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <Check className="w-3.5 h-3.5" />,
  error: <AlertCircle className="w-3.5 h-3.5" />,
  info: <Info className="w-3.5 h-3.5" />,
  warning: <AlertTriangle className="w-3.5 h-3.5" />,
};

const ringStyles: Record<ToastVariant, string> = {
  success: "bg-emerald-500/15 text-emerald-500",
  error: "bg-red-500/15 text-red-500",
  info: "bg-blue-500/15 text-blue-500",
  warning: "bg-amber-500/15 text-amber-500",
};

const progressColors: Record<ToastVariant, string> = {
  success: "bg-emerald-500/40",
  error: "bg-red-500/40",
  info: "bg-blue-500/40",
  warning: "bg-amber-500/40",
};

/* ─── Individual Toast ─── */
function ToastItem({ id, variant, message, createdAt }: { id: string; variant: ToastVariant; message: string; createdAt: number }) {
  const { removeToast } = useToastStore();
  const [entering, setEntering] = useState(true);
  const [exiting, setExiting] = useState(false);
  const DURATION = 4000; // 4s display time

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntering(false));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => removeToast(id), 200);
  };

  // Auto-dismiss with progress
  useEffect(() => {
    const timer = setTimeout(handleDismiss, DURATION);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-auto relative overflow-hidden flex items-center gap-3 pl-3.5 pr-2 py-3 rounded-2xl border border-border/40",
        "bg-popover/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]",
        "dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)]",
        "transition-all duration-200",
        entering && "opacity-0 translate-y-2 scale-95",
        !entering && !exiting && "opacity-100 translate-y-0 scale-100",
        exiting && "opacity-0 translate-y-1 scale-95",
      )}
      style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      {/* Icon ring */}
      <div className={cn("shrink-0 w-7 h-7 rounded-full flex items-center justify-center", ringStyles[variant])}>
        {icons[variant]}
      </div>

      {/* Message */}
      <span className="flex-1 text-[13px] font-medium text-foreground/90 pr-1 leading-snug">{message}</span>

      {/* Close */}
      <button
        onClick={handleDismiss}
        className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground/30 hover:text-foreground/60 hover:bg-muted/50 transition-all"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-border/20">
        <div
          className={cn("h-full rounded-full", progressColors[variant])}
          style={{
            animation: `toast-progress ${DURATION}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <>
      {/* Inline keyframes for progress bar */}
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none max-w-[380px] w-full">
        {toasts.map((t) => (
          <ToastItem key={t.id} id={t.id} variant={t.variant} message={t.message} createdAt={Date.now()} />
        ))}
      </div>
    </>
  );
}
