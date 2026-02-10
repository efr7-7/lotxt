import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { WorkspaceContainer } from "./WorkspaceContainer";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { ToastContainer } from "@/components/shared/Toast";
import { FocusTimer } from "@/components/shared/FocusTimer";
import { WifiOff, X } from "lucide-react";
import { cn } from "@/lib/utils";

function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    const goOffline = () => { setOffline(true); setDismissed(false); };
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  useEffect(() => {
    if (offline && !dismissed) {
      const raf = requestAnimationFrame(() => setEntering(false));
      return () => cancelAnimationFrame(raf);
    } else {
      setEntering(true);
    }
  }, [offline, dismissed]);

  if (!offline || dismissed) return null;

  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-center gap-2.5 px-4 py-2 border-b transition-all duration-300",
        "bg-amber-500/8 border-amber-500/15",
        entering ? "opacity-0 -translate-y-1" : "opacity-100 translate-y-0",
      )}
    >
      <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center">
        <WifiOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
      </div>
      <span className="text-[12px] font-medium text-amber-700 dark:text-amber-300">
        You're offline — publishing, AI, and sync features are unavailable
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-2 w-5 h-5 rounded-md flex items-center justify-center text-amber-600/40 hover:text-amber-600/80 hover:bg-amber-500/10 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export function AppShell() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <TitleBar />
      <OfflineBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-hidden">
          <WorkspaceContainer />
        </main>
      </div>
      <FocusTimer />
      <CommandPalette />
      <ToastContainer />
    </div>
  );
}
