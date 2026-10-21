"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Sparkles } from "lucide-react";
import { ResultsGrid, SortBar } from "./component-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMarketplace } from "@/lib/store";
import type { ComponentRecord } from "@/lib/types";
import { sortComponents, type SortKey } from "@/lib/sort";
import { cn } from "@/lib/utils";

/**
 * Category grid with instant client-side sorting + filtering.
 * The server ships the category's components; the zustand store drives
 * sort order, license/free filters, tag chips and grid/list presentation.
 */
export function CategoryBrowser({
  title,
  description,
  components,
  tag,
  related,
  total,
  apiCategory,
}: {
  title: string;
  description: string;
  components: ComponentRecord[];
  tag: string;
  related: { slug: string; name: string; count: number | null }[];
  total?: number;
  apiCategory?: string;
}) {
  const sort = useMarketplace((s) => s.sort);
  const activeTags = useMarketplace((s) => s.activeTags);
  const toggleTag = useMarketplace((s) => s.toggleTag);
  const license = useMarketplace((s) => s.license);
  const freeOnly = useMarketplace((s) => s.freeOnly);

  const [items, setItems] = React.useState(components);
  const [serverTotal, setServerTotal] = React.useState(total ?? components.length);
  const [loadingMore, setLoadingMore] = React.useState(false);

  // Reset the accumulated pages when navigating between categories/views.
  React.useEffect(() => {
    setItems(components);
    setServerTotal(total ?? components.length);
    setLoadingMore(false);
  }, [tag, components, total]);

  const loadMore = React.useCallback(async () => {
    if (loadingMore || items.length >= serverTotal) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        category: apiCategory ?? tag,
        sort,
        limit: "60",
        offset: String(items.length),
      });
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        total?: number;
        results?: ComponentRecord[];
      };
      if (typeof data.total === "number") setServerTotal(data.total);
      const incoming = data.results ?? [];
      setItems((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...incoming.filter((c) => !seen.has(c.id))];
      });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, items.length, serverTotal, apiCategory, tag, sort]);

  // seed filters from ?tags= / ?license= / ?sort= read off the URL.
  // Reading window.location (instead of useSearchParams) keeps these pages
  // fully static — no client-side-rendering bailout at build time.
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qTags = params.get("tags");
    const qLicense = params.get("license");
    const qSort = params.get("sort");
    const sorts: SortKey[] = ["recommended", "downloads", "bookmarks", "newest"];
    useMarketplace.setState({
      activeTags: qTags ? qTags.split(",").filter(Boolean) : [],
      license: qLicense === "mit" ? "mit" : "any",
      sort: sorts.includes(qSort as SortKey) ? (qSort as SortKey) : "recommended",
    });
  }, [tag]);

  const filtered = React.useMemo(() => {
    let list = items;
    if (activeTags.length) {
      list = list.filter((c) => activeTags.every((t) => c.tags.includes(t) || c.categories.includes(t)));
    }
    if (license === "mit") list = list.filter((c) => c.license.toUpperCase().includes("MIT"));
    if (freeOnly) list = list.filter((c) => c.license.toLowerCase() !== "no-license");
    return sortComponents(list, sort);
  }, [items, activeTags, license, freeOnly, sort]);

  const facets = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of items) for (const t of c.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14);
  }, [items]);

  return (
    <div className="px-4 py-6 sm:px-6">
      <header className="max-w-[70ch]">
        <h1 className="text-[26px] font-medium tracking-tight">{title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{description}</p>
      </header>

      {/* facet chips */}
      {facets.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center gap-1.5">
          {facets.map(([name, count]) => {
            const active = activeTags.includes(name);
            return (
              <button
                key={name}
                type="button"
                aria-pressed={active}
                onClick={() => toggleTag(name)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                  active
                    ? "border-brand/50 bg-brand-muted text-brand dark:bg-brand/15 dark:text-[#8f9dff]"
                    : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                )}
              >
                {name}
                <span className="tabular-nums opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-6">
        <SortBar count={filtered.length} total={serverTotal} />
      </div>

      <div className="mt-8">
        <ResultsGrid
          components={filtered}
          emptyState={
            <div>
              <p className="text-sm font-medium">
                Nothing matches those filters in {title.replace(" Components", "")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Clear a filter to see all {items.length} loaded components.
              </p>
              <button
                onClick={() => useMarketplace.getState().clearFilters()}
                className="mt-4 rounded-full bg-foreground px-4 py-2 text-[13px] font-medium text-background"
              >
                Reset filters
              </button>
            </div>
          }
        />
      </div>

      {/* pagination / load more */}
      <div className="mt-10 flex flex-col items-center gap-3 border-t border-border pt-6">
        <p className="text-[13px] tabular-nums text-muted-foreground">
          Showing {items.length.toLocaleString()} of {serverTotal.toLocaleString()} components
        </p>
        {items.length < serverTotal ? (
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadingMore}
            className="gap-2 rounded-full px-5"
          >
            {loadingMore ? <Loader2 className="size-4 animate-spin" /> : null}
            {loadingMore
              ? "Loading…"
              : `Load ${Math.min(60, serverTotal - items.length).toLocaleString()} more`}
          </Button>
        ) : null}
      </div>

      {/* related categories */}
      {related.length > 0 ? (
        <section className="mt-16 border-t border-border pt-8">
          <h2 className="flex items-center gap-2 text-[17px] font-medium">
            <Sparkles className="size-4 text-brand" />
            Explore more
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/community/components/s/${r.slug}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-foreground/20"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{r.name} components</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {r.count != null ? `${r.count} in the library` : "New collection"}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge variant="muted">tag:{tag}</Badge>
            <span className="text-[13px] text-muted-foreground">
              {serverTotal.toLocaleString()} components indexed under this category
            </span>
          </div>
        </section>
      ) : null}
    </div>
  );
}
