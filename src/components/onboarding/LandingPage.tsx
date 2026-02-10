import { useState, useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  NEWSLETTER_PLATFORMS,
  SOCIAL_PLATFORMS,
  PLATFORMS,
  type PlatformId,
  type PlatformDef,
} from "@/lib/platforms";
import { AI_PROVIDERS, type AiProviderId } from "@/types/ai";
import { useAccountsStore } from "@/stores/accounts-store";
import { useAiStore } from "@/stores/ai-store";
import { cn } from "@/lib/utils";
import {
  Minus,
  Square,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  ChevronDown,
  Pen,
  Palette,
  Send,
  BarChart3,
  Eye,
  Share2,
  Sparkles,
  Key,
  Zap,
  Rocket,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   Station Onboarding — Polished, Adobe/Spotify-tier
   ═══════════════════════════════════════════════════════ */

interface LandingPageProps {
  onComplete: () => void;
}

type ConnectionStatus = "idle" | "connecting" | "connected" | "error";
type OnboardingStep = "hero" | "newsletters" | "socials" | "ai" | "ready";

const STEPS: OnboardingStep[] = ["hero", "newsletters", "socials", "ai", "ready"];

const STAMPS = [
  { label: "Write", icon: Pen, color: "#FF6B6B", rotation: -8, x: 6, y: 22 },
  { label: "Design", icon: Palette, color: "#4ECDC4", rotation: 6, x: 86, y: 15 },
  { label: "Publish", icon: Send, color: "#FBBF24", rotation: -5, x: 4, y: 62 },
  { label: "Analyze", icon: BarChart3, color: "#A78BFA", rotation: 8, x: 90, y: 58 },
  { label: "Preview", icon: Eye, color: "#67E8F9", rotation: -10, x: 10, y: 42 },
  { label: "Share", icon: Share2, color: "#FB923C", rotation: 12, x: 82, y: 38 },
] as const;

const PLATFORM_TAGLINES: Partial<Record<PlatformId, string>> = {
  beehiiv: "Scale your newsletter with growth tools",
  substack: "Publish your writing to subscribers",
  kit: "Grow and monetize your email list",
  ghost: "Open-source professional publishing",
  twitter: "Share posts & threads to followers",
  linkedin: "Publish articles to your network",
};

/* ═══ Main Component ═══ */
export default function LandingPage({ onComplete }: LandingPageProps) {
  const { addAccount } = useAccountsStore();
  const { saveProvider } = useAiStore();

  const [step, setStep] = useState<OnboardingStep>("hero");
  const [mounted, setMounted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, ConnectionStatus>>(() => {
    const s: Record<string, ConnectionStatus> = {};
    PLATFORMS.forEach((p) => { s[p.id] = "idle"; });
    return s;
  });

  const [aiExpandedId, setAiExpandedId] = useState<string | null>(null);
  const [aiFields, setAiFields] = useState<Record<string, string>>({});
  const [aiStatuses, setAiStatuses] = useState<Record<string, ConnectionStatus>>(() => {
    const s: Record<string, ConnectionStatus> = {};
    AI_PROVIDERS.forEach((p) => { s[p.id] = "idle"; });
    return s;
  });

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const stepIndex = STEPS.indexOf(step);
  const progressPercent = (stepIndex / (STEPS.length - 1)) * 100;

  const handleMinimize = () => getCurrentWindow().minimize();
  const handleMaximize = () => getCurrentWindow().toggleMaximize();
  const handleClose = () => getCurrentWindow().close();

  const goToStep = useCallback((newStep: OnboardingStep) => {
    setTransitioning(true);
    setTimeout(() => {
      setStep(newStep);
      setExpandedPlatform(null);
      setAiExpandedId(null);
      setFields({});
      setErrors({});
      setAiFields({});
      setTimeout(() => setTransitioning(false), 50);
    }, 180);
  }, []);

  const goNext = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) goToStep(STEPS[idx + 1]);
  }, [step, goToStep]);

  const goBack = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) goToStep(STEPS[idx - 1]);
  }, [step, goToStep]);

  const handleExpand = (id: string) => {
    if (statuses[id] === "connected") return;
    setExpandedPlatform(expandedPlatform === id ? null : id);
    setFields({});
    setErrors({});
  };

  const handleConnect = async (platform: PlatformDef) => {
    setStatuses((prev) => ({ ...prev, [platform.id]: "connecting" }));
    setErrors({});
    try {
      await addAccount(platform.id, fields);
      setStatuses((prev) => ({ ...prev, [platform.id]: "connected" }));
      setExpandedPlatform(null);
      setFields({});
    } catch (e) {
      setStatuses((prev) => ({ ...prev, [platform.id]: "error" }));
      setErrors({ _global: String(e) });
    }
  };

  const handleAiExpand = (id: string) => {
    if (aiStatuses[id] === "connected") return;
    setAiExpandedId(aiExpandedId === id ? null : id);
    const config = AI_PROVIDERS.find((p) => p.id === id);
    setAiFields({ api_key: "", model: config?.defaultModel || "" });
  };

  const handleAiConnect = async (providerId: AiProviderId) => {
    const config = AI_PROVIDERS.find((p) => p.id === providerId);
    if (!config || !aiFields.api_key?.trim()) return;
    setAiStatuses((prev) => ({ ...prev, [providerId]: "connecting" }));
    try {
      await saveProvider({
        id: providerId,
        name: config.label,
        api_key: aiFields.api_key.trim(),
        model: aiFields.model || config.defaultModel,
        base_url: "",
        is_active: true,
      });
      setAiStatuses((prev) => ({ ...prev, [providerId]: "connected" }));
      setAiExpandedId(null);
      setAiFields({});
    } catch (e) {
      setAiStatuses((prev) => ({ ...prev, [providerId]: "error" }));
    }
  };

  const connectedPlatforms = Object.entries(statuses).filter(([, s]) => s === "connected");
  const connectedAi = Object.entries(aiStatuses).filter(([, s]) => s === "connected");
  const hasAnyPlatform = connectedPlatforms.length > 0;
  const hasAiProvider = connectedAi.length > 0;

  return (
    <div className="dark relative h-screen w-full overflow-hidden flex flex-col" style={{ background: "#09090b" }}>
      <style>{`
        @keyframes ob-float {
          0%, 100% { transform: translateY(0) rotate(var(--rot, 0deg)); }
          50% { transform: translateY(-8px) rotate(calc(var(--rot, 0deg) + 2deg)); }
        }
        @keyframes ob-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ob-scale-in {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes ob-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.65; }
        }
        @keyframes ob-ring-rotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes ob-shimmer {
          from { background-position: -200% center; }
          to { background-position: 200% center; }
        }
        .ob-fade-up { animation: ob-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .ob-scale-in { animation: ob-scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .font-editorial { font-family: 'Playfair Display', 'Georgia', serif; }
        .step-t { transition: opacity 0.18s ease, transform 0.18s ease; }
        .step-off { opacity: 0; transform: translateY(6px); pointer-events: none; }
        .step-on { opacity: 1; transform: translateY(0); }
      `}</style>

      {/* ═══ Title Bar ═══ */}
      <div
        data-tauri-drag-region
        className="sticky top-0 z-50 h-10 flex items-center justify-between shrink-0"
        style={{ background: "rgba(9,9,11,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center gap-3 pl-4" data-tauri-drag-region>
          <span className="text-[11px] font-semibold text-white/25 tracking-[0.08em]" data-tauri-drag-region>
            Station
          </span>
          {step !== "hero" && (
            <div className="flex items-center gap-1.5 ml-2">
              {STEPS.slice(1).map((s, i) => {
                const isCurrent = s === step;
                const isDone = STEPS.indexOf(s) < STEPS.indexOf(step);
                return (
                  <div
                    key={s}
                    className="h-[3px] rounded-full transition-all duration-500"
                    style={{
                      width: isCurrent ? 24 : isDone ? 18 : 12,
                      background: isCurrent ? "rgba(255,255,255,0.6)" : isDone ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)",
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
        <div className="flex-1" data-tauri-drag-region />
        <div className="flex items-center h-full">
          <button onClick={handleMinimize} className="h-full w-[46px] flex items-center justify-center hover:bg-white/[0.05] transition-colors" tabIndex={-1}>
            <Minus className="w-3.5 h-3.5 text-white/25" strokeWidth={1.5} />
          </button>
          <button onClick={handleMaximize} className="h-full w-[46px] flex items-center justify-center hover:bg-white/[0.05] transition-colors" tabIndex={-1}>
            <Square className="w-[10px] h-[10px] text-white/25" strokeWidth={1.5} />
          </button>
          <button onClick={handleClose} className="h-full w-[46px] flex items-center justify-center hover:bg-[#c42b1c] transition-colors group" tabIndex={-1}>
            <X className="w-3.5 h-3.5 text-white/25 group-hover:text-white" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ═══ Content ═══ */}
      <div className="flex-1 overflow-hidden relative">

        {/* Ambient background glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute left-1/2 top-[38%] w-[600px] h-[600px] rounded-full"
            style={{
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.02) 50%, transparent 70%)",
              animation: "ob-glow 6s ease-in-out infinite",
            }}
          />
          <div
            className="absolute left-[30%] top-[60%] w-[400px] h-[400px] rounded-full"
            style={{
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(ellipse, rgba(251,191,36,0.04) 0%, transparent 60%)",
              animation: "ob-glow 8s ease-in-out 2s infinite",
            }}
          />
        </div>

        {/* ═══ HERO ═══ */}
        <div className={cn("absolute inset-0 flex flex-col items-center justify-center px-6 step-t", step === "hero" && !transitioning ? "step-on" : "step-off")}>
          {/* Floating stamps */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {STAMPS.map((stamp, i) => {
              const Icon = stamp.icon;
              return (
                <div
                  key={stamp.label}
                  className={cn("absolute", mounted ? "ob-scale-in" : "opacity-0")}
                  style={{
                    left: `${stamp.x}%`, top: `${stamp.y}%`,
                    "--rot": `${stamp.rotation}deg`,
                    animationDelay: `${0.4 + i * 0.08}s`,
                    animation: mounted
                      ? `ob-scale-in 0.5s cubic-bezier(0.16,1,0.3,1) ${0.4 + i * 0.08}s both, ob-float ${5 + i * 0.7}s ease-in-out ${1.2 + i * 0.15}s infinite`
                      : "none",
                  } as React.CSSProperties}
                >
                  <div
                    className="rounded-2xl flex flex-col items-center justify-center gap-2 backdrop-blur-sm"
                    style={{
                      width: 76, height: 92,
                      background: `linear-gradient(135deg, ${stamp.color}15, ${stamp.color}08)`,
                      border: `1px solid ${stamp.color}20`,
                      boxShadow: `0 4px 24px ${stamp.color}10, inset 0 1px 0 ${stamp.color}10`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: `${stamp.color}CC` }} strokeWidth={1.5} />
                    <span className="text-[8px] font-bold uppercase tracking-[0.18em]" style={{ color: `${stamp.color}80` }}>
                      {stamp.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rotating ring behind wordmark */}
          <div className="absolute left-1/2 top-[44%] w-[320px] h-[320px] pointer-events-none" aria-hidden="true">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: "1px solid transparent",
                borderTopColor: "rgba(139,92,246,0.15)",
                borderRightColor: "rgba(139,92,246,0.08)",
                animation: "ob-ring-rotate 20s linear infinite",
                left: "50%", top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>

          {/* Central content */}
          <div className="relative z-10 text-center">
            <h1
              className={cn("font-editorial font-bold text-white leading-[0.88] tracking-[-0.03em] mb-6", mounted ? "ob-fade-up" : "opacity-0")}
              style={{ fontSize: "clamp(72px, 12vw, 140px)", animationDelay: "0.15s" }}
            >
              Station
            </h1>
            <p
              className={cn("font-editorial italic text-white/50 text-[clamp(18px, 2.5vw, 28px)] mb-3", mounted ? "ob-fade-up" : "opacity-0")}
              style={{ animationDelay: "0.3s" }}
            >
              Where publishers create.
            </p>
            <p
              className={cn("text-[14px] text-white/30 max-w-[420px] mx-auto leading-relaxed mb-12", mounted ? "ob-fade-up" : "opacity-0")}
              style={{ animationDelay: "0.45s" }}
            >
              Write, design, preview, and publish your newsletter — everywhere at once.
            </p>
            <div className={cn(mounted ? "ob-fade-up" : "opacity-0")} style={{ animationDelay: "0.6s" }}>
              <button
                onClick={() => goToStep("newsletters")}
                className="group inline-flex items-center gap-3 h-[52px] px-9 rounded-full bg-white text-[#09090b] text-[15px] font-semibold hover:bg-white/95 transition-all duration-200"
                style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 4px 32px rgba(255,255,255,0.08), 0 1px 3px rgba(0,0,0,0.3)" }}
              >
                Get Started
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ═══ NEWSLETTERS ═══ */}
        <div className={cn("absolute inset-0 flex flex-col items-center justify-center px-6 step-t", step === "newsletters" && !transitioning ? "step-on" : "step-off")}>
          <div className="w-full max-w-[500px]">
            <StepHeader step={1} total={3} title="Where do you publish?" subtitle="Connect your newsletter platforms. You can add more later." />

            <div className="space-y-2.5 mt-8">
              {NEWSLETTER_PLATFORMS.map((platform) => (
                <PlatformRow
                  key={platform.id}
                  platform={platform}
                  status={statuses[platform.id] || "idle"}
                  isExpanded={expandedPlatform === platform.id}
                  fields={fields}
                  errors={errors}
                  onExpand={() => handleExpand(platform.id)}
                  onFieldChange={(k, v) => setFields((f) => ({ ...f, [k]: v }))}
                  onConnect={() => handleConnect(platform)}
                />
              ))}
            </div>

            <StepNav
              onBack={goBack}
              onNext={goNext}
              nextLabel={hasAnyPlatform ? "Continue" : "Skip for now"}
            />
          </div>
        </div>

        {/* ═══ SOCIALS ═══ */}
        <div className={cn("absolute inset-0 flex flex-col items-center justify-center px-6 step-t", step === "socials" && !transitioning ? "step-on" : "step-off")}>
          <div className="w-full max-w-[500px]">
            <StepHeader step={2} total={3} title="Where do you share?" subtitle="Connect social accounts for one-click distribution." />

            <div className="space-y-2.5 mt-8">
              {SOCIAL_PLATFORMS.map((platform) => (
                <PlatformRow
                  key={platform.id}
                  platform={platform}
                  status={statuses[platform.id] || "idle"}
                  isExpanded={expandedPlatform === platform.id}
                  fields={fields}
                  errors={errors}
                  onExpand={() => handleExpand(platform.id)}
                  onFieldChange={(k, v) => setFields((f) => ({ ...f, [k]: v }))}
                  onConnect={() => handleConnect(platform)}
                />
              ))}
            </div>

            <StepNav onBack={goBack} onNext={goNext} nextLabel="Continue" />
          </div>
        </div>

        {/* ═══ AI PROVIDERS ═══ */}
        <div className={cn("absolute inset-0 flex flex-col items-center justify-center px-6 step-t", step === "ai" && !transitioning ? "step-on" : "step-off")}>
          <div className="w-full max-w-[500px]">
            <StepHeader
              step={3} total={3}
              title="Supercharge with AI"
              subtitle="Plug in any AI — it writes, edits, and auto-adapts your content for every platform."
            />

            <div className="space-y-2.5 mt-8">
              {AI_PROVIDERS.map((provider) => {
                const status = aiStatuses[provider.id] || "idle";
                const isExpanded = aiExpandedId === provider.id;
                const isConnected = status === "connected";

                return (
                  <div key={provider.id} className="flex flex-col">
                    <button
                      onClick={() => handleAiExpand(provider.id)}
                      disabled={isConnected}
                      className={cn(
                        "group relative flex items-center gap-4 w-full rounded-xl px-4 py-3.5 text-left transition-all duration-150",
                        isConnected
                          ? "bg-emerald-500/[0.06] border border-emerald-500/20"
                          : isExpanded
                            ? "bg-white/[0.06] border border-white/[0.12]"
                            : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]",
                        !isConnected && "cursor-pointer"
                      )}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={isConnected
                          ? { background: "rgba(16,185,129,0.1)" }
                          : { background: `${provider.color}15`, border: `1px solid ${provider.color}20` }
                        }
                      >
                        {isConnected ? (
                          <Check className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />
                        ) : (
                          <Sparkles className="w-4.5 h-4.5" style={{ color: provider.color }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[14px] font-semibold", isConnected ? "text-emerald-400" : "text-white/85")}>
                          {provider.label}
                          {isConnected && <span className="ml-2 text-[11px] font-normal text-emerald-400/60">Connected</span>}
                        </p>
                        <p className="text-[12px] text-white/35 mt-0.5">
                          {provider.models[0].label} · {provider.models[0].contextWindow} context
                        </p>
                      </div>
                      {!isConnected && <ChevronDown className={cn("w-4 h-4 text-white/20 transition-transform", isExpanded && "rotate-180")} />}
                    </button>

                    {isExpanded && !isConnected && (
                      <div className="mt-1.5 ml-14 ob-scale-in" style={{ animationDelay: "0s" }}>
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
                          <div>
                            <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">API Key</label>
                            <input
                              type="password"
                              value={aiFields.api_key || ""}
                              onChange={(e) => setAiFields((f) => ({ ...f, api_key: e.target.value }))}
                              placeholder={provider.placeholder}
                              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-[13px] text-white/80 placeholder:text-white/20 outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Model</label>
                            <select
                              value={aiFields.model || provider.defaultModel}
                              onChange={(e) => setAiFields((f) => ({ ...f, model: e.target.value }))}
                              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-[13px] text-white/80 outline-none focus:border-white/20 transition-all appearance-none cursor-pointer"
                            >
                              {provider.models.map((m) => (
                                <option key={m.id} value={m.id} className="bg-[#18181b] text-white">{m.label} ({m.contextWindow})</option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => handleAiConnect(provider.id as AiProviderId)}
                            disabled={status === "connecting" || !aiFields.api_key?.trim()}
                            className="w-full h-10 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ backgroundColor: provider.color, color: "#fff", boxShadow: `0 2px 16px ${provider.color}30` }}
                          >
                            {status === "connecting" ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting...</> : <><Key className="w-3.5 h-3.5" /> Connect</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <StepNav onBack={goBack} onNext={goNext} nextLabel={hasAiProvider ? "Continue" : "Skip for now"} />
          </div>
        </div>

        {/* ═══ READY ═══ */}
        <div className={cn("absolute inset-0 flex flex-col items-center justify-center px-6 step-t", step === "ready" && !transitioning ? "step-on" : "step-off")}>
          <div className="text-center max-w-md">
            {/* Connected chips */}
            {(connectedPlatforms.length > 0 || connectedAi.length > 0) && (
              <div className="flex flex-wrap items-center justify-center gap-2 mb-8 ob-fade-up" style={{ animationDelay: "0.05s" }}>
                {connectedPlatforms.map(([id]) => {
                  const p = PLATFORMS.find((pl) => pl.id === id);
                  return p ? (
                    <span key={id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] text-[11px] font-medium text-emerald-400/90">
                      <Check className="w-3 h-3" /> {p.name}
                    </span>
                  ) : null;
                })}
                {connectedAi.map(([id]) => {
                  const p = AI_PROVIDERS.find((pr) => pr.id === id);
                  return p ? (
                    <span key={id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/[0.06] text-[11px] font-medium text-violet-400/90">
                      <Sparkles className="w-3 h-3" /> {p.label}
                    </span>
                  ) : null;
                })}
              </div>
            )}

            <div className="ob-fade-up" style={{ animationDelay: "0.1s" }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/10 flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-6 h-6 text-violet-400" />
              </div>
            </div>

            <h2
              className="font-editorial text-[clamp(40px, 5.5vw, 56px)] font-bold text-white leading-[0.9] mb-4 ob-fade-up"
              style={{ animationDelay: "0.15s" }}
            >
              You&apos;re ready.
            </h2>
            <p
              className="text-[15px] text-white/40 mb-12 ob-fade-up leading-relaxed"
              style={{ animationDelay: "0.25s" }}
            >
              Your creative cockpit is set up. Start writing something brilliant.
            </p>

            <div className="ob-fade-up" style={{ animationDelay: "0.4s" }}>
              <button
                onClick={onComplete}
                className="group inline-flex items-center gap-3 h-[54px] px-10 rounded-full bg-white text-[#09090b] text-[15px] font-bold hover:bg-white/95 transition-all duration-200"
                style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 4px 32px rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.3)" }}
              >
                Enter Station
                <ArrowRight className="w-4.5 h-4.5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {step !== "hero" && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] z-40" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%`, background: "linear-gradient(90deg, rgba(139,92,246,0.6), rgba(217,70,239,0.6))" }}
          />
        </div>
      )}
    </div>
  );
}

/* ═══ Step Header ═══ */
function StepHeader({ step, total, title, subtitle }: { step: number; total: number; title: string; subtitle: string }) {
  return (
    <div className="text-center ob-fade-up" style={{ animationDelay: "0.05s" }}>
      <p className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.2em] mb-3">
        Step {step} of {total}
      </p>
      <h2 className="font-editorial text-[34px] font-semibold text-white leading-tight mb-2.5">
        {title}
      </h2>
      <p className="text-[14px] text-white/35 max-w-sm mx-auto leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}

/* ═══ Step Navigation ═══ */
function StepNav({ onBack, onNext, nextLabel }: { onBack: () => void; onNext: () => void; nextLabel: string }) {
  return (
    <div className="flex items-center justify-between mt-10 ob-fade-up" style={{ animationDelay: "0.2s" }}>
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-white/25 hover:text-white/50 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>
      <button
        onClick={onNext}
        className="group flex items-center gap-2.5 h-11 px-7 rounded-full bg-white text-[#09090b] text-[13px] font-semibold hover:bg-white/95 transition-all duration-200"
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 2px 16px rgba(255,255,255,0.06)" }}
      >
        {nextLabel}
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

/* ═══ Platform Row ═══ */
interface PlatformRowProps {
  platform: PlatformDef;
  status: ConnectionStatus;
  isExpanded: boolean;
  fields: Record<string, string>;
  errors: Record<string, string>;
  onExpand: () => void;
  onFieldChange: (key: string, value: string) => void;
  onConnect: () => void;
}

function PlatformRow({ platform, status, isExpanded, fields, errors, onExpand, onFieldChange, onConnect }: PlatformRowProps) {
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const color = platform.color === "#000000" ? "#ffffff" : platform.color;

  return (
    <div className="flex flex-col">
      <button
        onClick={onExpand}
        disabled={isConnected}
        className={cn(
          "group relative flex items-center gap-4 w-full rounded-xl px-4 py-3.5 text-left transition-all duration-150",
          isConnected
            ? "bg-emerald-500/[0.06] border border-emerald-500/20"
            : isExpanded
              ? "bg-white/[0.06] border border-white/[0.12]"
              : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]",
          !isConnected && "cursor-pointer"
        )}
      >
        {/* Colored left accent */}
        {!isConnected && (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full transition-opacity"
            style={{ background: color, opacity: isExpanded ? 0.8 : 0.3 }}
          />
        )}

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
          style={isConnected
            ? { background: "rgba(16,185,129,0.1)" }
            : { background: `${color}12`, border: `1px solid ${color}18` }
          }
        >
          {isConnected ? (
            <Check className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />
          ) : (
            <div className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}40` }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-[14px] font-semibold", isConnected ? "text-emerald-400" : "text-white/85")}>
            {platform.name}
            {isConnected && <span className="ml-2 text-[11px] font-normal text-emerald-400/60">Connected</span>}
          </p>
          <p className="text-[12px] text-white/35 mt-0.5">{PLATFORM_TAGLINES[platform.id] || platform.description}</p>
        </div>
        {!isConnected && (
          <ChevronDown className={cn("w-4 h-4 text-white/20 transition-transform", isExpanded && "rotate-180")} />
        )}
      </button>

      {isExpanded && !isConnected && (
        <div className="mt-1.5 ml-14 ob-scale-in" style={{ animationDelay: "0s" }}>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
            {platform.fields.map((field) => (
              <div key={field.key}>
                <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">{field.label}</label>
                {field.type === "textarea" ? (
                  <textarea
                    value={fields[field.key] || ""} onChange={(e) => onFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder} rows={2}
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-[13px] text-white/80 placeholder:text-white/20 outline-none focus:border-white/20 focus:bg-white/[0.06] resize-none transition-all"
                  />
                ) : (
                  <input
                    type={field.type} value={fields[field.key] || ""} onChange={(e) => onFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-[13px] text-white/80 placeholder:text-white/20 outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
                  />
                )}
              </div>
            ))}
            {errors._global && status === "error" && <p className="text-[12px] text-red-400/80">{errors._global}</p>}
            <button
              onClick={onConnect} disabled={isConnecting}
              className="w-full h-10 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-40"
              style={{
                backgroundColor: color,
                color: platform.color === "#000000" ? "#000" : "#fff",
                boxShadow: `0 2px 16px ${color}25`,
              }}
            >
              {isConnecting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting...</> : <><ArrowRight className="w-3.5 h-3.5" /> Connect</>}
            </button>
            <a href={platform.apiDocsUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-[11px] text-white/25 hover:text-white/45 transition-colors mt-1">
              Where do I find my credentials?
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
