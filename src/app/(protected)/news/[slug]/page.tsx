"use client";

import DOMPurify from "dompurify";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function NewsDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR(`/api/news/${params.slug}`, fetcher);

  const doc = data;

  const handleMarkRead = useCallback(async () => {
    if (!doc?.id) return;
    await fetch(`/api/news/${doc.id}/read`, { method: "POST" });
    await mutate();
  }, [doc?.id, mutate]);

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (!doc) return <div className="p-4">Not found</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{doc.title}</h1>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span>{doc.category}</span>
          {doc.version ? <span>• {doc.version}</span> : null}
          {doc.publishedAt ? (
            <span>• {new Date(doc.publishedAt).toLocaleString()}</span>
          ) : null}
          {doc.isPinned ? <span className="font-medium">• Pinned</span> : null}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className="rounded border px-3 py-1 text-sm"
          onClick={handleMarkRead}
          disabled={doc.hasRead}
        >
          {doc.hasRead ? "Read" : "Mark as Read"}
        </button>
      </div>

      {doc.bodyHtml ? (
        <article
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(doc.bodyHtml, {
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
        <article className="prose dark:prose-invert max-w-none whitespace-pre-wrap">{doc.bodyMd}</article>
      )}
    </div>
  );
}


