"use client";

import DOMPurify from "dompurify";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { withRoleGuard } from "@/utils/utils/with-role-guard";
import { ERoles } from "../../../../types/roles.enum";

const RichTextEditor = dynamic(() => import("@/app/components/editor/RichTextEditor"), { ssr: false });

function CreateKnowledgeArticleInner() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [tags, setTags] = useState<string[]>([]);
  const [bodyMd, setBodyMd] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [saving, setSaving] = useState(false);

  const tagsString = useMemo(() => tags.join(","), [tags]);

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, summary, bodyMd, bodyHtml, category, tags }),
    });
    if (!res.ok) {
      setSaving(false);
      return;
    }
    const json = await res.json();
    router.push(`/knowledge-hub/${json.slug}`);
  }, [title, summary, bodyMd, bodyHtml, category, tags, router]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Create Knowledge Article</h1>

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

      <div className="flex gap-2">
        <button className="rounded border px-3 py-1 text-sm" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : "Save draft"}
        </button>
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

const CreateKnowledgeArticlePage = withRoleGuard(CreateKnowledgeArticleInner as unknown as React.FC, [ERoles.Admin]);
export default CreateKnowledgeArticlePage;

