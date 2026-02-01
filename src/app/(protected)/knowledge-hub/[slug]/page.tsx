"use client";

import DOMPurify from "dompurify";
import Link from "next/link";
import { useCallback } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import useSWR from "swr";

import PageHeader from "@/app/components/page-header";
import { useRole } from "@/app/hooks/use-role";
import { ERoles } from "@/types/roles.enum";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function KnowledgeArticleDetailPage({ params }: { params: { slug: string } }) {
  const { hasRole } = useRole();
  const isAdmin = hasRole(ERoles.Admin);
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
      <PageHeader
        title={doc.title} isChild
        subtitle={doc.summary ? String(doc.summary) : null}
        actions={[
          isAdmin ? (
            <Link key="edit" className="rounded border px-3 py-1 text-sm" href={`/knowledge-hub/${doc.slug}/edit`}>
              Edit
            </Link>
          ) : null,
          isAdmin ? (
            doc.status === "PUBLISHED" ? (
              <button key="unpublish" className="rounded border px-3 py-1 text-sm" onClick={handleUnpublish}>
                Unpublish
              </button>
            ) : (
              <button key="publish" className="rounded border px-3 py-1 text-sm" onClick={handlePublish}>
                Publish
              </button>
            )
          ) : null,
        ].filter(Boolean)}
        noDivider
      />

      <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
        <span>{doc.category}</span>
        {doc.publishedAt ? <span>• Published {new Date(doc.publishedAt).toLocaleString()}</span> : null}
        {doc.updatedAt ? <span>• Updated {new Date(doc.updatedAt).toLocaleString()}</span> : null}
        {isAdmin ? <span className="font-medium">• {doc.status}</span> : null}
      </div>

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
        <article className="prose dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {doc.bodyMd}
          </ReactMarkdown>
        </article>
      )}
    </div>
  );
}

