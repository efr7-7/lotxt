import { useToastStore, type ToastVariant } from "@/stores/toast-store";
import { Check, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <Check className="w-3.5 h-3.5" />,
  error: <AlertCircle className="w-3.5 h-3.5" />,
  info: <Info className="w-3.5 h-3.5" />,
  warning: <AlertTriangle className="w-3.5 h-3.5" />,
};

const styles: Record<ToastVariant, string> = {
  success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  error: "bg-destructive/10 border-destructive/20 text-destructive",
  info: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  warning: "bg-amber-500/10 border-amber-500/20 text-amber-400",
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-center gap-2.5 pl-3.5 pr-2 py-2.5 rounded-xl border shadow-lg backdrop-blur-md text-[13px] font-medium",
            "animate-in fade-in slide-in-from-bottom-2 duration-200",
            styles[t.variant],
          )}
        >
          {icons[t.variant]}
          <span className="flex-1 pr-1">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
