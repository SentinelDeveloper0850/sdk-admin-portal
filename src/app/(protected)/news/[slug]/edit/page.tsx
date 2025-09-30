"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import useSWR from "swr";

import { withRoleGuard } from "@/utils/utils/with-role-guard";
import { ERoles } from "../../../../../../types/roles.enum";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function EditAnnouncementInner({ params }: { params: { slug: string } }) {
  const { data, isLoading, mutate } = useSWR(`/api/news/${params.slug}`, fetcher);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("RELEASE");
  const [version, setVersion] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [requiresAck, setRequiresAck] = useState(false);
  const [bodyMd, setBodyMd] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setTitle(data.title ?? "");
    setCategory(data.category ?? "RELEASE");
    setVersion(data.version ?? "");
    setTags(Array.isArray(data.tags) ? data.tags : []);
    setIsPinned(!!data.isPinned);
    setRequiresAck(!!data.requiresAck);
    setBodyMd(data.bodyMd ?? "");
  }, [data]);

  const tagsString = useMemo(() => tags.join(","), [tags]);

  const handleSave = useCallback(async () => {
    if (!data?.id) return;
    setSaving(true);
    const res = await fetch(`/api/news/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, bodyMd, category, version, tags, isPinned, requiresAck }),
    });
    setSaving(false);
    if (res.ok) mutate();
  }, [data?.id, title, bodyMd, category, version, tags, isPinned, requiresAck, mutate]);

  const handlePublish = useCallback(async () => {
    if (!data?.id) return;
    await fetch(`/api/news/${data.id}/publish`, { method: "POST" });
    await mutate();
  }, [data?.id, mutate]);

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (!data) return <div className="p-4">Not found</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Edit Announcement</h1>

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

        <textarea
          className="rounded border px-3 py-2 h-60 font-mono"
          placeholder="Write Markdown here..."
          value={bodyMd}
          onChange={(e) => setBodyMd(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button className="rounded border px-3 py-1 text-sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button className="rounded border px-3 py-1 text-sm" onClick={handlePublish}>
          Publish
        </button>
      </div>

      <div className="pt-4">
        <h2 className="text-sm font-semibold mb-2">Preview</h2>
        <article className="prose dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{bodyMd}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}

const EditAnnouncementPage = withRoleGuard(EditAnnouncementInner as unknown as React.FC, [ERoles.Admin]);
export default EditAnnouncementPage;


