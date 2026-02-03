"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import type { OutputData } from "@editorjs/editorjs";
import { Select } from "antd";
import DOMPurify from "dompurify";

import { withRoleGuard } from "@/utils/utils/with-role-guard";

import {
  editorJsToHtml,
  editorJsToMarkdown,
} from "@/app/components/editor/editorjs-converters";

import { ERoles } from "../../../../types/roles.enum";

const EditorJsEditor = dynamic(
  () => import("@/app/components/editor/EditorJsEditor"),
  { ssr: false }
);

function CreateKnowledgeArticleInner() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [tags, setTags] = useState<string[]>([]);
  const [bodyJson, setBodyJson] = useState<OutputData | null>(null);
  const [saving, setSaving] = useState(false);

  const derived = useMemo(() => {
    const bodyHtml = editorJsToHtml(bodyJson);
    const bodyMd = editorJsToMarkdown(bodyJson);
    return { bodyHtml, bodyMd };
  }, [bodyJson]);

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    const res = await fetch("/api/knowledge", {
      method: "POST",
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
    if (!res.ok) {
      setSaving(false);
      return;
    }
    const json = await res.json();
    router.push(`/knowledge-hub/${json.slug}`);
  }, [
    title,
    summary,
    derived.bodyMd,
    derived.bodyHtml,
    bodyJson,
    category,
    tags,
    router,
  ]);

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

        <EditorJsEditor
          placeholder="Write article…"
          onChange={(data) => {
            setBodyJson(data);
          }}
        />
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

const CreateKnowledgeArticlePage = withRoleGuard(
  CreateKnowledgeArticleInner as unknown as React.FC,
  [ERoles.Admin]
);
export default CreateKnowledgeArticlePage;
