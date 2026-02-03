"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Button } from "antd";
import useSWRInfinite from "swr/infinite";

import PageHeader from "@/app/components/page-header";
import { useRole } from "@/app/hooks/use-role";
import { ERoles } from "@/types/roles.enum";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function NewsListPage() {
  const { hasRole } = useRole();
  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.nextCursor) return null;
    const cursor =
      pageIndex === 0 ? "" : `&cursor=${previousPageData.nextCursor}`;
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
    <div className="space-y-4 p-4">
      <PageHeader
        title="News & Announcements"
        subtitle="Company updates, operational alerts, and staff announcements."
        actions={[
          hasRole([ERoles.Admin]) ? (
            <Link key="create-announcement" href="/news/create">
              <Button type="primary" className="text-black">
                Create Announcement
              </Button>
            </Link>
          ) : null,
        ].filter(Boolean)}
        noDivider
      />

      <div className="grid gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/news/${item.slug ?? item.id}`}
            className="hover:bg-muted rounded border p-3"
          >
            <div className="flex items-center gap-2">
              {item.isPinned ? (
                <span className="text-xs font-semibold">[PIN]</span>
              ) : null}
              <span className="text-muted-foreground text-sm">
                {item.category}
              </span>
              {item.version ? (
                <span className="text-xs">• {item.version}</span>
              ) : null}
              {item.publishedAt ? (
                <span className="text-muted-foreground text-xs">
                  • {new Date(item.publishedAt).toLocaleDateString()}
                </span>
              ) : null}
            </div>
            <div className="text-base font-medium">{item.title}</div>
            {item.tags && item.tags.length ? (
              <div className="text-muted-foreground text-xs">
                Tags: {item.tags.join(", ")}
              </div>
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
