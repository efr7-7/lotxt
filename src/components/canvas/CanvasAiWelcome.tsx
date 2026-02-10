import { useState, useEffect } from "react";
import { useAiStore, DEFAULT_MODELS, type AiProviderId } from "@/stores/ai-store";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  X,
  Palette,
  LayoutGrid,
  Type,
  Lightbulb,
  Zap,
  ArrowRight,
  Keyboard,
  ChevronDown,
  Key,
  Loader2,
  Check,
} from "lucide-react";

interface CanvasAiWelcomeProps {
  onAccept: () => void;
  onDismiss: () => void;
}

const PROVIDER_OPTIONS: { id: AiProviderId; label: string; color: string }[] = [
  { id: "claude", label: "Claude", color: "#D97706" },
  { id: "openai", label: "ChatGPT", color: "#10B981" },
  { id: "gemini", label: "Gemini", color: "#3B82F6" },
  { id: "openrouter", label: "OpenRouter", color: "#8B5CF6" },
];

export function CanvasAiWelcome({ onAccept, onDismiss }: CanvasAiWelcomeProps) {
  const { activeProviderId, providers, saveProvider, setActiveProvider, loadProviders } = useAiStore();
  const hasProvider = activeProviderId && providers.length > 0;
  const [isVisible, setIsVisible] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AiProviderId>("claude");
  const [apiKey, setApiKey] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [justConnected, setJustConnected] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 200);
  };

  const handleAccept = () => {
    setIsVisible(false);
    setTimeout(onAccept, 200);
  };

  const handleConnect = async () => {
    if (!apiKey.trim()) return;
    setIsConnecting(true);
    setConnectError(null);

    const defaults = DEFAULT_MODELS[selectedProvider];
    try {
      await saveProvider({
        id: selectedProvider,
        name: defaults.name,
        api_key: apiKey.trim(),
        model: defaults.model,
        base_url: defaults.base_url,
        is_active: true,
      });
      setActiveProvider(selectedProvider);
      await loadProviders();
      setJustConnected(true);
      setIsConnecting(false);
      // Auto-enable agent after short delay
      setTimeout(() => {
        handleAccept();
      }, 800);
    } catch (e) {
      setConnectError("Failed to save. Make sure you're running the native app.");
      setIsConnecting(false);
    }
  };

  const features = [
    {
      icon: LayoutGrid,
      label: "Layout suggestions",
      description: "AI arranges your elements for maximum impact",
    },
    {
      icon: Palette,
      label: "Color palettes",
      description: "Generate harmonious color schemes instantly",
    },
    {
      icon: Type,
      label: "Copy generation",
      description: "Write punchy headlines and body text",
    },
    {
      icon: Lightbulb,
      label: "Design critique",
      description: "Get actionable feedback on your designs",
    },
  ];

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center transition-all duration-200",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Dialog */}
      <div
        className={cn(
          "relative w-[460px] max-h-[90vh] overflow-y-auto rounded-2xl border border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/30 transition-all duration-300",
          isVisible
            ? "translate-y-0 scale-100"
            : "translate-y-4 scale-95"
        )}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent/50 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-purple-500/20 border border-violet-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground tracking-tight">
                Design Agent
              </h2>
              <p className="text-[12px] text-muted-foreground/50">
                AI-powered design assistant
              </p>
            </div>
          </div>

          <p className="text-[13px] text-muted-foreground/60 leading-relaxed">
            Your AI design partner can help you create stunning visuals, suggest
            layouts, generate copy, and critique your work — all in real time.
          </p>
        </div>

        {/* Feature grid */}
        <div className="px-8 pb-5 grid grid-cols-2 gap-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.label}
                className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-accent/20 border border-border/20"
              >
                <Icon className="w-4 h-4 text-violet-400/60 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-medium text-foreground/80">
                    {feature.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground/40 leading-snug">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Inline Quick Connect — shown when no provider */}
        {!hasProvider && !justConnected && (
          <div className="px-8 pb-5">
            <button
              onClick={() => setShowConnect(!showConnect)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 border border-violet-500/15 hover:border-violet-500/30 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Key className="w-4 h-4 text-violet-400/60" />
                <span className="text-[13px] font-medium text-foreground/80">
                  Quick connect an AI provider
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground/40 transition-transform duration-200",
                  showConnect && "rotate-180"
                )}
              />
            </button>

            {showConnect && (
              <div className="mt-3 space-y-3">
                {/* Provider selector */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.1em] mb-1.5 block">
                    Provider
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PROVIDER_OPTIONS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProvider(p.id)}
                        className={cn(
                          "py-2 rounded-lg text-[11px] font-medium transition-all border",
                          selectedProvider === p.id
                            ? "bg-violet-500/10 border-violet-500/30 text-violet-300"
                            : "bg-accent/30 border-border/20 text-muted-foreground/50 hover:border-border/40"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* API Key input */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.1em] mb-1.5 block">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={selectedProvider === "claude" ? "sk-ant-..." : selectedProvider === "openai" ? "sk-..." : "Enter your API key"}
                    className="w-full h-9 px-3 rounded-lg bg-accent/30 border border-border/30 text-[13px] text-foreground placeholder:text-muted-foreground/25 outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-colors"
                    onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                  />
                </div>

                {/* Model info */}
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/35">
                  <Zap className="w-3 h-3" />
                  Default model: {DEFAULT_MODELS[selectedProvider].model}
                </div>

                {/* Error */}
                {connectError && (
                  <p className="text-[11px] text-destructive/70">{connectError}</p>
                )}

                {/* Connect button */}
                <button
                  onClick={handleConnect}
                  disabled={!apiKey.trim() || isConnecting}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium transition-all",
                    apiKey.trim() && !isConnecting
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/20"
                      : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                  )}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Connect & Enable Agent
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Just connected success */}
        {justConnected && (
          <div className="px-8 pb-5">
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-[13px] font-medium text-emerald-400">
                Connected! Launching agent...
              </span>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <button
            onClick={handleDismiss}
            className="px-4 py-2 rounded-lg text-[12px] text-muted-foreground/50 hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            Not now
          </button>

          <div className="flex items-center gap-2">
            {/* Shortcut hint */}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/30">
              <Keyboard className="w-3 h-3" />
              <span>Ctrl+J</span>
            </div>

            {hasProvider && !justConnected && (
              <button
                onClick={handleAccept}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/20 transition-all duration-200"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Enable Agent
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
