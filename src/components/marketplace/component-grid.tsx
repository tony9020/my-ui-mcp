"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";
import { ComponentCard, ComponentListRow } from "./component-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from "@/components/ui/menu";
import { Skeleton, Switch } from "@/components/ui/primitives";
import { SORT_OPTIONS, type SortValue } from "@/data/taxonomy";
import { useMarketplace } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ComponentRecord } from "@/lib/types";

/* ------------------------------------------------------------------- Rails */

export function SectionRail({
  title,
  href,
  components,
  variant = "grid",
}: {
  title: string;
  href?: string;
  components: ComponentRecord[];
  variant?: "grid" | "wide";
}) {
  return (
    <section className="py-2">
      <div className="mb-3 flex items-center justify-between gap-4 px-4 sm:px-6">
        <h2 className="text-[19px] font-medium tracking-tight">{title}</h2>
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-0.5 text-[15px] text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
            <ChevronRight className="size-4" />
          </Link>
        ) : null}
      </div>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:px-6">
        {components.map((c, i) => (
          <div
            key={c.id}
            className={cn(
              "shrink-0 snap-start",
              variant === "wide" ? "w-[min(78vw,520px)]" : "w-[min(70vw,300px)]",
            )}
          >
            <ComponentCard component={c} showStats={variant === "wide"} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Sort bar */

export function SortBar({
  count,
  total,
  right,
  className,
}: {
  count: number;
  total?: number;
  right?: React.ReactNode;
  className?: string;
}) {
  const sort = useMarketplace((s) => s.sort);
  const setSort = useMarketplace((s) => s.setSort);
  const view = useMarketplace((s) => s.view);
  const setView = useMarketplace((s) => s.setView);
  const activeTags = useMarketplace((s) => s.activeTags);
  const toggleTag = useMarketplace((s) => s.toggleTag);
  const clearFilters = useMarketplace((s) => s.clearFilters);
  const license = useMarketplace((s) => s.license);
  const setLicense = useMarketplace((s) => s.setLicense);
  const freeOnly = useMarketplace((s) => s.freeOnly);
  const setFreeOnly = useMarketplace((s) => s.setFreeOnly);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select
            value={sort}
            onChange={(v) => setSort(v as SortValue)}
            options={SORT_OPTIONS}
            ariaLabel="Sort components"
            size="sm"
          />
          <span className="hidden text-[13px] tabular-nums text-muted-foreground sm:inline">
            {!activeTags.length && license === "any" && !freeOnly && total && total > count
              ? `${count.toLocaleString()} of ${total.toLocaleString()} components`
              : `${count.toLocaleString()} components`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {right}
          <Dropdown
            label="Filter components"
            align="end"
            contentClassName="w-64"
            trigger={({ open, toggle }) => (
              <Button variant="outline" size="sm" onClick={toggle} aria-expanded={open} className="gap-1.5">
                <SlidersHorizontal className="size-3.5" />
                Filter
                {activeTags.length + (license !== "any" || freeOnly ? 1 : 0) > 0 ? (
                  <span className="ml-0.5 grid size-4 place-items-center rounded-full bg-brand text-[10px] font-semibold text-brand-foreground">
                    {activeTags.length + (license !== "any" || freeOnly ? 1 : 0)}
                  </span>
                ) : null}
              </Button>
            )}
          >
            {({ close }) => (
              <>
                <DropdownLabel>License</DropdownLabel>
                {(
                  [
                    { v: "any", l: "Any license" },
                    { v: "mit", l: "MIT only" },
                  ] as const
                ).map((o) => (
                  <DropdownItem key={o.v} active={license === o.v} onClick={() => setLicense(o.v)}>
                    {o.l}
                  </DropdownItem>
                ))}
                <DropdownSeparator />
                <div className="px-3 py-2">
                  <Switch checked={freeOnly} onCheckedChange={setFreeOnly} label="Free components only" />
                </div>
                {activeTags.length > 0 ? (
                  <>
                    <DropdownSeparator />
                    <DropdownLabel>Active tags</DropdownLabel>
                    <div className="flex flex-wrap gap-1 px-3 pb-2">
                      {activeTags.map((t) => (
                        <Badge key={t} variant="muted" className="gap-1">
                          {t}
                          <button
                            onClick={() => toggleTag(t)}
                            aria-label={`Remove ${t} filter`}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="size-2.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </>
                ) : null}
                <DropdownSeparator />
                <DropdownItem
                  onClick={() => {
                    clearFilters();
                    close();
                  }}
                >
                  Reset all filters
                </DropdownItem>
              </>
            )}
          </Dropdown>

          <div className="hidden items-center rounded-full border border-border p-0.5 sm:flex">
            {(
              [
                { v: "grid", icon: LayoutGrid, label: "Grid view" },
                { v: "list", icon: List, label: "List view" },
              ] as const
            ).map((o) => (
              <button
                key={o.v}
                type="button"
                aria-label={o.label}
                aria-pressed={view === o.v}
                onClick={() => setView(o.v)}
                className={cn(
                  "grid size-7 place-items-center rounded-full transition-colors",
                  view === o.v ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <o.icon className="size-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeTags.map((t) => (
            <Badge key={t} variant="outline" className="gap-1 py-0.5">
              {t}
              <button onClick={() => toggleTag(t)} aria-label={`Remove ${t}`}>
                <X className="size-2.5" />
              </button>
            </Badge>
          ))}
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ Results grid */

export function ResultsGrid({
  components,
  loading,
  emptyState,
}: {
  components: ComponentRecord[];
  loading?: boolean;
  emptyState?: React.ReactNode;
}) {
  const view = useMarketplace((s) => s.view);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            <Skeleton className="mt-3 h-4 w-1/2" />
            <Skeleton className="mt-2 h-3 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (components.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-20 text-center">
        {emptyState ?? (
          <>
            <p className="text-sm font-medium">No components found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try removing a filter or searching a different term.</p>
          </>
        )}
      </div>
    );
  }

  if (view === "list") {
    return (
      <div className="flex flex-col gap-1">
        {components.map((c) => (
          <ComponentListRow key={c.id} component={c} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
      {components.map((c, i) => (
        <ComponentCard key={c.id} component={c} priority={i < 3} />
      ))}
    </div>
  );
}
