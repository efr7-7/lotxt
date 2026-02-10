/* ─── AI System Types ─── */

export type AiProviderId = "claude" | "openai" | "gemini" | "openrouter";

export interface AiProviderConfig {
  id: AiProviderId;
  label: string;
  icon: string;
  color: string;
  defaultModel: string;
  models: { id: string; label: string; contextWindow: string }[];
  placeholder: string;
}

export const AI_PROVIDERS: AiProviderConfig[] = [
  {
    id: "claude",
    label: "Claude",
    icon: "anthropic",
    color: "#D4A574",
    defaultModel: "claude-sonnet-4-20250514",
    models: [
      { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", contextWindow: "200K" },
      { id: "claude-opus-4-20250514", label: "Claude Opus 4", contextWindow: "200K" },
      { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", contextWindow: "200K" },
    ],
    placeholder: "sk-ant-...",
  },
  {
    id: "openai",
    label: "ChatGPT",
    icon: "openai",
    color: "#10A37F",
    defaultModel: "gpt-4o",
    models: [
      { id: "gpt-4o", label: "GPT-4o", contextWindow: "128K" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini", contextWindow: "128K" },
      { id: "o3-mini", label: "o3-mini", contextWindow: "200K" },
    ],
    placeholder: "sk-...",
  },
  {
    id: "gemini",
    label: "Gemini",
    icon: "google",
    color: "#4285F4",
    defaultModel: "gemini-2.0-flash",
    models: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", contextWindow: "1M" },
      { id: "gemini-2.5-pro-preview-06-05", label: "Gemini 2.5 Pro", contextWindow: "1M" },
    ],
    placeholder: "AIza...",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    icon: "router",
    color: "#6366F1",
    defaultModel: "anthropic/claude-sonnet-4-20250514",
    models: [
      { id: "anthropic/claude-sonnet-4-20250514", label: "Claude Sonnet 4 (via OR)", contextWindow: "200K" },
      { id: "openai/gpt-4o", label: "GPT-4o (via OR)", contextWindow: "128K" },
      { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash (via OR)", contextWindow: "1M" },
      { id: "meta-llama/llama-3.1-405b-instruct", label: "Llama 3.1 405B (via OR)", contextWindow: "128K" },
    ],
    placeholder: "sk-or-...",
  },
];

export function getAiProviderConfig(id: AiProviderId): AiProviderConfig | undefined {
  return AI_PROVIDERS.find((p) => p.id === id);
}
