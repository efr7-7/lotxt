import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { WorkspaceContainer } from "./WorkspaceContainer";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { ToastContainer } from "@/components/shared/Toast";
import { FocusTimer } from "@/components/shared/FocusTimer";
import { WifiOff } from "lucide-react";

function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="shrink-0 flex items-center justify-center gap-2 px-4 py-1.5 bg-amber-500/15 border-b border-amber-500/20 text-amber-700 dark:text-amber-400">
      <WifiOff className="w-3.5 h-3.5" />
      <span className="text-[12px] font-medium">
        You're offline — publishing, AI, and sync features are unavailable
      </span>
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
