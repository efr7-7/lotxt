import { useState, useCallback, useEffect, useRef } from "react";
import { Search, X, ChevronDown, ChevronUp, Replace, ReplaceAll } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorInstance } from "./EditorContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function FindReplace({ isOpen, onClose }: Props) {
  const editor = useEditorInstance();
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const findInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && findInputRef.current) {
      findInputRef.current.focus();
      findInputRef.current.select();
    }
  }, [isOpen]);

  // Find all matches in the document
  const findMatches = useCallback(() => {
    if (!editor || !findText) {
      setMatchCount(0);
      setCurrentMatch(0);
      return [];
    }

    const doc = editor.state.doc;
    const matches: { from: number; to: number }[] = [];
    const searchStr = caseSensitive ? findText : findText.toLowerCase();

    doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        const text = caseSensitive ? node.text : node.text.toLowerCase();
        let index = text.indexOf(searchStr);
        while (index !== -1) {
          matches.push({ from: pos + index, to: pos + index + findText.length });
          index = text.indexOf(searchStr, index + 1);
        }
      }
    });

    setMatchCount(matches.length);
    return matches;
  }, [editor, findText, caseSensitive]);

  // Navigate to match
  const goToMatch = useCallback(
    (direction: "next" | "prev") => {
      const matches = findMatches();
      if (matches.length === 0) return;

      let nextIndex: number;
      if (direction === "next") {
        nextIndex = currentMatch >= matches.length - 1 ? 0 : currentMatch + 1;
      } else {
        nextIndex = currentMatch <= 0 ? matches.length - 1 : currentMatch - 1;
      }

      setCurrentMatch(nextIndex);
      const match = matches[nextIndex];
      if (match && editor) {
        editor.chain().focus().setTextSelection(match).scrollIntoView().run();
      }
    },
    [editor, findMatches, currentMatch],
  );

  // Replace current match
  const handleReplace = useCallback(() => {
    const matches = findMatches();
    if (matches.length === 0 || !editor) return;

    const match = matches[currentMatch];
    if (match) {
      editor.chain().focus().setTextSelection(match).insertContent(replaceText).run();
    }
  }, [editor, findMatches, currentMatch, replaceText]);

  // Replace all matches
  const handleReplaceAll = useCallback(() => {
    if (!editor || !findText) return;

    const doc = editor.state.doc;
    let text = "";
    doc.descendants((node) => {
      if (node.isText) text += node.text;
    });

    // Use editor's search-and-replace approach
    const { tr } = editor.state;
    const searchStr = caseSensitive ? findText : findText.toLowerCase();
    const matches: { from: number; to: number }[] = [];

    doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        const nodeText = caseSensitive ? node.text : node.text.toLowerCase();
        let index = nodeText.indexOf(searchStr);
        while (index !== -1) {
          matches.push({ from: pos + index, to: pos + index + findText.length });
          index = nodeText.indexOf(searchStr, index + 1);
        }
      }
    });

    // Replace from end to start to preserve positions
    for (let i = matches.length - 1; i >= 0; i--) {
      tr.replaceWith(
        matches[i].from,
        matches[i].to,
        editor.state.schema.text(replaceText),
      );
    }

    editor.view.dispatch(tr);
    setMatchCount(0);
    setCurrentMatch(0);
  }, [editor, findText, replaceText, caseSensitive]);

  // Update match count on search text change
  useEffect(() => {
    findMatches();
  }, [findMatches]);

  // Handle keyboard shortcuts inside find bar
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      goToMatch("next");
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      goToMatch("prev");
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="absolute top-0 right-0 z-40 m-3 find-replace-bar"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-popover/95 backdrop-blur-md border border-border/50 rounded-lg overflow-hidden w-80">
        {/* Find row */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border/30">
          <Search className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          <input
            ref={findInputRef}
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Find in document..."
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/40"
          />
          <span className="text-[11px] text-muted-foreground/50 tabular-nums shrink-0 min-w-[40px] text-right">
            {findText ? `${matchCount > 0 ? currentMatch + 1 : 0}/${matchCount}` : ""}
          </span>
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={cn(
              "h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors",
              caseSensitive
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground/40 hover:text-muted-foreground",
            )}
            title="Case sensitive"
          >
            Aa
          </button>
          <button
            onClick={() => goToMatch("prev")}
            className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted shrink-0"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => goToMatch("next")}
            className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted shrink-0"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowReplace(!showReplace)}
            className={cn(
              "h-5 w-5 rounded flex items-center justify-center shrink-0 transition-colors",
              showReplace ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground",
            )}
            title="Toggle replace"
          >
            <Replace className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Replace row */}
        {showReplace && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5">
            <Replace className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            <input
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replace with..."
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/40"
            />
            <button
              onClick={handleReplace}
              disabled={matchCount === 0}
              className="h-6 px-2 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
            >
              Replace
            </button>
            <button
              onClick={handleReplaceAll}
              disabled={matchCount === 0}
              className="h-6 px-2 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
            >
              All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
