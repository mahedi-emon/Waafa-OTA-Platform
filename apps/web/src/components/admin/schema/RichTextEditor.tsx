"use client";

import { useEffect } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { cn } from "cn";
import { RichTextTool as Tool } from "./RichTextTool";

export type RichTextStrings = {
  toolbar: string;
  paragraph: string;
  heading3: string;
  bold: string;
  italic: string;
  bulletList: string;
  orderedList: string;
  quote: string;
  link: string;
  unlink: string;
  /** The prompt asking for a link address. */
  linkPrompt: string;
  undo: string;
  redo: string;
};

type RichTextEditorProps = {
  id: string;
  /** The field's label: a content-editable area is not labelled by <label for>. */
  label: string;
  value: string;
  onChange: (html: string) => void;
  describedBy?: string;
  invalid?: boolean;
  strings: RichTextStrings;
};

/** Only links the site's sanitiser keeps: https, mailto, tel and site paths. */
function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (/^(https:\/\/|mailto:|tel:|\/)/i.test(href)) return href;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(href)) return `https://${href}`;
  return null;
}

/**
 * Rich text for page, blog, guide and policy bodies (issue 116): paragraphs, H2 and H3, bold, italic, lists, quotes
 * and links, with undo. It writes HTML; the server sanitises it before the site renders it (RichText).
 */
function RichTextEditor({
  id,
  label,
  value,
  onChange,
  describedBy,
  invalid,
  strings,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // The site turns every body heading into an h3 (sanitizeRichText), so the editor offers that one level.
        heading: { levels: [3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: {
          openOnClick: false,
          autolink: true,
          protocols: ["https", "mailto", "tel"],
          HTMLAttributes: { rel: "noopener noreferrer", target: null },
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(invalid ? { "aria-invalid": "true" } : {}),
        class:
          "min-h-48 px-4 py-3 text-[15px] leading-relaxed text-ink-900 outline-none [&_a]:text-brand-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-mist-300 [&_blockquote]:pl-3 [&_h3]:mt-3 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.isEmpty ? "" : current.getHTML());
    },
  });

  // Content replaced from outside (JSON tab, reset): load it without losing the cursor on every keystroke.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (value !== editor.getHTML() && !(value === "" && editor.isEmpty)) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current
        ? {
            paragraph: current.isActive("paragraph"),
            h3: current.isActive("heading", { level: 3 }),
            bold: current.isActive("bold"),
            italic: current.isActive("italic"),
            bullet: current.isActive("bulletList"),
            ordered: current.isActive("orderedList"),
            quote: current.isActive("blockquote"),
            link: current.isActive("link"),
            canUndo: current.can().undo(),
            canRedo: current.can().redo(),
          }
        : null,
  });

  function setLink() {
    if (!editor) return;
    const current = (editor.getAttributes("link").href as string | undefined) ?? "";
    const entered = window.prompt(strings.linkPrompt, current);
    if (entered === null) return;
    const href = safeHref(entered);
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-mist-300 bg-white focus-within:border-electric-600 focus-within:ring-3 focus-within:ring-ring/30",
        invalid && "border-danger-600",
      )}
    >
      <div
        role="toolbar"
        aria-label={strings.toolbar}
        aria-controls={id}
        className="flex flex-wrap gap-0.5 border-b border-mist-200 bg-mist-25 p-1.5"
      >
        <Tool
          label={strings.paragraph}
          active={state?.paragraph ?? false}
          onClick={() => editor?.chain().focus().setParagraph().run()}
        >
          <Pilcrow aria-hidden="true" />
        </Tool>
        <Tool
          label={strings.heading3}
          active={state?.h3 ?? false}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 aria-hidden="true" />
        </Tool>
        <span aria-hidden="true" className="mx-1 my-1.5 w-px bg-mist-200" />
        <Tool
          label={strings.bold}
          active={state?.bold ?? false}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold aria-hidden="true" />
        </Tool>
        <Tool
          label={strings.italic}
          active={state?.italic ?? false}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic aria-hidden="true" />
        </Tool>
        <Tool
          label={strings.bulletList}
          active={state?.bullet ?? false}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List aria-hidden="true" />
        </Tool>
        <Tool
          label={strings.orderedList}
          active={state?.ordered ?? false}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered aria-hidden="true" />
        </Tool>
        <Tool
          label={strings.quote}
          active={state?.quote ?? false}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote aria-hidden="true" />
        </Tool>
        <Tool label={strings.link} active={state?.link ?? false} onClick={setLink}>
          <Link2 aria-hidden="true" />
        </Tool>
        <Tool
          label={strings.unlink}
          disabled={!state?.link}
          onClick={() => editor?.chain().focus().extendMarkRange("link").unsetLink().run()}
        >
          <Link2Off aria-hidden="true" />
        </Tool>
        <span aria-hidden="true" className="mx-1 my-1.5 w-px bg-mist-200" />
        <Tool
          label={strings.undo}
          disabled={!state?.canUndo}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 aria-hidden="true" />
        </Tool>
        <Tool
          label={strings.redo}
          disabled={!state?.canRedo}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 aria-hidden="true" />
        </Tool>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export { RichTextEditor };
