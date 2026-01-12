"use client";

import DOMPurify from "dompurify";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { withRoleGuard } from "@/utils/utils/with-role-guard";
import { ERoles } from "../../../../../types/roles.enum";

const RichTextEditor = dynamic(() => import("@/app/components/editor/RichTextEditor"), { ssr: false });
const fetcher = (url: string) => fetch(url).then((r) => r.json());

function EditKnowledgeArticleInner({ params }: { params: { slug: string } }) {
  const { data, isLoading, mutate } = useSWR(`/api/knowledge/${params.slug}`, fetcher);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [tags, setTags] = useState<string[]>([]);
  const [bodyMd, setBodyMd] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
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

  const tagsString = useMemo(() => tags.join(","), [tags]);

  const handleSave = useCallback(async () => {
    if (!data?.id) return;
    setSaving(true);
    const res = await fetch(`/api/knowledge/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, summary, bodyMd, bodyHtml, category, tags }),
    });
    setSaving(false);
    if (res.ok) mutate();
  }, [data?.id, title, summary, bodyMd, bodyHtml, category, tags, mutate]);

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
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit Knowledge Article</h1>
        <Link className="text-sm underline" href={`/knowledge-hub/${data.slug}`}>
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
          className="rounded border px-3 py-2 min-h-20"
          placeholder="Summary (optional)"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />

        <select className="rounded border px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="CODE_OF_CONDUCT">Code of Conduct</option>
          <option value="SOP">Standard Operating Procedures</option>
          <option value="HOW_TO">How To Guide</option>
          <option value="POLICY">Policy</option>
          <option value="TRAINING">Training</option>
          <option value="GENERAL">General</option>
        </select>

        <input
          className="rounded border px-3 py-2"
          placeholder="Tags (comma separated)"
          value={tagsString}
          onChange={(e) => setTags(e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
        />

        <RichTextEditor
          valueHtml={bodyHtml}
          placeholder="Write article…"
          onChange={(html, md) => {
            setBodyHtml(html);
            setBodyMd(md);
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="rounded border px-3 py-1 text-sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        {data.status === "PUBLISHED" ? (
          <button className="rounded border px-3 py-1 text-sm" onClick={handleUnpublish}>
            Unpublish
          </button>
        ) : (
          <button className="rounded border px-3 py-1 text-sm" onClick={handlePublish}>
            Publish
          </button>
        )}
        <span className="text-sm text-muted-foreground self-center">Status: {data.status}</span>
      </div>

      <div className="pt-4">
        <h2 className="text-sm font-semibold mb-2">Preview</h2>
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
      </div>
    </div>
  );
}

const EditKnowledgeArticlePage = withRoleGuard(EditKnowledgeArticleInner as unknown as React.FC, [ERoles.Admin]);
export default EditKnowledgeArticlePage;

