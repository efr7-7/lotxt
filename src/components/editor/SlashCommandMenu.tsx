import { useState, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Image as ImageIcon,
  Table as TableIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: typeof Heading1;
  aliases: string[];
}

const COMMANDS: SlashCommand[] = [
  {
    id: "heading1",
    label: "Heading 1",
    description: "Large section heading",
    icon: Heading1,
    aliases: ["h1", "title"],
  },
  {
    id: "heading2",
    label: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    aliases: ["h2", "subtitle"],
  },
  {
    id: "heading3",
    label: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    aliases: ["h3"],
  },
  {
    id: "bulletlist",
    label: "Bullet List",
    description: "Unordered list with bullet points",
    icon: List,
    aliases: ["ul", "bullets"],
  },
  {
    id: "numberedlist",
    label: "Numbered List",
    description: "Ordered list with numbers",
    icon: ListOrdered,
    aliases: ["ol", "numbered"],
  },
  {
    id: "blockquote",
    label: "Blockquote",
    description: "Quote or callout block",
    icon: Quote,
    aliases: ["quote", "callout"],
  },
  {
    id: "codeblock",
    label: "Code Block",
    description: "Code snippet with syntax highlighting",
    icon: Code2,
    aliases: ["code", "pre"],
  },
  {
    id: "divider",
    label: "Divider",
    description: "Horizontal rule separator",
    icon: Minus,
    aliases: ["hr", "separator", "line"],
  },
  {
    id: "image",
    label: "Image",
    description: "Insert an image from URL",
    icon: ImageIcon,
    aliases: ["img", "photo"],
  },
  {
    id: "table",
    label: "Table",
    description: "Insert a 3x3 table",
    icon: TableIcon,
    aliases: ["grid"],
  },
];

interface Props {
  editor: Editor;
  onCommand: (commandId: string) => void;
}

export function SlashCommandMenu({ editor, onCommand }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const filteredCommands = COMMANDS.filter((cmd) => {
    if (!search) return true;
    const lower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(lower) ||
      cmd.id.includes(lower) ||
      cmd.aliases.some((a) => a.includes(lower))
    );
  });

  const handleSelect = useCallback(
    (commandId: string) => {
      setIsOpen(false);
      setSearch("");
      onCommand(commandId);
    },
    [onCommand],
  );

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((i) => (i + 1) % filteredCommands.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleSelect(filteredCommands[selectedIndex].id);
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        setSearch("");
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [editor, isOpen, filteredCommands, selectedIndex, handleSelect]);

  // Listen for "/" typed at start of line or after space
  useEffect(() => {
    if (!editor) return;

    const handleTransaction = () => {
      const { state } = editor;
      const { selection } = state;
      const { $anchor } = selection;
      const textBefore = $anchor.parent.textContent.slice(0, $anchor.parentOffset);

      if (textBefore.endsWith("/")) {
        // Get cursor position
        const coords = editor.view.coordsAtPos(selection.from);
        const editorRect = editor.view.dom.getBoundingClientRect();
        setPosition({
          top: coords.bottom - editorRect.top + 4,
          left: coords.left - editorRect.left,
        });
        setIsOpen(true);
        setSearch("");
        setSelectedIndex(0);
      } else if (isOpen) {
        // Extract text after the last "/"
        const slashIndex = textBefore.lastIndexOf("/");
        if (slashIndex === -1) {
          setIsOpen(false);
          setSearch("");
        } else {
          const query = textBefore.slice(slashIndex + 1);
          setSearch(query);
          setSelectedIndex(0);
        }
      }
    };

    editor.on("transaction", handleTransaction);
    return () => {
      editor.off("transaction", handleTransaction);
    };
  }, [editor, isOpen]);

  if (!isOpen || filteredCommands.length === 0) return null;

  return (
    <div
      className="absolute z-50 w-64 bg-popover border border-border rounded-lg shadow-xl overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      <div className="max-h-72 overflow-y-auto p-1">
        {filteredCommands.map((cmd, index) => (
          <button
            key={cmd.id}
            onClick={() => handleSelect(cmd.id)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-md text-left transition-colors",
              index === selectedIndex
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50",
            )}
          >
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
              <cmd.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">{cmd.label}</div>
              <div className="text-xs text-muted-foreground truncate">
                {cmd.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
