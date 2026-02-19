"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { OutputData } from "@editorjs/editorjs";
import { Select } from "antd";
import DOMPurify from "dompurify";
import useSWR from "swr";

import { withRoleGuard } from "@/utils/utils/with-role-guard";

import {
  editorJsToHtml,
  editorJsToMarkdown,
} from "@/app/components/editor/editorjs-converters";

import { ERoles } from "@/types/roles.enum";

const EditorJsEditor = dynamic(
  () => import("@/app/components/editor/EditorJsEditor"),
  { ssr: false }
);
const fetcher = (url: string) => fetch(url).then((r) => r.json());

function EditKnowledgeArticleInner({ params }: { params: { slug: string } }) {
  const { data, isLoading, mutate } = useSWR(
    `/api/knowledge/${params.slug}`,
    fetcher
  );
  const lastDocIdRef = useRef<string | null>(null);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [tags, setTags] = useState<string[]>([]);
  const [bodyJson, setBodyJson] = useState<OutputData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setTitle(data.title ?? "");
    setSummary(data.summary ?? "");
    setCategory(data.category ?? "GENERAL");
    setTags(Array.isArray(data.tags) ? data.tags : []);

    // Initialize Editor.js data when switching documents (slug/id change).
    const nextId = data.id ? String(data.id) : null;
    if (nextId && lastDocIdRef.current !== nextId) {
      lastDocIdRef.current = nextId;
      const fromJson =
        data.bodyJson && typeof data.bodyJson === "object"
          ? (data.bodyJson as OutputData)
          : null;
      if (fromJson?.blocks) {
        setBodyJson(fromJson);
      } else {
        const fallbackText = String(data.bodyMd ?? "");
        setBodyJson({
          time: Date.now(),
          blocks: fallbackText
            ? [{ type: "paragraph", data: { text: fallbackText } }]
            : [],
          version: "2.0.0",
        } as unknown as OutputData);
      }
    }
  }, [data]);

  const derived = useMemo(() => {
    const bodyHtml = editorJsToHtml(bodyJson);
    const bodyMd = editorJsToMarkdown(bodyJson);
    return { bodyHtml, bodyMd };
  }, [bodyJson]);

  const handleSave = useCallback(async () => {
    if (!data?.id) return;
    setSaving(true);
    const res = await fetch(`/api/knowledge/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        summary,
        bodyMd: derived.bodyMd || " ",
        bodyHtml: derived.bodyHtml || "",
        bodyJson,
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
    derived.bodyMd,
    derived.bodyHtml,
    bodyJson,
    category,
    tags,
    mutate,
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

        {bodyJson ? (
          <EditorJsEditor
            key={data?.id ? String(data.id) : params.slug}
            initialData={bodyJson}
            placeholder="Write article…"
            onChange={(next) => setBodyJson(next)}
          />
        ) : (
          <div className="text-muted-foreground rounded-md border bg-background px-3 py-2 text-sm">
            Loading editor…
          </div>
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
        {derived.bodyHtml ? (
          <article
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(derived.bodyHtml, {
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
        ) : (
          <div className="text-muted-foreground text-sm">
            Start writing to see a preview…
          </div>
        )}
      </div>
    </div>
  );
}

const EditKnowledgeArticlePage = withRoleGuard(
  EditKnowledgeArticleInner as unknown as React.FC,
  [ERoles.Admin]
);
export default EditKnowledgeArticlePage;
