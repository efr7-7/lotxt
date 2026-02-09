import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useCallback } from "react";
import { getEditorExtensions } from "@/lib/editor-extensions";
import { useEditorStore } from "@/stores/editor-store";
import { SlashCommandMenu } from "./SlashCommandMenu";

export function TiptapEditor() {
  const { currentDocument, setContent, setWordCount } = useEditorStore();

  const editor = useEditor({
    extensions: getEditorExtensions(),
    content: currentDocument.content || "<p></p>",
    editorProps: {
      attributes: {
        class: "tiptap-editor outline-none min-h-[60vh]",
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const html = editor.getHTML();
      setContent(json, html);

      // Word/char count
      const text = editor.state.doc.textContent;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      setWordCount(words, chars);
    },
  });

  // Sync document content when switching documents
  useEffect(() => {
    if (editor && currentDocument.content) {
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(currentDocument.content);
      if (currentContent !== newContent) {
        editor.commands.setContent(currentDocument.content);
      }
    }
  }, [currentDocument.id]);

  // Handle slash commands
  const handleSlashCommand = useCallback(
    (command: string) => {
      if (!editor) return;

      // Delete the slash character first
      const { from } = editor.state.selection;
      editor.chain().focus().deleteRange({ from: from - 1, to: from }).run();

      switch (command) {
        case "heading1":
          editor.chain().focus().toggleHeading({ level: 1 }).run();
          break;
        case "heading2":
          editor.chain().focus().toggleHeading({ level: 2 }).run();
          break;
        case "heading3":
          editor.chain().focus().toggleHeading({ level: 3 }).run();
          break;
        case "bulletlist":
          editor.chain().focus().toggleBulletList().run();
          break;
        case "numberedlist":
          editor.chain().focus().toggleOrderedList().run();
          break;
        case "blockquote":
          editor.chain().focus().toggleBlockquote().run();
          break;
        case "codeblock":
          editor.chain().focus().toggleCodeBlock().run();
          break;
        case "divider":
          editor.chain().focus().setHorizontalRule().run();
          break;
        case "image":
          {
            const url = prompt("Enter image URL:");
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }
          break;
        case "table":
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run();
          break;
      }
    },
    [editor],
  );

  return (
    <div className="relative">
      <EditorContent editor={editor} />
      {editor && (
        <SlashCommandMenu editor={editor} onCommand={handleSlashCommand} />
      )}
    </div>
  );
}
