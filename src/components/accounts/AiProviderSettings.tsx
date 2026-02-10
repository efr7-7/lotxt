import { useState, useEffect } from "react";
import { useAiStore } from "@/stores/ai-store";
import { AI_PROVIDERS, type AiProviderId } from "@/types/ai";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Check,
  Loader2,
  Trash2,
  ChevronDown,
  Plus,
  Zap,
  Key,
} from "lucide-react";

export function AiProviderSettings() {
  const {
    providers,
    activeProviderId,
    loadProviders,
    saveProvider,
    deleteProvider,
    setActiveProvider,
    isLoading,
  } = useAiStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const connectedIds = new Set(providers.map((p) => p.id));

  const handleExpand = (providerId: string) => {
    if (expandedId === providerId) {
      setExpandedId(null);
    } else {
      setExpandedId(providerId);
      // Pre-fill if already connected
      const existing = providers.find((p) => p.id === providerId);
      if (existing) {
        setFields({
          api_key: existing.api_key,
          model: existing.model,
        });
      } else {
        const config = AI_PROVIDERS.find((p) => p.id === providerId);
        setFields({
          api_key: "",
          model: config?.defaultModel || "",
        });
      }
      setError(null);
    }
  };

  const handleSave = async (providerId: AiProviderId) => {
    const config = AI_PROVIDERS.find((p) => p.id === providerId);
    if (!config || !fields.api_key?.trim()) {
      setError("API key is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await saveProvider({
        id: providerId,
        name: config.label,
        api_key: fields.api_key.trim(),
        model: fields.model || config.defaultModel,
        base_url: "",
        is_active: providers.length === 0, // First provider becomes active
      });
      setExpandedId(null);
      setFields({});
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (providerId: string) => {
    try {
      await deleteProvider(providerId);
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">AI Providers</h3>
          <p className="text-[10px] text-muted-foreground/50">
            Connect any LLM — your keys stay encrypted locally
          </p>
        </div>
      </div>

      {/* Provider cards */}
      <div className="space-y-2">
        {AI_PROVIDERS.map((config) => {
          const isConnected = connectedIds.has(config.id);
          const isExpanded = expandedId === config.id;
          const isActive = activeProviderId === config.id;
          const existing = providers.find((p) => p.id === config.id);

          return (
            <div key={config.id} className="flex flex-col">
              {/* Card header */}
              <button
                onClick={() => handleExpand(config.id)}
                className={cn(
                  "group relative flex items-center gap-3 w-full rounded-xl border px-4 py-3 text-left transition-all duration-200",
                  isExpanded
                    ? "bg-accent/80 border-border/60"
                    : "bg-card/50 border-border/30 hover:bg-accent/50 hover:border-border/50",
                  isConnected && !isExpanded && "border-l-2",
                )}
                style={isConnected && !isExpanded ? { borderLeftColor: config.color } : undefined}
              >
                {/* Provider icon/dot */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${config.color}15` }}
                >
                  {isConnected ? (
                    <Check className="w-4 h-4" style={{ color: config.color }} />
                  ) : (
                    <Key className="w-3.5 h-3.5 text-muted-foreground/40" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-foreground">{config.label}</p>
                    {isActive && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-primary/10 text-[9px] font-semibold text-primary">
                        <Zap className="w-2.5 h-2.5" />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground/50">
                    {isConnected ? `${existing?.model || config.defaultModel}` : "Not connected"}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {isConnected && !isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveProvider(config.id);
                      }}
                      className="h-6 px-2 rounded text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      Set active
                    </button>
                  )}
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-muted-foreground/30 transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )}
                  />
                </div>
              </button>

              {/* Expanded form */}
              {isExpanded && (
                <div className="mt-1 rounded-xl border border-border/30 bg-card/30 p-4 space-y-3">
                  {/* API Key */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-1.5 block">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={fields.api_key || ""}
                      onChange={(e) => setFields((f) => ({ ...f, api_key: e.target.value }))}
                      placeholder={config.placeholder}
                      className={cn(
                        "w-full rounded-lg border border-border/40 bg-background/50 px-3 py-2 h-9",
                        "text-[13px] text-foreground placeholder:text-muted-foreground/25",
                        "outline-none focus:border-border/60 focus:ring-1 focus:ring-ring/20",
                        "transition-all duration-150"
                      )}
                    />
                  </div>

                  {/* Model selector */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-1.5 block">
                      Model
                    </label>
                    <select
                      value={fields.model || config.defaultModel}
                      onChange={(e) => setFields((f) => ({ ...f, model: e.target.value }))}
                      className={cn(
                        "w-full rounded-lg border border-border/40 bg-background/50 px-3 py-2 h-9",
                        "text-[13px] text-foreground",
                        "outline-none focus:border-border/60 focus:ring-1 focus:ring-ring/20",
                        "transition-all duration-150 appearance-none"
                      )}
                    >
                      {config.models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label} ({m.contextWindow})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Error */}
                  {error && expandedId === config.id && (
                    <p className="text-[11px] text-destructive/70">{error}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleSave(config.id)}
                      disabled={saving}
                      className={cn(
                        "flex-1 h-8 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5",
                        "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
                        saving && "opacity-60 cursor-wait"
                      )}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Saving...
                        </>
                      ) : isConnected ? (
                        "Update"
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          Connect
                        </>
                      )}
                    </button>

                    {isConnected && (
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
