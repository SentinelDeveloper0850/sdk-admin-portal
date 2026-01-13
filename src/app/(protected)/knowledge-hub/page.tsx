"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWRInfinite from "swr/infinite";

import { Button } from "antd";
import {
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  Info,
  Search,
  Shield
} from "lucide-react";

import { useRole } from "@/app/hooks/use-role";
import { ERoles } from "@/types/roles.enum";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CATEGORY_OPTIONS: Array<{ value: string; label: string; icon: React.ReactNode }> = [
  { value: "CODE_OF_CONDUCT", label: "Code of Conduct", icon: <Shield className="w-8 h-8" /> },
  { value: "SOP", label: "Standard Operating Procedures", icon: <ClipboardList className="w-8 h-8" /> },
  { value: "HOW_TO", label: "How To Guides", icon: <HelpCircle className="w-8 h-8" /> },
  { value: "POLICY", label: "Policies", icon: <FileText className="w-8 h-8" /> },
  { value: "TRAINING", label: "Training", icon: <GraduationCap className="w-8 h-8" /> },
  { value: "GENERAL", label: "General", icon: <Info className="w-8 h-8" /> },
];

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
  { value: "UNPUBLISHED", label: "Unpublished" },
];

const getCategoryIcon = (category: string) => {
  const cat = CATEGORY_OPTIONS.find((c) => c.value === category);
  return cat?.icon || <FileText className="w-8 h-8" />;
};

const getCategoryLabel = (category: string) => {
  const cat = CATEGORY_OPTIONS.find((c) => c.value === category);
  return cat?.label || category;
};

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

  const hasActiveFilters = q.trim() || category || status;
  const showCategories = !hasActiveFilters && !items.length;

  return (
    <div className="min-h-screen -m-4">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-900 dark:via-blue-800 dark:to-indigo-900"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(96, 165, 250, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(147, 197, 253, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 40% 20%, rgba(165, 180, 252, 0.2) 0%, transparent 50%)`,
        }}
      >
        {/* Geometric Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px),
                              repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)`,
          }}
        />

        <div className="relative px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            {/* Header with Create Button (Admin only) */}
            {isAdmin && (
              <div className="mb-6 flex justify-end">
                <Link href="/knowledge-hub/create">
                  <Button type="primary" className="bg-white text-blue-700 hover:bg-gray-100">
                    Create Article
                  </Button>
                </Link>
              </div>
            )}

            {/* Main Heading */}
            <h1 className="mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              Knowledge Hub
            </h1>
            <p className="mb-8 text-lg text-blue-100 md:text-xl">
              Company documents, SOPs, and how-to guides.
            </p>

            {/* Search Bar */}
            <div className="mx-auto max-w-2xl">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by keyword or phrase..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full rounded-lg border-0 bg-white py-4 pl-12 pr-4 text-base shadow-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              {/* Additional Filters (Hidden by default, shown when needed) */}
              {(category || (isAdmin && status)) && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <select
                    className="rounded border border-white/30 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50 dark:bg-white/5"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">All categories</option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="text-gray-900">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {isAdmin && (
                    <select
                      className="rounded border border-white/30 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50 dark:bg-white/5"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="">All statuses</option>
                      {STATUS_OPTIONS.filter((opt) => opt.value).map((opt) => (
                        <option key={opt.value} value={opt.value} className="text-gray-900">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          {showCategories ? (
            /* Category Cards Grid */
            <>
              <h2 className="mb-6 text-2xl font-semibold text-blue-600 dark:text-blue-400">
                Browse the Knowledge Hub by category
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className="group flex flex-col items-start gap-4 rounded-lg border border-gray-200 bg-white p-6 text-left transition-all hover:border-blue-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
                  >
                    <div className="text-blue-600 transition-transform group-hover:scale-110 dark:text-blue-400">
                      {cat.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                        {cat.label}
                      </h3>
                    </div>
                    <div className="text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                      →
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Articles List */
            <>
              {hasActiveFilters && (
                <div className="mb-6 flex flex-wrap items-center gap-4">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {items.length > 0 ? `Search Results (${items.length})` : "Search Results"}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">All categories</option>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {isAdmin && (
                      <select
                        className="rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="">All statuses</option>
                        {STATUS_OPTIONS.filter((opt) => opt.value).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {(q || category || status) && (
                      <button
                        onClick={() => {
                          setQ("");
                          setCategory("");
                          setStatus("");
                        }}
                        className="rounded border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              )}

              {items.length > 0 ? (
                <div className="grid gap-4">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={`/knowledge-hub/${item.slug ?? item.id}`}
                      className="group rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 text-blue-600 dark:text-blue-400">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div className="flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>{getCategoryLabel(item.category)}</span>
                            {item.publishedAt && (
                              <>
                                <span>•</span>
                                <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                              </>
                            )}
                            {isAdmin && item.status !== "PUBLISHED" && (
                              <>
                                <span>•</span>
                                <span className="font-semibold">{item.status}</span>
                              </>
                            )}
                          </div>
                          <h3 className="mb-1 text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                            {item.title}
                          </h3>
                          {item.summary && (
                            <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">{item.summary}</p>
                          )}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : hasActiveFilters ? (
                <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-lg font-medium text-gray-900 dark:text-white">No articles found</p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              ) : null}

              {/* Load More Button */}
              {data && data[data.length - 1]?.nextCursor && (
                <div className="mt-8 flex justify-center">
                  <button
                    className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                    onClick={() => setSize(size + 1)}
                    disabled={isValidating}
                  >
                    {isValidating ? "Loading..." : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}