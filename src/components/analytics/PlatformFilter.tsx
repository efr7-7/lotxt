import { useAnalyticsStore } from "@/stores/analytics-store";
import { PLATFORMS } from "@/lib/platforms";
import { cn } from "@/lib/utils";

export function PlatformFilter() {
  const { selectedPlatform, setSelectedPlatform } = useAnalyticsStore();

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => setSelectedPlatform("all")}
        className={cn(
          "px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
          selectedPlatform === "all"
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted",
        )}
      >
        All
      </button>
      {PLATFORMS.map((p) => (
        <button
          key={p.id}
          onClick={() => setSelectedPlatform(p.id)}
          className={cn(
            "px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
            selectedPlatform === p.id
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}
