import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Dropcursor from "@tiptap/extension-dropcursor";
import Gapcursor from "@tiptap/extension-gapcursor";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";

export function getEditorExtensions() {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      codeBlock: {
        HTMLAttributes: {
          class: "font-mono",
        },
      },
    }),
    Underline,
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Highlight.configure({
      multicolor: true,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "text-primary underline underline-offset-4 cursor-pointer",
      },
    }),
    Image.configure({
      HTMLAttributes: {
        class: "max-w-full h-auto rounded-lg",
      },
      allowBase64: true,
      inline: false,
    }),
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === "heading") {
          return "Heading...";
        }
        return "Start writing your newsletter, or type '/' for commands...";
      },
    }),
    Typography,
    TextStyle,
    Color,
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: "border-collapse",
      },
    }),
    TableRow,
    TableCell,
    TableHeader,
    Dropcursor.configure({
      color: "hsl(252 56% 62%)",
      width: 2,
    }),
    Gapcursor,
    Superscript,
    Subscript,
  ];
}
