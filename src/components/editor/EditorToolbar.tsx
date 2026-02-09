import { useEditor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Highlighter,
  Undo2,
  Redo2,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "h-7 w-7 rounded flex items-center justify-center transition-colors",
        isActive
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
        disabled && "opacity-30 cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-1" />;
}

export function EditorToolbar() {
  const { currentDocument } = useEditorStore();

  // We'll get the editor from the TiptapEditor via a shared ref pattern
  // For now, toolbar buttons dispatch commands via the store
  // The actual editor instance is accessed through a global ref

  return (
    <div className="h-10 flex items-center px-4 border-b border-border gap-0.5 shrink-0 bg-background/80 backdrop-blur-sm">
      {/* Undo / Redo */}
      <ToolbarButton
        onClick={() => document.querySelector<HTMLElement>(".tiptap-editor")?.focus()}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {}}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Text formatting */}
      <ToolbarButton onClick={() => {}} title="Bold (Ctrl+B)">
        <Bold className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => {}} title="Italic (Ctrl+I)">
        <Italic className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => {}} title="Underline (Ctrl+U)">
        <UnderlineIcon className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => {}} title="Strikethrough">
        <Strikethrough className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => {}} title="Inline Code">
        <Code className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => {}} title="Highlight">
        <Highlighter className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <ToolbarButton onClick={() => {}} title="Heading 1">
        <Heading1 className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => {}} title="Heading 2">
        <Heading2 className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => {}} title="Heading 3">
        <Heading3 className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton onClick={() => {}} title="Bullet List">
        <List className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => {}} title="Numbered List">
        <ListOrdered className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => {}} title="Blockquote">
        <Quote className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => {}} title="Divider">
        <Minus className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Alignment */}
      <ToolbarButton onClick={() => {}} title="Align Left">
        <AlignLeft className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => {}} title="Align Center">
        <AlignCenter className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => {}} title="Align Right">
        <AlignRight className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Insert */}
      <ToolbarButton onClick={() => {}} title="Insert Link">
        <LinkIcon className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => {}} title="Insert Image">
        <ImageIcon className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => {}} title="Insert Table">
        <TableIcon className="w-3.5 h-3.5" />
      </ToolbarButton>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Word count */}
      <span className="text-[11px] text-muted-foreground mr-3">
        {currentDocument.wordCount} words
      </span>

      {/* Publish button */}
      <button className="h-7 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-colors">
        <Send className="w-3 h-3" />
        Publish
      </button>
    </div>
  );
}
