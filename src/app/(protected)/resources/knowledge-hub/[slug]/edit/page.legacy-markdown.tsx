"use client";

/**
 * LEGACY (kept for reference):
 * Markdown upload + markdown textarea + optional RichTextEditor implementation.
 *
 * This file is not routed by Next.js (only `page.tsx` is).
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Select } from "antd";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import useSWR from "swr";

import { withRoleGuard } from "@/utils/utils/with-role-guard";

import { ERoles } from "../../../../../types/roles.enum";

const RichTextEditor = dynamic(
  () => import("@/app/components/editor/RichTextEditor"),
  { ssr: false }
);
const fetcher = (url: string) => fetch(url).then((r) => r.json());

function EditKnowledgeArticleInner({ params }: { params: { slug: string } }) {
  const { data, isLoading, mutate } = useSWR(
    `/api/knowledge/${params.slug}`,
    fetcher
  );
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

  useEffect(() => {
    if (!data) return;
    setTitle(data.title ?? "");
    setSummary(data.summary ?? "");
    setCategory(data.category ?? "GENERAL");
    setTags(Array.isArray(data.tags) ? data.tags : []);
    setBodyMd(data.bodyMd ?? "");
    setBodyHtml(data.bodyHtml ?? "");
  }, [data]);

  const applyMarkdown = useCallback((md: string, sourceFileName?: string) => {
    setUploadError(null);
    setBodyMd(md);
    // avoid stale HTML when editing markdown
    setBodyHtml("");
    if (sourceFileName) setUploadedFileName(sourceFileName);
  }, []);

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

  const handleSave = useCallback(async () => {
    if (!data?.id) return;
    setSaving(true);
    const res = await fetch(`/api/knowledge/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        summary,
        bodyMd,
        bodyHtml: editorMode === "markdown" ? "" : bodyHtml,
        category,
        tags,
      }),
    });
    setSaving(false);
    if (res.ok) mutate();
  }, [
    data?.id,
    title,
    summary,
    bodyMd,
    bodyHtml,
    category,
    tags,
    mutate,
    editorMode,
  ]);

  const handlePublish = useCallback(async () => {
    if (!data?.id) return;
    await fetch(`/api/knowledge/${data.id}/publish`, { method: "POST" });
    await mutate();
  }, [data?.id, mutate]);

  const handleUnpublish = useCallback(async () => {
    if (!data?.id) return;
    await fetch(`/api/knowledge/${data.id}/unpublish`, { method: "POST" });
    await mutate();
  }, [data?.id, mutate]);

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (!data) return <div className="p-4">Not found</div>;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit Knowledge Article</h1>
        <Link
          className="text-sm underline"
          href={`/knowledge-hub/${data.slug}`}
        >
          View
        </Link>
      </div>

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
            onClick={() => setEditorMode("markdown")}
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

      <div className="flex flex-wrap gap-2">
        <button
          className="rounded border px-3 py-1 text-sm"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {data.status === "PUBLISHED" ? (
          <button
            className="rounded border px-3 py-1 text-sm"
            onClick={handleUnpublish}
          >
            Unpublish
          </button>
        ) : (
          <button
            className="rounded border px-3 py-1 text-sm"
            onClick={handlePublish}
          >
            Publish
          </button>
        )}
        <span className="text-muted-foreground self-center text-sm">
          Status: {data.status}
        </span>
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

const EditKnowledgeArticleLegacyMarkdownPage = withRoleGuard(
  EditKnowledgeArticleInner as unknown as React.FC,
  [ERoles.Admin]
);
export default EditKnowledgeArticleLegacyMarkdownPage;
