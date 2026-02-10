import { useState, useRef, useEffect } from "react";
import { useAiStore } from "@/stores/ai-store";
import { AI_PROVIDERS, type AiProviderId } from "@/types/ai";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, Zap, AlertCircle } from "lucide-react";

// SVG company logos as inline components for crisp rendering
function ClaudeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M16.1 11.3c-.2-.6-.5-.8-1-.8s-1 .3-1.5.7l-2 1.7c-.8.7-1.5 1-2.3 1-1.4 0-2.4-1.1-2.4-2.8 0-2.2 1.4-4.6 4-4.6 1.4 0 2.3.7 2.8 1.8l1.5-.8C14.3 5.8 13 4.8 11 4.8c-3.5 0-5.8 3-5.8 6.3 0 2.6 1.6 4.4 4 4.4 1.3 0 2.4-.5 3.4-1.4l2-1.7c.3-.3.5-.4.7-.4s.3.1.4.3l1-1.6-.6.6z"/>
    </svg>
  );
}

function OpenAILogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M22.2 14.3c.5-1.5.3-3.1-.5-4.4A5.2 5.2 0 0 0 16 6.7a5.2 5.2 0 0 0-4.9-2 5.2 5.2 0 0 0-4.6 2.4 5.2 5.2 0 0 0-3.4 2.6 5.2 5.2 0 0 0 .7 5.7 5.2 5.2 0 0 0 .5 4.4 5.2 5.2 0 0 0 5.7 3.2 5.2 5.2 0 0 0 3.7 1.6 5.2 5.2 0 0 0 5-3.6 5.2 5.2 0 0 0 3.4-2.5 5.2 5.2 0 0 0-.7-5.7zM12.7 22c-.8.3-1.7.2-2.4-.2l.1-.1 3.6-2.1c.2-.1.3-.3.3-.5v-5.1l1.5.9v4.2a3.4 3.4 0 0 1-3.1 2.8z"/>
    </svg>
  );
}

function GeminiLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2zm0 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-3.5 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-3.5 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
    </svg>
  );
}

// Provider icon component mapping
function ProviderIcon({ providerId, size = 14 }: { providerId: string; size?: number }) {
  const config = AI_PROVIDERS.find((p) => p.id === providerId);
  const style = { color: config?.color || "#888" };

  return (
    <div
      className="rounded flex items-center justify-center shrink-0"
      style={{ width: size + 4, height: size + 4, backgroundColor: `${config?.color || "#888"}15` }}
    >
      <span className="text-[10px] font-black" style={style}>
        {providerId === "claude" ? "A" : providerId === "openai" ? "O" : providerId === "gemini" ? "G" : "R"}
      </span>
    </div>
  );
}

interface Props {
  compact?: boolean; // True for inline toolbar usage
  className?: string;
}

export function AiProviderDropdown({ compact = false, className }: Props) {
  const { providers, activeProviderId, setActiveProvider, loadProviders } = useAiStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (providers.length === 0) loadProviders();
  }, [providers.length, loadProviders]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const active = providers.find((p) => p.id === activeProviderId);
  const activeConfig = active ? AI_PROVIDERS.find((c) => c.id === active.id) : null;

  if (providers.length === 0) {
    return (
      <div className={cn("flex items-center gap-1.5 text-[10px] text-muted-foreground/50", className)}>
        <AlertCircle className="w-3 h-3" />
        <span>No AI provider</span>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 rounded-md transition-colors",
          compact
            ? "h-6 px-2 text-[10px] hover:bg-accent/60"
            : "h-7 px-2.5 text-[11px] border border-border/40 hover:bg-accent/50",
          "font-medium text-muted-foreground hover:text-foreground"
        )}
      >
        {activeConfig && <ProviderIcon providerId={activeConfig.id} size={compact ? 10 : 12} />}
        <span className="truncate max-w-[100px]">
          {active?.model || activeConfig?.label || "Select"}
        </span>
        <ChevronDown className={cn("w-2.5 h-2.5 opacity-40 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-56 bg-popover/95 backdrop-blur-lg border border-border/50 rounded-lg shadow-xl overflow-hidden py-1">
          {providers.map((provider) => {
            const config = AI_PROVIDERS.find((c) => c.id === provider.id);
            const isActive = provider.id === activeProviderId;
            return (
              <button
                key={provider.id}
                onClick={() => {
                  setActiveProvider(provider.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors",
                  isActive ? "bg-primary/8" : "hover:bg-accent/60"
                )}
              >
                <ProviderIcon providerId={provider.id} size={14} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-foreground truncate">{config?.label}</p>
                  <p className="text-[10px] text-muted-foreground/50 truncate">{provider.model}</p>
                </div>
                {isActive && (
                  <div className="flex items-center gap-0.5 text-primary">
                    <Zap className="w-2.5 h-2.5" />
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
