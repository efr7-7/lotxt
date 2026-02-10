import { create } from "zustand";

const STORAGE_KEY = "station:settings";

// ─── Theme System ───

export type ThemeMode = "system" | "light" | "dark";

export interface ThemePreset {
  id: string;
  name: string;
  mode: "light" | "dark";
  accent: string;       // HSL for --primary
  background: string;   // HSL for --background
  card: string;         // HSL for --card
  foreground: string;   // HSL for --foreground
  muted: string;        // HSL for --muted
}

export const THEME_PRESETS: ThemePreset[] = [
  // Dark themes
  { id: "midnight",    name: "Midnight",       mode: "dark",  accent: "262 83% 58%", background: "240 10% 4%",   card: "240 6% 7%",   foreground: "0 0% 98%",  muted: "240 4% 16%" },
  { id: "ocean",       name: "Ocean",          mode: "dark",  accent: "221 83% 53%", background: "222 47% 5%",   card: "222 30% 8%",  foreground: "210 40% 98%", muted: "215 20% 16%" },
  { id: "forest",      name: "Forest",         mode: "dark",  accent: "160 84% 39%", background: "160 20% 4%",   card: "160 12% 7%",  foreground: "150 20% 96%", muted: "155 10% 15%" },
  { id: "ember",       name: "Ember",          mode: "dark",  accent: "15 90% 55%",  background: "20 14% 4%",    card: "20 10% 7%",   foreground: "30 20% 96%",  muted: "20 8% 15%" },
  { id: "rose",        name: "Rose",           mode: "dark",  accent: "330 81% 60%", background: "340 10% 4%",   card: "340 8% 7%",   foreground: "330 10% 97%", muted: "340 5% 15%" },
  { id: "noir",        name: "Noir",           mode: "dark",  accent: "0 0% 70%",    background: "0 0% 4%",      card: "0 0% 7%",     foreground: "0 0% 95%",    muted: "0 0% 15%" },
  // Light themes
  { id: "daylight",    name: "Daylight",       mode: "light", accent: "262 83% 58%", background: "0 0% 100%",    card: "0 0% 99%",   foreground: "240 10% 4%",  muted: "240 5% 96%" },
  { id: "paper",       name: "Paper",          mode: "light", accent: "25 95% 53%",  background: "40 33% 98%",   card: "40 20% 97%", foreground: "30 10% 10%",  muted: "40 10% 93%" },
  { id: "arctic",      name: "Arctic",         mode: "light", accent: "200 90% 48%", background: "210 40% 99%",  card: "210 30% 98%", foreground: "215 25% 10%", muted: "210 20% 95%" },
  { id: "sage",        name: "Sage",           mode: "light", accent: "150 60% 40%", background: "140 20% 98%",  card: "140 15% 97%", foreground: "150 15% 10%", muted: "140 10% 93%" },
  { id: "lavender",    name: "Lavender",       mode: "light", accent: "270 70% 60%", background: "270 20% 99%",  card: "270 15% 98%", foreground: "270 10% 10%", muted: "270 10% 94%" },
  { id: "cream",       name: "Cream",          mode: "light", accent: "30 70% 50%",  background: "45 30% 97%",   card: "45 20% 96%",  foreground: "30 15% 12%",  muted: "45 10% 92%" },
];

export interface SettingsState {
  autoSaveInterval: number; // ms
  defaultExportFormat: "html" | "markdown" | "pdf" | "docx";
  editorFontSize: number; // px
  editorLineHeight: number;
  accentColor: string; // HSL string like "262 83% 58%"
  themeMode: ThemeMode;
  themePresetId: string;

  setSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  applyThemePreset: (presetId: string) => void;
  applyThemeMode: (mode: ThemeMode) => void;
}

const ACCENT_PRESETS = [
  "262 83% 58%",  // Purple (default)
  "221 83% 53%",  // Blue
  "160 84% 39%",  // Green
  "0 72% 51%",    // Red
  "25 95% 53%",   // Orange
  "330 81% 60%",  // Pink
  "47 96% 53%",   // Yellow
  "173 80% 40%",  // Teal
];

function loadFromStorage(): Partial<SettingsState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveToStorage(state: Partial<SettingsState>) {
  try {
    const { setSetting: _, ...data } = state as any;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

const stored = loadFromStorage();

// Apply theme to DOM
function applyThemeToDOM(preset: ThemePreset | undefined, mode: ThemeMode) {
  const root = document.documentElement;

  // Determine effective mode
  let effectiveMode: "light" | "dark" = "dark";
  if (mode === "system") {
    effectiveMode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } else {
    effectiveMode = mode;
  }

  // Apply dark/light class
  root.classList.remove("light", "dark");
  root.classList.add(effectiveMode);

  // Apply theme CSS variables if preset provided
  if (preset) {
    root.style.setProperty("--primary", preset.accent);
    root.style.setProperty("--background", preset.background);
    root.style.setProperty("--card", preset.card);
    root.style.setProperty("--foreground", preset.foreground);
    root.style.setProperty("--muted", preset.muted);
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  autoSaveInterval: stored.autoSaveInterval ?? 30_000,
  defaultExportFormat: stored.defaultExportFormat ?? "html",
  editorFontSize: stored.editorFontSize ?? 16,
  editorLineHeight: stored.editorLineHeight ?? 1.8,
  accentColor: stored.accentColor ?? "262 83% 58%",
  themeMode: (stored as any).themeMode ?? "dark",
  themePresetId: (stored as any).themePresetId ?? "midnight",

  setSetting: (key, value) => {
    set({ [key]: value } as any);
    const state = get();
    saveToStorage(state);
  },

  applyThemePreset: (presetId) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    set({ themePresetId: presetId, accentColor: preset.accent, themeMode: preset.mode });
    applyThemeToDOM(preset, preset.mode);
    saveToStorage(get());
  },

  applyThemeMode: (mode) => {
    set({ themeMode: mode });
    const preset = THEME_PRESETS.find((p) => p.id === get().themePresetId);
    applyThemeToDOM(preset, mode);
    saveToStorage(get());
  },
}));

// Initialize theme on load
if (typeof window !== "undefined") {
  const preset = THEME_PRESETS.find((p) => p.id === (stored as any).themePresetId);
  const mode = ((stored as any).themeMode as ThemeMode) ?? "dark";
  applyThemeToDOM(preset, mode);
}

export { ACCENT_PRESETS };
