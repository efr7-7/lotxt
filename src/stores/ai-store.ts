import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

// ─── Types ───

export type AiProviderId = "claude" | "openai" | "gemini" | "openrouter";

export interface AiProvider {
  id: string;
  name: string;
  api_key: string;
  model: string;
  base_url: string;
  is_active: boolean;
}

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiResponse {
  content: string;
  provider: string;
  model: string;
  usage?: { input_tokens: number; output_tokens: number };
}

// Default models per provider
export const DEFAULT_MODELS: Record<AiProviderId, { name: string; model: string; base_url: string }> = {
  claude: { name: "Claude (Anthropic)", model: "claude-sonnet-4-20250514", base_url: "" },
  openai: { name: "ChatGPT (OpenAI)", model: "gpt-4o", base_url: "" },
  gemini: { name: "Gemini (Google)", model: "gemini-2.0-flash", base_url: "" },
  openrouter: { name: "OpenRouter", model: "anthropic/claude-sonnet-4-20250514", base_url: "" },
};

// System prompts for different tasks
export const SYSTEM_PROMPTS = {
  writer: `You are a world-class newsletter writer and editor embedded in Station, a creative writing tool. You help publishers write compelling content. Be concise, creative, and match the writer's voice. When asked to write or edit, output only the content — no meta-commentary. Use HTML formatting tags (h2, h3, p, strong, em, ul, ol, li, blockquote) when producing formatted content.`,

  twitterThread: `You are an expert social media strategist. Convert the provided newsletter content into a compelling Twitter/X thread. Rules:
- Each tweet must be under 280 characters
- Start with a strong hook
- Number each tweet (1/, 2/, etc.)
- End with a CTA
- Separate tweets with ---
- Keep the core message but optimize for Twitter engagement`,

  linkedinPost: `You are a LinkedIn content expert. Convert the provided newsletter content into a professional LinkedIn post. Rules:
- Open with a hook (first line matters most)
- Use line breaks for readability
- Keep under 3000 characters
- Professional but conversational tone
- End with a question or CTA to drive engagement
- Add relevant hashtags (3-5 max)`,

  emailSubjects: `You are an email marketing expert with high open rates. Generate 5 compelling email subject lines for the provided newsletter content. Rules:
- Each on its own line, numbered 1-5
- Mix of styles: curiosity, urgency, benefit-driven, question, controversial
- Keep under 60 characters each
- Optimize for open rate`,

  summary: `You are a concise content editor. Create a TL;DR summary of the provided content. Rules:
- 2-3 sentences maximum
- Capture the key takeaway
- Write in active voice
- Could stand alone as a teaser`,

  improve: `You are a senior editor. Improve the provided text while maintaining the author's voice. Focus on:
- Clarity and conciseness
- Stronger verbs and active voice
- Better flow and transitions
- Remove filler words
Output only the improved text, no explanations.`,

  continueWriting: `You are a skilled writer continuing a piece of content. Match the existing tone, style, and topic. Write the next 2-3 paragraphs naturally. Output only the continuation, no meta-commentary.`,

  seoScore: `You are an SEO expert for newsletter and blog content. Analyze the provided content for SEO quality. Output ONLY valid JSON, no markdown, no backticks:
{"score":0-100,"readability":"grade level string","issues":["issue1","issue2"],"suggestions":["suggestion1","suggestion2"]}
Check: keyword density, heading structure, meta description quality, content length, readability grade (Flesch-Kincaid), internal linking potential, title SEO.`,

  hookGenerator: `You are a master copywriter who writes irresistible opening paragraphs. Generate 5 alternative hooks/opening paragraphs for the provided content. Each should be a different style:
1. **Question** — open with a thought-provoking question
2. **Bold Statement** — a contrarian or surprising claim
3. **Statistic** — lead with a compelling number or data point
4. **Story** — a mini-anecdote or scene-setting opener
5. **Contrarian** — challenge conventional wisdom

Number each 1-5. Keep each hook to 2-3 sentences max. Make them compelling enough that readers can't stop reading.`,

  ctaGenerator: `You are an email marketing expert specializing in calls-to-action. Generate 3 CTA variants for the provided content:
1. **Soft** — subtle, low-pressure nudge
2. **Medium** — clear, direct ask
3. **Strong** — urgent, high-energy push

For each, write 1-2 sentences. Number them 1-3. Include specific action language.`,

  toneAnalysis: `You are a writing voice analyst. Analyze the tone and voice of the provided content. Output ONLY valid JSON, no markdown, no backticks:
{"primary":"main tone","secondary":"secondary tone","formality":1-10,"emotion":"dominant emotion","confidence":1-10,"suggestions":["how to strengthen voice","tip2","tip3"]}
Tones include: conversational, professional, authoritative, casual, humorous, inspirational, educational, persuasive, empathetic, analytical.`,

  outlineExpander: `You are a content strategist. The user will provide a heading-only outline. Expand each section with 2-3 bullet points of what to cover. Keep bullet points concise (1 sentence each). Maintain the original heading hierarchy. Output in the same format with headings followed by bullet points.`,

  abTestSubjects: `You are an email deliverability expert. Generate 2 A/B test subject line variants for the provided content. For each variant:
- The subject line (under 60 chars)
- Predicted open rate reasoning (1 sentence)
- What psychological trigger it uses

Format:
**Variant A:** [subject line]
Reasoning: [why it works]
Trigger: [psychological principle]

**Variant B:** [subject line]
Reasoning: [why it works]
Trigger: [psychological principle]`,

  youtubeDescription: `You are a YouTube SEO expert. Convert the provided newsletter content into an optimized YouTube video description. Format:
- Line 1-2: Compelling hook summarizing the video's value (appears "above the fold")
- Blank line
- 3-5 bullet points of key topics with timestamps placeholder (e.g., 0:00 Intro, 1:23 Topic)
- Blank line
- 2-3 sentences expanding on the video's content with keywords naturally woven in
- Blank line
- CTA: Subscribe, like, comment prompt
- Blank line
- 5-8 relevant hashtags
- Keep total under 5000 characters. Front-load keywords for search.`,

  tiktokCaption: `You are a TikTok content strategist who creates viral captions. Convert the provided content into a TikTok caption. Rules:
- Start with a scroll-stopping hook (POV:, Wait for it..., Things nobody tells you about..., etc.)
- Keep the core message in 2-3 punchy lines
- Use line breaks for rhythm
- Add a clear CTA (Follow for more, Save this, Share with someone who...)
- End with 5-8 trending and niche hashtags
- Total under 2200 characters
- Conversational, Gen-Z friendly tone — not corporate
- Use strategic emoji (1-3 max, not overdone)`,

  reelsCaption: `You are an Instagram Reels content expert. Convert the provided content into a Reels caption. Rules:
- Open with a bold hook or question (first line is everything)
- 2-3 sentences of value or context
- Line breaks between ideas
- End with a CTA (Save for later, Tag someone, Drop a 🔥 if you agree)
- Add a block of 15-20 hashtags (mix of broad + niche)
- Keep caption under 2200 characters
- Tone: confident, value-packed, slightly aspirational
- Use 2-4 relevant emoji strategically`,
};

