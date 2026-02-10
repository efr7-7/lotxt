import { useState, useRef, useEffect, useCallback } from "react";
import { useAiStore, SYSTEM_PROMPTS } from "@/stores/ai-store";
import { useEditorStore } from "@/stores/editor-store";
import { useEditorInstance } from "./EditorContext";
import { cn } from "@/lib/utils";
import { AiProviderDropdown } from "@/components/shared/AiProviderDropdown";
import {
  Sparkles,
  Send,
  Loader2,
  Wand2,
  ArrowRight,
  Eraser,
  PenLine,
  Lightbulb,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  Settings2,
  CornerDownLeft,
  Search,
  Anchor,
  MessageSquare,
  Gauge,
} from "lucide-react";

/* ─── Quick action definitions ─── */
const QUICK_ACTIONS: {
  id: keyof typeof SYSTEM_PROMPTS;
  label: string;
  icon: typeof Wand2;
  description: string;
}[] = [
  { id: "continueWriting", label: "Continue writing", icon: PenLine, description: "Write the next few paragraphs" },
  { id: "improve", label: "Improve text", icon: Wand2, description: "Better clarity and flow" },
  { id: "emailSubjects", label: "Subject lines", icon: Lightbulb, description: "5 high-open-rate options" },
  { id: "summary", label: "Summarize", icon: Zap, description: "TL;DR in 2-3 sentences" },
  { id: "seoScore", label: "SEO Score", icon: Search, description: "SEO analysis & scorecard" },
  { id: "hookGenerator", label: "Hook Generator", icon: Anchor, description: "5 opening paragraph styles" },
  { id: "ctaGenerator", label: "CTA Generator", icon: MessageSquare, description: "3 call-to-action variants" },
  { id: "toneAnalysis", label: "Tone Analysis", icon: Gauge, description: "Voice & tone breakdown" },
];

interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiAssistant({ isOpen, onClose }: AiAssistantProps) {
  const {
    chatHistory,
    addChatMessage,
    clearChat,
    activeProviderId,
    providers,
    isStreaming,
    quickAction,
    chat,
  } = useAiStore();
  const { currentDocument } = useEditorStore();
  const editor = useEditorInstance();

  const [input, setInput] = useState("");
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeProvider = providers.find((p) => p.id === activeProviderId);
  const hasProvider = activeProviderId && providers.length > 0;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory.length]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Get selected text or full doc content
  const getContextContent = useCallback(() => {
    if (editor) {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        // Has selection
        return editor.state.doc.textBetween(from, to, "\n");
      }
    }
    return currentDocument.htmlContent || currentDocument.title || "";
  }, [editor, currentDocument]);

  /* ─── Quick Action handler ─── */
  const handleQuickAction = async (actionId: keyof typeof SYSTEM_PROMPTS) => {
    setError(null);
    const content = getContextContent();
    if (!content.trim()) {
      setError("Write some content first, or select text to act on.");
      return;
    }

    // Show in chat
    const actionLabel = QUICK_ACTIONS.find((a) => a.id === actionId)?.label || actionId;
    addChatMessage({ role: "user", content: `[${actionLabel}] on current content` });

    try {
      const result = await quickAction(actionId, content);
      addChatMessage({ role: "assistant", content: result });

      // For "continue writing", auto-insert at cursor
      if (actionId === "continueWriting" && editor) {
        editor
          .chain()
          .focus()
          .insertContent(result)
          .run();
      }
    } catch (e) {
      setError(String(e));
      addChatMessage({ role: "assistant", content: `Error: ${String(e)}` });
    }
  };

  /* ─── Chat send handler ─── */
  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);

    addChatMessage({ role: "user", content: userMessage });

    try {
      // Build messages with context
      const contextContent = getContextContent();
      const messages = [
        ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: userMessage },
      ];

      const systemPrompt = `${SYSTEM_PROMPTS.writer}\n\nCurrent document title: "${currentDocument.title || "Untitled"}"\n\nCurrent content (or selection):\n${contextContent.slice(0, 4000)}`;

      const response = await chat(messages, systemPrompt);
      addChatMessage({ role: "assistant", content: response.content });
    } catch (e) {
      setError(String(e));
      addChatMessage({ role: "assistant", content: `Error: ${String(e)}` });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ─── Insert AI response into editor ─── */
  const handleInsert = (content: string) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent(content)
      .run();
  };

  if (!isOpen) return null;

  return (
    <div className="w-[320px] border-l border-border/40 bg-background flex flex-col shrink-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <span className="text-[13px] font-semibold text-foreground">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <AiProviderDropdown compact className="mr-1" />
          <button
            onClick={clearChat}
            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent/50 transition-colors"
            title="Clear chat"
          >
            <Eraser className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!hasProvider ? (
        /* No provider configured */
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <Settings2 className="w-8 h-8 text-muted-foreground/20 mb-3" />
          <p className="text-[13px] font-medium text-foreground/60 mb-1 text-center">
            Connect an AI provider
          </p>
          <p className="text-[11px] text-muted-foreground/40 text-center">
            Add your API key in the Accounts workspace to enable the AI writing assistant.
          </p>
        </div>
      ) : (
        <>
          {/* Quick actions */}
          <div className="shrink-0 border-b border-border/30">
            <button
              onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
              className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider hover:text-muted-foreground/70 transition-colors"
            >
              Quick Actions
              {isQuickActionsOpen ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
            {isQuickActionsOpen && (
              <div className="px-3 pb-3 grid grid-cols-2 gap-1.5">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.id)}
                      disabled={isStreaming}
                      className={cn(
                        "flex flex-col items-start gap-1 px-2.5 py-2 rounded-lg border border-border/30 text-left",
                        "hover:bg-accent/50 hover:border-border/50 transition-all duration-150",
                        isStreaming && "opacity-50 cursor-wait"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5 text-primary/60" />
                      <span className="text-[11px] font-medium text-foreground/80">{action.label}</span>
                      <span className="text-[9px] text-muted-foreground/40 leading-tight">{action.description}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <Sparkles className="w-6 h-6 text-muted-foreground/15 mb-2" />
                <p className="text-[12px] text-muted-foreground/30 leading-relaxed">
                  Ask me to write, edit, or brainstorm.
                  I can see your document and selected text.
                </p>
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[90%] rounded-lg px-3 py-2 text-[12px] leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary/10 text-foreground/80"
                        : "bg-accent/50 text-foreground/70 border border-border/30"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  {/* Insert button for assistant messages */}
                  {msg.role === "assistant" && !msg.content.startsWith("Error:") && (
                    <button
                      onClick={() => handleInsert(msg.content)}
                      className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                      <ArrowRight className="w-2.5 h-2.5" />
                      Insert into editor
                    </button>
                  )}
                </div>
              ))
            )}
            {isStreaming && (
              <div className="flex items-center gap-2 px-3 py-2">
                <Loader2 className="w-3 h-3 animate-spin text-primary/50" />
                <span className="text-[11px] text-muted-foreground/40">Thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 pb-2">
              <p className="text-[11px] text-destructive/70 px-2 py-1 rounded bg-destructive/5">
                {error}
              </p>
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 border-t border-border/40 p-3">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI to write, edit, or brainstorm..."
                rows={2}
                className={cn(
                  "w-full rounded-lg border border-border/40 bg-accent/30 px-3 py-2 pr-9",
                  "text-[12px] text-foreground placeholder:text-muted-foreground/30",
                  "outline-none focus:border-border/60 focus:bg-accent/50",
                  "resize-none transition-all duration-150"
                )}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className={cn(
                  "absolute right-2 bottom-2 w-6 h-6 rounded flex items-center justify-center transition-colors",
                  input.trim() && !isStreaming
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground/20"
                )}
              >
                {isStreaming ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CornerDownLeft className="w-3 h-3" />
                )}
              </button>
            </div>
            <p className="text-[9px] text-muted-foreground/25 mt-1.5 px-1">
              Enter to send · Shift+Enter for new line · Select text for targeted edits
            </p>
          </div>
        </>
      )}
    </div>
  );
}
