"use client";

import DOMPurify from "dompurify";
import Link from "next/link";
import { useCallback } from "react";
import useSWR from "swr";

import { useRole } from "@/app/hooks/use-role";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function KnowledgeArticleDetailPage({ params }: { params: { slug: string } }) {
  const { isAdmin } = useRole();
  const { data, isLoading, mutate } = useSWR(`/api/knowledge/${params.slug}`, fetcher);

  const doc = data;

  const handlePublish = useCallback(async () => {
    if (!doc?.id) return;
    await fetch(`/api/knowledge/${doc.id}/publish`, { method: "POST" });
    await mutate();
  }, [doc?.id, mutate]);

  const handleUnpublish = useCallback(async () => {
    if (!doc?.id) return;
    await fetch(`/api/knowledge/${doc.id}/unpublish`, { method: "POST" });
    await mutate();
  }, [doc?.id, mutate]);

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (!doc) return <div className="p-4">Not found</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{doc.title}</h1>
        <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
          <span>{doc.category}</span>
          {doc.publishedAt ? <span>• Published {new Date(doc.publishedAt).toLocaleString()}</span> : null}
          {doc.updatedAt ? <span>• Updated {new Date(doc.updatedAt).toLocaleString()}</span> : null}
          {isAdmin ? <span className="font-medium">• {doc.status}</span> : null}
        </div>
        {doc.summary ? <p className="text-sm text-muted-foreground">{doc.summary}</p> : null}
      </div>

      {isAdmin ? (
        <div className="flex flex-wrap gap-2">
          <Link className="rounded border px-3 py-1 text-sm" href={`/knowledge-hub/${doc.slug}/edit`}>
            Edit
          </Link>
          {doc.status === "PUBLISHED" ? (
            <button className="rounded border px-3 py-1 text-sm" onClick={handleUnpublish}>
              Unpublish
            </button>
          ) : (
            <button className="rounded border px-3 py-1 text-sm" onClick={handlePublish}>
              Publish
            </button>
          )}
        </div>
      ) : null}

      {doc.tags && doc.tags.length ? (
        <div className="text-xs text-muted-foreground">Tags: {doc.tags.join(", ")}</div>
      ) : null}

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

