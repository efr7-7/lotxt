import { EditorContent } from "@tiptap/react";
import { useEffect, useCallback, useState, useRef } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { useEditorInstance } from "./EditorContext";
import { SlashCommandMenu } from "./SlashCommandMenu";

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function TiptapEditor() {
  const { currentDocument } = useEditorStore();
  const editor = useEditorInstance();
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

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

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      dragCounter.current = 0;

      if (!editor) return;

      const { files } = e.dataTransfer;

      // Handle image file drops
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.startsWith("image/")) {
            const dataUrl = await readFileAsDataURL(file);
            editor.chain().focus().setImage({ src: dataUrl }).run();
          }
        }
        return;
      }

      // Handle HTML content drops (e.g., dragging images between apps)
      const html = e.dataTransfer.getData("text/html");
      if (html) {
        editor.chain().focus().insertContent(html).run();
        return;
      }

      // Handle plain text drops
      const text = e.dataTransfer.getData("text/plain");
      if (text) {
        editor.chain().focus().insertContent(text).run();
      }
    },
    [editor],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (!editor) return;

      const { items } = e.clipboardData;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const dataUrl = await readFileAsDataURL(file);
            editor.chain().focus().setImage({ src: dataUrl }).run();
          }
          return;
        }
      }
    },
    [editor],
  );

  return (
    <div
      className={`relative ${isDragging ? "editor-drop-active" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onPaste={handlePaste}
    >
      <EditorContent editor={editor} />
      {editor && (
        <SlashCommandMenu editor={editor} onCommand={handleSlashCommand} />
      )}
    </div>
  );
}
