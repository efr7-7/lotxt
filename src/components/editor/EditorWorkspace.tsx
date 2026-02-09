import { TiptapEditor } from "./TiptapEditor";
import { EditorToolbar } from "./EditorToolbar";
import { EditorSidebar } from "./EditorSidebar";
import { useEditorStore } from "@/stores/editor-store";

export default function EditorWorkspace() {
  const { currentDocument, setTitle } = useEditorStore();

  return (
    <div className="h-full flex">
      {/* Main editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        <EditorToolbar />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-6">
            {/* Document title */}
            <input
              value={currentDocument.title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Newsletter"
              className="w-full text-3xl font-bold bg-transparent outline-none placeholder:text-muted-foreground/40 mb-4 text-foreground"
            />
            {/* Rich text editor */}
            <TiptapEditor />
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <EditorSidebar />
    </div>
  );
}
