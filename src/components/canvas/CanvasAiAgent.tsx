import { useState, useRef, useEffect, useCallback } from "react";
import { useAiStore, SYSTEM_PROMPTS } from "@/stores/ai-store";
import { useCanvasStore, CANVAS_PRESETS } from "@/stores/canvas-store";
import { cn } from "@/lib/utils";
import type { CanvasElement } from "@/types/canvas";
import {
  Sparkles,
  Send,
  Loader2,
  Wand2,
  Eraser,
  Palette,
  LayoutGrid,
  Type,
  Image as ImageIcon,
  Lightbulb,
  GripVertical,
  X,
  CornerDownLeft,
  ChevronDown,
  ChevronUp,
  Zap,
  Layers,
  ArrowRight,
  Settings2,
  Minimize2,
  Maximize2,
} from "lucide-react";

/* ─── Canvas-specific quick actions ─── */
const CANVAS_ACTIONS: {
  id: string;
  label: string;
  icon: typeof Wand2;
  description: string;
  systemPrompt: string;
}[] = [
  {
    id: "suggest-layout",
    label: "Suggest layout",
    icon: LayoutGrid,
    description: "Recommend element arrangement",
    systemPrompt: `You are a world-class graphic designer. Given a canvas design context, suggest an optimal layout arrangement. Describe specific positions, sizes, and colors. Be concrete — give exact coordinates and hex colors. Keep response concise, use bullet points.`,
  },
  {
    id: "generate-text",
    label: "Generate copy",
    icon: Type,
    description: "Write text for your design",
    systemPrompt: `You are a copywriter for social media graphics and newsletter headers. Generate compelling, short text content for the given design context. Output 3-5 options. Keep each option under 50 characters. Be punchy and memorable.`,
  },
  {
    id: "color-palette",
    label: "Color palette",
    icon: Palette,
    description: "Suggest matching colors",
    systemPrompt: `You are a color theory expert and brand designer. Given the current design context, suggest a harmonious 5-color palette. Output each color as: [Hex] — [Name] — [Usage hint]. Consider contrast, accessibility, and mood.`,
  },
  {
    id: "design-critique",
    label: "Design critique",
    icon: Lightbulb,
    description: "Get feedback on your design",
    systemPrompt: `You are a senior design director reviewing a social media graphic / newsletter header. Give constructive critique with specific, actionable improvements. Cover: composition, typography, color usage, visual hierarchy, whitespace. Be concise — 3-5 bullet points max.`,
  },
];

interface CanvasAiAgentProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CanvasAiAgent({ isOpen, onClose }: CanvasAiAgentProps) {
  const {
    chatHistory,
    addChatMessage,
    clearChat,
    activeProviderId,
    providers,
    isStreaming,
    chat,
  } = useAiStore();
  const { elements, selectedId, canvasSize, canvasPreset, addElement, updateElement } =
    useCanvasStore();

