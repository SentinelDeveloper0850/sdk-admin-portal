"use client";

import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Config as DomPurifyConfig } from "dompurify";
import DOMPurify from "dompurify";
import {
  Bold,
  Braces,
  Code,
  Eraser,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { useEffect } from "react";
import TurndownService from "turndown";

import { Button } from "@/app/components/ui/button";

type Props = {
  valueHtml?: string;
  placeholder?: string;
  onChange?: (html: string, md: string) => void;
};

export default function RichTextEditor({ valueHtml, placeholder, onChange }: Props) {
  const SANITIZE: DomPurifyConfig = {
    ALLOWED_TAGS: [
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "em",
      "u",
      "s",
      "a",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "hr",
      "span",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
  };
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: valueHtml || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert max-w-none min-h-48 rounded-md border bg-background px-3 py-2 text-sm",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const clean = DOMPurify.sanitize(html, SANITIZE) as string;
      const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
      // Preserve single line breaks inside paragraphs
      // TipTap outputs <p>..</p> with <br> for soft breaks; turndown by default handles <br> to \n
      const md = turndown.turndown(clean);
      onChange?.(clean, md);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (typeof valueHtml === "string" && valueHtml !== editor.getHTML()) {
      editor.commands.setContent(valueHtml);
    }
  }, [valueHtml, editor]);

  if (!editor) return null;

  const promptLink = () => {
    const url = window.prompt("Enter URL");
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} data-active={editor.isActive("bold")}
          className={editor.isActive("bold") ? "bg-muted" : ""}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "bg-muted" : ""}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive("underline") ? "bg-muted" : ""}>
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive("strike") ? "bg-muted" : ""}>
          <Strikethrough className="h-4 w-4" />
        </Button>

        <span className="mx-2 inline-block h-6 w-px bg-border align-middle" />

        <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}>
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive("heading", { level: 3 }) ? "bg-muted" : ""}>
          <Heading3 className="h-4 w-4" />
        </Button>

        <span className="mx-2 inline-block h-6 w-px bg-border align-middle" />

        <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive("bulletList") ? "bg-muted" : ""}>
          <List className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive("orderedList") ? "bg-muted" : ""}>
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive("blockquote") ? "bg-muted" : ""}>
          <Quote className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive("code") ? "bg-muted" : ""}>
          <Code className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive("codeBlock") ? "bg-muted" : ""}>
          <Braces className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={promptLink} className={editor.isActive("link") ? "bg-muted" : ""}>
          <LinkIcon className="h-4 w-4" />
        </Button>

        <span className="mx-2 inline-block h-6 w-px bg-border align-middle" />

        <Button variant="outline" size="sm" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      {placeholder && !editor.getText().length ? (
        <div className="pointer-events-none select-none text-muted-foreground text-sm">
          {placeholder}
        </div>
      ) : null}

      <div className="rounded-md border">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}


