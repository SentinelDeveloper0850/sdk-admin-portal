"use client";

import Link from "next/link";
import { useMemo } from "react";
import useSWRInfinite from "swr/infinite";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function NewsListPage() {
  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.nextCursor) return null;
    const cursor = pageIndex === 0 ? "" : `&cursor=${previousPageData.nextCursor}`;
    return `/api/news?take=20${cursor}`;
  };

  const { data, size, setSize, isValidating } = useSWRInfinite(getKey, fetcher);

  const items = useMemo(() => {
    return (data?.flatMap((d: any) => d.items) ?? []) as Array<{
      id: string;
      title: string;
      category: string;
      publishedAt?: string;
      isPinned?: boolean;
      version?: string;
      slug?: string;
      tags?: string[];
    }>;
  }, [data]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">News & Announcements</h1>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/news/${item.slug ?? item.id}`}
            className="rounded border p-3 hover:bg-muted"
          >
            <div className="flex items-center gap-2">
              {item.isPinned ? <span className="text-xs font-semibold">[PIN]</span> : null}
              <span className="text-sm text-muted-foreground">{item.category}</span>
              {item.version ? <span className="text-xs">• {item.version}</span> : null}
              {item.publishedAt ? (
                <span className="text-xs text-muted-foreground">• {new Date(item.publishedAt).toLocaleDateString()}</span>
              ) : null}
            </div>
            <div className="text-base font-medium">{item.title}</div>
            {item.tags && item.tags.length ? (
              <div className="text-xs text-muted-foreground">Tags: {item.tags.join(", ")}</div>
            ) : null}
          </Link>
        ))}
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