// ─── Store ───

interface AiState {
  providers: AiProvider[];
  activeProviderId: string | null;
  isLoading: boolean;
  error: string | null;

  // Chat history for the writing assistant sidebar
  chatHistory: AiMessage[];
  isStreaming: boolean;

  // Actions
  loadProviders: () => Promise<void>;
  saveProvider: (provider: AiProvider) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  setActiveProvider: (id: string) => void;

  // AI Operations
  chat: (messages: AiMessage[], systemPrompt?: string, maxTokens?: number, temperature?: number) => Promise<AiResponse>;
  quickAction: (action: keyof typeof SYSTEM_PROMPTS, content: string) => Promise<string>;
  streamAction: (
    action: keyof typeof SYSTEM_PROMPTS,
    content: string,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (error: string) => void,
  ) => Promise<() => void>;

  // Chat sidebar
  addChatMessage: (msg: AiMessage) => void;
  clearChat: () => void;
}

export const useAiStore = create<AiState>((set, get) => ({
  providers: [],
  activeProviderId: null,
  isLoading: false,
  error: null,
  chatHistory: [],
  isStreaming: false,

  loadProviders: async () => {
    try {
      const providers = await invoke<AiProvider[]>("get_ai_providers");
      const active = providers.find((p) => p.is_active);
      set({
        providers,
        activeProviderId: active?.id || (providers.length > 0 ? providers[0].id : null),
      });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  saveProvider: async (provider) => {
    set({ isLoading: true, error: null });
    try {
      await invoke("save_ai_provider", { provider });
      await get().loadProviders();
      set({ isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
      throw e;
    }
  },

  deleteProvider: async (id) => {
    try {
      await invoke("delete_ai_provider", { providerId: id });
      await get().loadProviders();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  setActiveProvider: (id) => {
    set({ activeProviderId: id });
    // Also update the provider's is_active flag
    const { providers } = get();
    providers.forEach((p) => {
      const updated = { ...p, is_active: p.id === id };
      invoke("save_ai_provider", { provider: updated }).catch(() => {});
    });
  },

  chat: async (messages, systemPrompt, maxTokens, temperature) => {
    const { activeProviderId } = get();
    if (!activeProviderId) throw new Error("No AI provider configured. Add one in Settings.");

    set({ isStreaming: true, error: null });
    try {
      const response = await invoke<AiResponse>("ai_chat", {
        request: {
          provider_id: activeProviderId,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: maxTokens || 2048,
          temperature: temperature || 0.7,
          system_prompt: systemPrompt || null,
        },
      });
      set({ isStreaming: false });
      return response;
    } catch (e) {
      set({ isStreaming: false, error: String(e) });
      throw e;
    }
  },

  quickAction: async (action, content) => {
    const systemPrompt = SYSTEM_PROMPTS[action];
    const response = await get().chat(
      [{ role: "user", content }],
      systemPrompt,
      action === "emailSubjects" ? 512 : 2048,
      action === "emailSubjects" ? 0.9 : 0.7,
    );
    return response.content;
  },

  streamAction: async (action, content, onChunk, onDone, onError) => {
    const { activeProviderId } = get();
    if (!activeProviderId) {
      onError("No AI provider configured. Add one in Settings.");
      return () => {};
    }

    const systemPrompt = SYSTEM_PROMPTS[action];
    const requestId = crypto.randomUUID();

    set({ isStreaming: true, error: null });

    // Listen for stream events from Tauri
    const { listen } = await import("@tauri-apps/api/event");

    const unlistenChunk = await listen<{ chunk: string; done: boolean; request_id: string }>(
      "ai-stream-chunk",
      (event) => {
        if (event.payload.request_id !== requestId) return;
        if (event.payload.done) {
          set({ isStreaming: false });
          onDone();
        } else {
          onChunk(event.payload.chunk);
        }
      }
    );

    const unlistenError = await listen<{ request_id: string; error: string }>(
      "ai-stream-error",
      (event) => {
        if (event.payload.request_id !== requestId) return;
        set({ isStreaming: false, error: event.payload.error });
        onError(event.payload.error);
      }
    );

    // Start the stream
    try {
      await invoke("ai_chat_stream", {
        request: {
          provider_id: activeProviderId,
          messages: [{ role: "user", content }],
          max_tokens: action === "emailSubjects" ? 512 : 2048,
          temperature: action === "emailSubjects" ? 0.9 : 0.7,
          system_prompt: systemPrompt || null,
        },
        requestId,
      });
    } catch (e) {
      set({ isStreaming: false });
      onError(String(e));
    }

    // Return cleanup function
    return () => {
      unlistenChunk();
      unlistenError();
    };
  },

  addChatMessage: (msg) =>
    set((state) => ({ chatHistory: [...state.chatHistory, msg] })),

  clearChat: () => set({ chatHistory: [] }),
}));