  const [input, setInput] = useState("");
  const [isActionsOpen, setIsActionsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const activeProvider = providers.find((p) => p.id === activeProviderId);
  const hasProvider = activeProviderId && providers.length > 0;

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory.length]);

  // Focus input
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  /* ─── Drag handling ─── */
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    },
    [position]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, e.clientX - dragOffset.current.x),
        y: Math.max(0, e.clientY - dragOffset.current.y),
      });
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging]);

  /* ─── Canvas context builder ─── */
  const getCanvasContext = useCallback(() => {
    const preset = CANVAS_PRESETS.find((p) => p.id === canvasPreset);
    const selectedElement = elements.find((el) => el.id === selectedId);

    let context = `Canvas: ${preset?.label || "Custom"} (${canvasSize.width}×${canvasSize.height}px)\n`;
    context += `Elements (${elements.length}):\n`;

    elements.forEach((el, i) => {
      context += `  ${i + 1}. [${el.type}] "${el.name}" at (${Math.round(el.x)}, ${Math.round(el.y)}) ${Math.round(el.width)}×${Math.round(el.height)}`;
      if ("fill" in el) context += ` fill:${(el as any).fill}`;
      if ("text" in el) context += ` text:"${(el as any).text}"`;
      if ("fontSize" in el) context += ` ${(el as any).fontSize}px`;
      context += "\n";
    });

    if (selectedElement) {
      context += `\nCurrently selected: "${selectedElement.name}" (${selectedElement.type})`;
    }

    return context;
  }, [elements, selectedId, canvasSize, canvasPreset]);

  /* ─── Quick action handler ─── */
  const handleQuickAction = async (action: (typeof CANVAS_ACTIONS)[number]) => {
    setError(null);
    const context = getCanvasContext();

    addChatMessage({
      role: "user",
      content: `[${action.label}] on current canvas`,
    });

    try {
      const response = await chat(
        [{ role: "user", content: `Design context:\n${context}` }],
        action.systemPrompt,
        1024,
        0.8
      );
      addChatMessage({ role: "assistant", content: response.content });
    } catch (e) {
      setError(String(e));
      addChatMessage({ role: "assistant", content: `Error: ${String(e)}` });
    }
  };

  /* ─── Chat send ─── */
  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);

    addChatMessage({ role: "user", content: userMessage });

    try {
      const context = getCanvasContext();
      const messages = [
        ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: userMessage },
      ];

      const systemPrompt = `You are a world-class graphic designer and creative director embedded in Station's design canvas. You help users create beautiful social media graphics, newsletter headers, and visual content.

Current design state:
${context}

When users ask to create or modify elements, describe the changes precisely with:
- Element type (rect, circle, text)
- Position (x, y coordinates)
- Size (width, height)
- Colors (hex values)
- For text: the exact copy, font size, font family

Be direct, concise, and visually creative. Reference specific elements by name when suggesting changes.`;

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

  /* ─── Apply AI suggestion: add a text element ─── */
  const handleAddTextFromAi = (text: string) => {
    const id = crypto.randomUUID();
    const element: CanvasElement = {
      id,
      type: "text",
      x: canvasSize.width / 2 - 150,
      y: canvasSize.height / 2 - 20,
      width: 300,
      height: 50,
      rotation: 0,
      opacity: 1,
      name: "AI Text",
      text: text.slice(0, 100),
      fontSize: 28,
      fontFamily: "Inter",
      fill: "#09090b",
      fontStyle: "normal",
      align: "center",
    };
    addElement(element);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute z-50 rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/20 flex flex-col overflow-hidden transition-all duration-200",
        isMinimized ? "w-[280px]" : "w-[340px]",
        isDragging && "cursor-grabbing select-none"
      )}
      style={{
        right: `${position.x}px`,
        top: `${position.y}px`,
        maxHeight: isMinimized ? "auto" : "calc(100% - 32px)",
      }}
    >
      {/* Drag handle + Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b border-border/40 shrink-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30" />
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <span className="text-[13px] font-semibold text-foreground">
            Design Agent
          </span>
          {activeProvider && (
            <span className="text-[9px] text-muted-foreground/30 bg-muted/30 px-1.5 py-0.5 rounded">
              {activeProvider.name.split(" ")[0]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={clearChat}
            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/30 hover:text-foreground hover:bg-accent/50 transition-colors"
            title="Clear chat"
          >
            <Eraser className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/30 hover:text-foreground hover:bg-accent/50 transition-colors"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <Maximize2 className="w-3 h-3" />
            ) : (
              <Minimize2 className="w-3 h-3" />
            )}
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/30 hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {!hasProvider ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
              <Settings2 className="w-8 h-8 text-muted-foreground/20 mb-3" />
              <p className="text-[13px] font-medium text-foreground/60 mb-1 text-center">
                Connect an AI provider
              </p>
              <p className="text-[11px] text-muted-foreground/40 text-center">
                Add your API key in Accounts to enable the design agent.
              </p>
            </div>
          ) : (
            <>
              {/* Quick actions */}
              <div className="shrink-0 border-b border-border/30">
                <button
                  onClick={() => setIsActionsOpen(!isActionsOpen)}
                  className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider hover:text-muted-foreground/70 transition-colors"
                >
                  Design Actions
                  {isActionsOpen ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
                {isActionsOpen && (
                  <div className="px-3 pb-3 grid grid-cols-2 gap-1.5">
                    {CANVAS_ACTIONS.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action)}
                          disabled={isStreaming}
                          className={cn(
                            "flex flex-col items-start gap-1 px-2.5 py-2 rounded-lg border border-border/30 text-left",
                            "hover:bg-accent/50 hover:border-border/50 transition-all duration-150",
                            isStreaming && "opacity-50 cursor-wait"
                          )}
                        >
                          <Icon className="w-3.5 h-3.5 text-violet-400/60" />
                          <span className="text-[11px] font-medium text-foreground/80">
                            {action.label}
                          </span>
                          <span className="text-[9px] text-muted-foreground/40 leading-tight">
                            {action.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-[120px] max-h-[320px]">
                {chatHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6">
                    <Layers className="w-6 h-6 text-muted-foreground/15 mb-2" />
                    <p className="text-[12px] text-muted-foreground/30 leading-relaxed">
                      Ask me to create elements, suggest colors, generate copy,
                      or critique your design.
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
                        <p className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      </div>
                      {/* Action buttons for assistant messages */}
                      {msg.role === "assistant" &&
                        !msg.content.startsWith("Error:") && (
                          <div className="flex items-center gap-1 mt-1">
                            <button
                              onClick={() => handleAddTextFromAi(msg.content)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-muted-foreground/40 hover:text-violet-400 hover:bg-violet-500/5 transition-colors"
                            >
                              <Type className="w-2.5 h-2.5" />
                              Add as text
                            </button>
                          </div>
                        )}
                    </div>
                  ))
                )}
                {isStreaming && (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <Loader2 className="w-3 h-3 animate-spin text-violet-400/50" />
                    <span className="text-[11px] text-muted-foreground/40">
                      Designing...
                    </span>
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
                    placeholder="Describe what to create or change..."
                    rows={2}
                    className={cn(
                      "w-full rounded-lg border border-border/40 bg-accent/30 px-3 py-2 pr-9",
                      "text-[12px] text-foreground placeholder:text-muted-foreground/30",
                      "outline-none focus:border-violet-500/40 focus:bg-accent/50",
                      "resize-none transition-all duration-150"
                    )}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isStreaming}
                    className={cn(
                      "absolute right-2 bottom-2 w-6 h-6 rounded flex items-center justify-center transition-colors",
                      input.trim() && !isStreaming
                        ? "bg-violet-500 text-white"
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
                  Enter to send · I can see your canvas elements and selection
                </p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
