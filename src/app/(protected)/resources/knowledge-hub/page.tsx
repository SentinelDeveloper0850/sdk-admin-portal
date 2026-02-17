"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  Info,
  PlusIcon,
  Search,
  Shield,
} from "lucide-react";
import useSWRInfinite from "swr/infinite";

import { useRole } from "@/app/hooks/use-role";
import { ERoles } from "@/types/roles.enum";
import { StarOutlined } from "@ant-design/icons";
import KnowledgeHubHeroSection from "./knowledge-hub-hero-section";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CATEGORY_OPTIONS: Array<{
  value: string;
  label: string;
  icon: React.ReactNode;
}> = [
    {
      value: "CODE_OF_CONDUCT",
      label: "Code of Conduct",
      icon: <Shield className="h-8 w-8" />,
    },
    {
      value: "SOP",
      label: "Standard Operating Procedures",
      icon: <ClipboardList className="h-8 w-8" />,
    },
    {
      value: "HOW_TO",
      label: "How To Guides",
      icon: <HelpCircle className="h-8 w-8" />,
    },
    {
      value: "POLICY",
      label: "Policies",
      icon: <FileText className="h-8 w-8" />,
    },
    {
      value: "TRAINING",
      label: "Training",
      icon: <GraduationCap className="h-8 w-8" />,
    },
    { value: "GENERAL", label: "General", icon: <Info className="h-8 w-8" /> },
  ];

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
  { value: "UNPUBLISHED", label: "Unpublished" },
];

const getCategoryIcon = (category: string) => {
  const cat = CATEGORY_OPTIONS.find((c) => c.value === category);
  return cat?.icon || <FileText className="h-8 w-8" />;
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
    const cursor =
      pageIndex === 0 ? "" : `&cursor=${previousPageData.nextCursor}`;
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
  const showCategories = !hasActiveFilters;

  return (
    <div className="min-h-screen -m-4">
      <KnowledgeHubHeroSection>
        <div className="relative px-4 py-4 md:py-6">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-3xl font-bold text-[#050505]/95 md:text-4xl lg:text-5xl">
              Knowledge Hub
            </h1>

            <p className="mb-8 text-md text-[#050505]/80 md:text-lg">
              Company documents, SOPs, and how-to guides.
            </p>

            <div className="mx-auto max-w-2xl">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Search className="h-5 w-5 text-[#050505]/50" />
                </div>

                <input
                  type="text"
                  placeholder="Search by keyword or phrase..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full rounded-lg border-1 border-[#ffac00]/70
                       bg-white/95 py-4 pl-12 pr-4 text-base shadow-lg
                       placeholder:text-stone-500 
                       focus:outline-none focus:ring-1 focus:ring-[#ffac00]/70
                       dark:bg-white/95 dark:text-[#050505] dark:placeholder:text-dark/50"
                />
              </div>
            </div>
          </div>
        </div>
        {isAdmin && <div className="absolute right-4 top-4">
          <Link href="/knowledge-hub/create" className="hover:text-white">
            <div className="rounded-full bg-[#ffac00] p-2 text-white shadow-lg hover:bg-[#e69500] border border-white transition">
              <PlusIcon className="inline-block h-6 w-6 align-middle" />
            </div>
          </Link>
        </div>}
      </KnowledgeHubHeroSection>

      {/* Main Content */}
      <div className="p-4 mb-8">
        <div className="mx-auto max-w-7xl">
          {showCategories ? (
            /* Category Cards Grid */
            <>
              <h2 className="mb-6 text-xl font-semibold text-stone-600 dark:text-white">
                Browse the Knowledge Hub by category
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className="group flex flex-col items-start gap-4 rounded-lg border border-stone-600 bg-white p-6 text-left transition-all hover:border-stone-300 hover:shadow-lg dark:border-stone-700 dark:bg-stone-800 dark:hover:border-stone-600"
                  >
                    <div className="text-stone-600 transition-transform group-hover:scale-110 dark:text-stone-400">
                      {cat.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-stone-900 group-hover:text-stone-600 dark:text-white dark:group-hover:text-stone-400">
                        {cat.label}
                      </h3>
                    </div>
                    <div className="text-stone-600 opacity-0 transition-opacity group-hover:opacity-100">
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
                  <h2 className="text-xl font-semibold text-stone-900 dark:text-white">
                    {items.length > 0 ? `Search Results (${items.length})` : "Search Results"}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="rounded border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 dark:border-stone-600 dark:bg-stone-800 dark:text-white"
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
                        className="rounded border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 dark:border-stone-600 dark:bg-stone-800 dark:text-white"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="">All statuses</option>
                        {STATUS_OPTIONS.filter((opt) => opt.value).map(
                          (opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          )
                        )}
                      </select>
                    )}
                    {(q || category || status) && (
                      <button
                        onClick={() => {
                          setQ("");
                          setCategory("");
                          setStatus("");
                        }}
                        className="rounded border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:hover:bg-stone-700"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              )}

              {items.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={`/knowledge-hub/${item.slug ?? item.id}`}
                      className="group rounded-lg border border-stone-200 bg-white p-4 transition-all hover:border-yellow-300 hover:shadow-md dark:border-stone-700 dark:bg-stone-800 dark:hover:border-yellow-600"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
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
                            <StarOutlined className="text-stone-400 hover:text-[#ffac00]" />
                          </div>
                          <h3 className="mb-1 text-lg font-semibold text-stone-900 group-hover:text-[#ffac00] dark:text-white dark:group-hover:text-[#ffac00]">
                            {item.title}
                          </h3>
                          {item.summary && (
                            <p className="mb-2 text-sm text-stone-600 dark:text-stone-300">{item.summary}</p>
                          )}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="rounded bg-stone-100 px-2 py-1 text-xs text-stone-600 dark:bg-stone-700 dark:text-stone-300"
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
                <div className="rounded-lg border border-stone-200 bg-white p-12 text-center dark:border-stone-700 dark:bg-stone-800">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-stone-400" />
                  <p className="text-lg font-medium text-stone-900 dark:text-white">No articles found</p>
                  <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              ) : null}

              {/* Load More Button */}
              {data && data[data.length - 1]?.nextCursor && (
                <div className="mt-8 flex justify-center">
                  <button
                    className="rounded-lg border border-stone-300 bg-white px-6 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50 dark:border-stone-600 dark:bg-stone-800 dark:text-white dark:hover:bg-stone-700"
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
