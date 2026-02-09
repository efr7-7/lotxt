import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { WorkspaceContainer } from "./WorkspaceContainer";
import { CommandPalette } from "@/components/command-palette/CommandPalette";

export function AppShell() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <TitleBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-hidden">
          <WorkspaceContainer />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
