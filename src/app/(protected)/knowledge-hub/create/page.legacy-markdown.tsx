"use client";

/**
 * LEGACY (kept for reference):
 * Markdown upload + markdown textarea + optional RichTextEditor implementation.
 *
 * This file is not routed by Next.js (only `page.tsx` is).
 */
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { Select } from "antd";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { withRoleGuard } from "@/utils/utils/with-role-guard";

import { ERoles } from "../../../../types/roles.enum";

const RichTextEditor = dynamic(
  () => import("@/app/components/editor/RichTextEditor"),
  { ssr: false }
);

function CreateKnowledgeArticleInner() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [tags, setTags] = useState<string[]>([]);
  const [bodyMd, setBodyMd] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [editorMode, setEditorMode] = useState<"markdown" | "rich">("markdown");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const applyMarkdown = useCallback(
    (md: string, sourceFileName?: string) => {
      setUploadError(null);
      setBodyMd(md);
      // In markdown mode we intentionally clear HTML to avoid stale/incorrect previews & saves.
      setBodyHtml("");

      if (sourceFileName) {
        setUploadedFileName(sourceFileName);
        if (!title.trim()) {
          const base = sourceFileName.replace(/\.md$/i, "");
          const pretty = base.replace(/[_-]+/g, " ").trim();
          if (pretty) setTitle(pretty);
        }
      }
    },
    [title]
  );

  const handlePickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      const name = file.name || "";
      const looksLikeMd = /\.md$/i.test(name) || file.type === "text/markdown";
      if (!looksLikeMd) {
        setUploadError("Please upload a Markdown (.md) file.");
        return;
      }
      try {
        const text = await file.text();
        applyMarkdown(text, name || "uploaded.md");
        setEditorMode("markdown");
      } catch {
        setUploadError("Could not read the file. Please try again.");
      }
    },
    [applyMarkdown]
  );

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        summary,
        bodyMd,
        bodyHtml,
        category,
        tags,
      }),
    });
    if (!res.ok) {
      setSaving(false);
      return;
    }
    const json = await res.json();
    router.push(`/knowledge-hub/${json.slug}`);
  }, [title, summary, bodyMd, bodyHtml, category, tags, router]);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-semibold">Create Knowledge Article</h1>

      <div className="grid gap-3">
        <input
          className="rounded border px-3 py-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="min-h-20 rounded border px-3 py-2"
          placeholder="Summary (optional)"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />

        <select
          className="rounded border px-3 py-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="CODE_OF_CONDUCT">Code of Conduct</option>
          <option value="SOP">Standard Operating Procedures</option>
          <option value="HOW_TO">How To Guide</option>
          <option value="POLICY">Policy</option>
          <option value="TRAINING">Training</option>
          <option value="GENERAL">General</option>
        </select>

        <Select
          mode="tags"
          value={tags}
          onChange={(next) =>
            setTags(Array.isArray(next) ? next.map(String) : [])
          }
          tokenSeparators={[","]}
          placeholder="Tags"
          style={{ width: "100%" }}
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Editor</span>
          <button
            type="button"
            className={`rounded border px-2 py-1 text-sm ${editorMode === "markdown" ? "bg-muted" : ""}`}
            onClick={() => {
              setEditorMode("markdown");
              // ensure markdown saves don't accidentally prefer stale rich HTML
              setBodyHtml("");
            }}
          >
            Markdown
          </button>
          <button
            type="button"
            className={`rounded border px-2 py-1 text-sm ${editorMode === "rich" ? "bg-muted" : ""}`}
            onClick={() => setEditorMode("rich")}
          >
            Rich text
          </button>
          <span className="text-muted-foreground text-xs">
            {editorMode === "markdown"
              ? "Upload or paste Markdown."
              : "Uses the built-in rich text editor."}
          </span>
        </div>

        {editorMode === "markdown" ? (
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,text/markdown"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            <div
              className="rounded border border-dashed px-3 py-3 text-sm"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void handleFile(e.dataTransfer.files?.[0]);
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Drop a</span>
                <span className="font-medium">.md</span>
                <span className="text-muted-foreground">file here, or</span>
                <button
                  type="button"
                  className="underline"
                  onClick={handlePickFile}
                >
                  choose a file
                </button>
                <span className="text-muted-foreground">.</span>
              </div>
              {uploadedFileName ? (
                <div className="text-muted-foreground mt-2 text-xs">
                  Loaded: {uploadedFileName}
                </div>
              ) : null}
              {uploadError ? (
                <div className="mt-2 text-xs text-red-600">{uploadError}</div>
              ) : null}
            </div>

            <textarea
              className="h-60 w-full rounded border px-3 py-2 font-mono"
              placeholder="Write Markdown here..."
              value={bodyMd}
              onChange={(e) => applyMarkdown(e.target.value)}
            />
          </div>
        ) : (
          <RichTextEditor
            valueHtml={bodyHtml}
            placeholder="Write article…"
            onChange={(html, md) => {
              setBodyHtml(html);
              setBodyMd(md);
            }}
          />
        )}
      </div>

      <div className="flex gap-2">
        <button
          className="rounded border px-3 py-1 text-sm"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save draft"}
        </button>
      </div>

      <div className="pt-4">
        <h2 className="mb-2 text-sm font-semibold">Preview</h2>
        {editorMode === "markdown" ? (
          <article className="prose dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
            >
              {bodyMd}
            </ReactMarkdown>
          </article>
        ) : (
          <article
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(bodyHtml, {
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
              }) as string,
            }}
          />
        )}
      </div>
    </div>
  );
}

const CreateKnowledgeArticleLegacyMarkdownPage = withRoleGuard(
  CreateKnowledgeArticleInner as unknown as React.FC,
  [ERoles.Admin]
);
export default CreateKnowledgeArticleLegacyMarkdownPage;
