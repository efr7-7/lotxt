import { useSettingsStore, ACCENT_PRESETS, THEME_PRESETS, type ThemeMode } from "@/stores/settings-store";
import { X, Monitor, Sun, Moon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const MODE_OPTIONS: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: "light", icon: Sun, label: "Light" },
  { mode: "dark", icon: Moon, label: "Dark" },
  { mode: "system", icon: Monitor, label: "System" },
];

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const {
    autoSaveInterval, defaultExportFormat, editorFontSize, editorLineHeight,
    accentColor, themeMode, themePresetId,
    setSetting, applyThemePreset, applyThemeMode,
  } = useSettingsStore();

  // Apply accent color live
  const applyAccent = (color: string) => {
    setSetting("accentColor", color);
    document.documentElement.style.setProperty("--primary", color);
  };

  const darkPresets = THEME_PRESETS.filter((p) => p.mode === "dark");
  const lightPresets = THEME_PRESETS.filter((p) => p.mode === "light");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-[520px] max-h-[85vh] bg-card border border-border/50 rounded-xl shadow-overlay overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <h2 className="text-sm font-semibold text-foreground">Settings</h2>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Appearance — Themes (prominently first) */}
          <Section title="Theme">
            {/* Mode switcher */}
            <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg w-fit">
              {MODE_OPTIONS.map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => applyThemeMode(mode)}
                  className={cn(
                    "flex items-center gap-1.5 h-7 px-3 rounded-md text-[11px] font-medium transition-all",
                    themeMode === mode
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Dark themes */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-medium text-muted-foreground/50">Dark</span>
              <div className="grid grid-cols-3 gap-2">
                {darkPresets.map((preset) => (
                  <ThemeCard
                    key={preset.id}
                    preset={preset}
                    isActive={themePresetId === preset.id}
                    onClick={() => applyThemePreset(preset.id)}
                  />
                ))}
              </div>
            </div>

            {/* Light themes */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-medium text-muted-foreground/50">Light</span>
              <div className="grid grid-cols-3 gap-2">
                {lightPresets.map((preset) => (
                  <ThemeCard
                    key={preset.id}
                    preset={preset}
                    isActive={themePresetId === preset.id}
                    onClick={() => applyThemePreset(preset.id)}
                  />
                ))}
              </div>
            </div>
          </Section>

          <div className="h-px bg-border/30" />

          {/* Accent color */}
          <Section title="Accent Color">
            <div className="flex items-center gap-2">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => applyAccent(preset)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-all",
                    accentColor === preset
                      ? "border-foreground scale-110 shadow-md"
                      : "border-transparent hover:border-foreground/30 hover:scale-105",
                  )}
                  style={{ backgroundColor: `hsl(${preset})` }}
                />
              ))}
            </div>
          </Section>

          <div className="h-px bg-border/30" />

          {/* General */}
          <Section title="General">
            <SettingRow label="Auto-save interval">
              <select
                value={autoSaveInterval}
                onChange={(e) => setSetting("autoSaveInterval", Number(e.target.value))}
                className="w-40 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                <option value={15000}>15 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
                <option value={120000}>2 minutes</option>
                <option value={300000}>5 minutes</option>
              </select>
            </SettingRow>
            <SettingRow label="Default export format">
              <select
                value={defaultExportFormat}
                onChange={(e) => setSetting("defaultExportFormat", e.target.value as any)}
                className="w-40 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="html">HTML</option>
                <option value="markdown">Markdown</option>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
              </select>
            </SettingRow>
          </Section>

          <div className="h-px bg-border/30" />

          {/* Editor */}
          <Section title="Editor">
            <SettingRow label="Font size">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={12}
                  max={20}
                  step={1}
                  value={editorFontSize}
                  onChange={(e) => setSetting("editorFontSize", Number(e.target.value))}
                  className="w-24 accent-primary"
                />
                <span className="text-[10px] text-muted-foreground tabular-nums w-6 text-right">
                  {editorFontSize}px
                </span>
              </div>
            </SettingRow>
            <SettingRow label="Line height">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1.4}
                  max={2.0}
                  step={0.05}
                  value={editorLineHeight}
                  onChange={(e) => setSetting("editorLineHeight", Number(e.target.value))}
                  className="w-24 accent-primary"
                />
                <span className="text-[10px] text-muted-foreground tabular-nums w-6 text-right">
                  {editorLineHeight.toFixed(2)}
                </span>
              </div>
            </SettingRow>
          </Section>

          <div className="h-px bg-border/30" />

          {/* About */}
          <Section title="About">
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">Station</span> — The all-in-one creator studio
              </p>
              <p className="text-[10px] text-muted-foreground/50">
                Version 1.0.0-beta
              </p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function ThemeCard({
  preset, isActive, onClick,
}: {
  preset: typeof THEME_PRESETS[0]; isActive: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-lg p-2.5 border transition-all text-left group",
        isActive
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border/50 hover:border-primary/30 hover:bg-accent/30"
      )}
    >
      {/* Mini preview */}
      <div
        className="w-full h-10 rounded-md mb-1.5 flex items-end p-1 gap-0.5"
        style={{ backgroundColor: `hsl(${preset.background})` }}
      >
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `hsl(${preset.accent})` }} />
        <div className="flex-1 h-1.5 rounded-full opacity-40" style={{ backgroundColor: `hsl(${preset.foreground})` }} />
        <div className="w-5 h-1.5 rounded-full opacity-20" style={{ backgroundColor: `hsl(${preset.foreground})` }} />
      </div>
      <span className="text-[10px] font-medium text-foreground/80">{preset.name}</span>
      {isActive && (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
        {title}
      </h3>
      {children}
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-foreground/80">{label}</span>
      {children}
    </div>
  );
}
