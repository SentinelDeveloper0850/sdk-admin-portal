"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWRInfinite from "swr/infinite";

import { Button } from "antd";

import PageHeader from "@/app/components/page-header";
import { useRole } from "@/app/hooks/use-role";
import { ERoles } from "@/types/roles.enum";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "All categories" },
  { value: "CODE_OF_CONDUCT", label: "Code of Conduct" },
  { value: "SOP", label: "Standard Operating Procedures" },
  { value: "HOW_TO", label: "How To Guides" },
  { value: "POLICY", label: "Policies" },
  { value: "TRAINING", label: "Training" },
  { value: "GENERAL", label: "General" },
];

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
  { value: "UNPUBLISHED", label: "Unpublished" },
];

export default function KnowledgeHubListPage() {
  const { hasRole } = useRole();
  const isAdmin = hasRole(ERoles.Admin);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.nextCursor) return null;
    const cursor = pageIndex === 0 ? "" : `&cursor=${previousPageData.nextCursor}`;
    const qs = new URLSearchParams();
    qs.set("take", "20");
    if (q.trim()) qs.set("q", q.trim());
    if (category) qs.set("category", category);
    if (isAdmin && status) qs.set("status", status);
    return `/api/knowledge?${qs.toString()}${cursor}`;
  };

  const { data, size, setSize, isValidating } = useSWRInfinite(getKey, fetcher);

  const items = useMemo(() => {
    return (data?.flatMap((d: any) => d.items) ?? []) as Array<{
      id: string;
      title: string;
      summary?: string;
      category: string;
      status: string;
      publishedAt?: string;
      updatedAt?: string;
      slug?: string;
      tags?: string[];
    }>;
  }, [data]);

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title="Knowledge Hub"
        subtitle="Company documents, SOPs, and how-to guides."
        actions={[
          hasRole([ERoles.Admin]) ? (
            <Link key="create-knowledge-article" href="/knowledge-hub/create">
              <Button type="primary" className="text-black">
                Create Article
              </Button>
            </Link>
          ) : null,
        ].filter(Boolean)}
        noDivider
      />

      <div className="grid gap-2 md:grid-cols-3">
        <input
          className="rounded border px-3 py-2"
          placeholder="Search (title, content, tags)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="rounded border px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value || "ALL"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {isAdmin ? (
          <select className="rounded border px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "ALL"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <div />
        )}
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/knowledge-hub/${item.slug ?? item.id}`}
            className="rounded border p-3 hover:bg-muted"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">{item.category}</span>
              {item.publishedAt ? (
                <span className="text-xs text-muted-foreground">• {new Date(item.publishedAt).toLocaleDateString()}</span>
              ) : null}
              {isAdmin && item.status !== "PUBLISHED" ? (
                <span className="text-xs font-semibold">• {item.status}</span>
              ) : null}
            </div>
            <div className="text-base font-medium">{item.title}</div>
            {item.summary ? <div className="text-sm text-muted-foreground">{item.summary}</div> : null}
            {item.tags && item.tags.length ? (
              <div className="text-xs text-muted-foreground">Tags: {item.tags.join(", ")}</div>
            ) : null}
          </Link>
        ))}
        {!items.length ? <div className="text-sm text-muted-foreground">No articles found.</div> : null}
      </div>

      <div className="flex justify-center p-2">
        {data && data[data.length - 1]?.nextCursor ? (
          <button
            className="rounded border px-3 py-1 text-sm"
            onClick={() => setSize(size + 1)}
            disabled={isValidating}
          >
            {isValidating ? "Loading..." : "Load more"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

