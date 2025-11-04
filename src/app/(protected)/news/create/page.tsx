"use client";

import DOMPurify from "dompurify";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { withRoleGuard } from "@/utils/utils/with-role-guard";
import { ERoles } from "../../../../types/roles.enum";

const RichTextEditor = dynamic(() => import("@/app/components/editor/RichTextEditor"), { ssr: false });

function CreateAnnouncementInner() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("RELEASE");
  const [version, setVersion] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [requiresAck, setRequiresAck] = useState(false);
  const [bodyMd, setBodyMd] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [saving, setSaving] = useState(false);

  const tagsString = useMemo(() => tags.join(","), [tags]);

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    const res = await fetch("/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, bodyMd, bodyHtml, category, version, tags, isPinned, requiresAck }),
    });
    if (!res.ok) {
      setSaving(false);
      return;
    }
    const json = await res.json();
    router.push(`/news/${json.slug}`);
  }, [title, bodyMd, bodyHtml, category, version, tags, isPinned, requiresAck, router]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Create Announcement</h1>

      <div className="grid gap-3">
        <input
          className="rounded border px-3 py-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="flex gap-2">
          <select className="rounded border px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="SYSTEM_UPDATE">System Update</option>
            <option value="POLICY_CHANGE">Policy Change</option>
            <option value="TRAINING">Training</option>
            <option value="ALERT">Alert</option>
            <option value="RELEASE">Release</option>
          </select>
          <input
            className="rounded border px-3 py-2"
            placeholder="Version (optional)"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </div>

        <input
          className="rounded border px-3 py-2"
          placeholder="Tags (comma separated)"
          value={tagsString}
          onChange={(e) => setTags(e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
        />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
          Pinned
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={requiresAck} onChange={(e) => setRequiresAck(e.target.checked)} />
          Requires Acknowledgement
        </label>

        <RichTextEditor
          valueHtml={bodyHtml}
          placeholder="Write announcement…"
          onChange={(html, md) => {
            setBodyHtml(html);
            setBodyMd(md);
          }}
        />
      </div>

      <div className="flex gap-2">
        <button className="rounded border px-3 py-1 text-sm" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : "Save Draft"}
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

const CreateAnnouncementPage = withRoleGuard(CreateAnnouncementInner as unknown as React.FC, [ERoles.Admin]);
export default CreateAnnouncementPage;


