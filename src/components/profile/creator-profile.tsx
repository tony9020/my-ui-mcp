"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, Download, Eye, Layers, Search } from "lucide-react";
import { ResultsGrid } from "@/components/marketplace/component-grid";
import { Avatar } from "@/components/ui/media";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/menu";
import { compactNumber, timeAgoCalendar, cn } from "@/lib/utils";
import { sortComponents, type SortKey } from "@/lib/sort";
import type { AuthorSummary } from "@/lib/data";
import type { ComponentRecord, CreatorProfile } from "@/lib/types";

const PROFILE_TABS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "downloads", label: "Most downloaded" },
  { value: "bookmarks", label: "Most bookmarked" },
];

/**
 * Creator profile page.
 * The server ships the author's whole catalogue; this client view adds local
 * search, sort tabs and a facet-chip filter without a round-trip.
 */
export function CreatorProfileView({
  profile,
  related,
}: {
  profile: CreatorProfile;
  related: AuthorSummary[];
}) {
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [query, setQuery] = React.useState("");
  const [tag, setTag] = React.useState<string | null>(null);

  const facets = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of profile.components) for (const t of c.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [profile.components]);

  const visible = React.useMemo(() => {
    let list: ComponentRecord[] = profile.components;
    if (tag) list = list.filter((c) => c.tags.includes(tag) || c.categories.includes(tag));
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        `${c.name} ${c.description} ${c.tags.join(" ")} ${c.categories.join(" ")}`
          .toLowerCase()
          .includes(q),
      );
    }
    return sortComponents(list, sort);
  }, [profile.components, tag, query, sort]);

  const stats = [
    { icon: Layers, label: "components", value: profile.components.length },
    { icon: Download, label: "downloads", value: profile.totalDownloads },
    { icon: Eye, label: "views", value: profile.totalViews },
    { icon: Bookmark, label: "bookmarks", value: profile.totalBookmarks },
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6">
      {/* ------------------------------------------------------------- hero */}
      <header className="relative overflow-hidden rounded-3xl border border-border bg-card">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-32 h-64 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(60% 90% at 22% 100%, color-mix(in oklab, var(--brand) 26%, transparent), transparent 70%)",
          }}
        />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
          <Avatar src={profile.avatar} name={profile.name} size={92} ring className="text-2xl" />

          <div className="min-w-0 flex-1">
            <h1 className="text-[clamp(24px,3vw,32px)] font-medium leading-tight tracking-tight">
              {profile.name}
            </h1>
            <p className="mt-1 text-[15px] text-muted-foreground">@{profile.username}</p>
            <p className="mt-3 max-w-[60ch] text-pretty text-[15px] leading-relaxed text-muted-foreground">
              Design engineer shipping production React and Tailwind interfaces. {profile.components.length}{" "}
              components published on My Ui
              {profile.since ? `, the first back in ${new Date(profile.since).getFullYear()}` : ""}.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="new">Design engineer</Badge>
              <Badge variant="muted">Member since {timeAgoCalendar(profile.since)}</Badge>
            </div>
          </div>

          <dl className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-2">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-wide text-muted-foreground">
                  <s.icon className="size-3.5" />
                  {s.label}
                </dt>
                <dd className="mt-0.5 text-[22px] font-medium tabular-nums tracking-tight">
                  {compactNumber(s.value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* --------------------------------------------------------- catalogue */}
      <section className="mt-10">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs
              items={PROFILE_TABS}
              value={sort}
              onChange={(v) => setSort(v as SortKey)}
              variant="segmented"
            />

            <label className="relative inline-flex w-full items-center sm:w-72">
              <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${profile.name}'s components…`}
                className="h-9 rounded-full pl-9"
                aria-label="Search this creator's components"
              />
            </label>
          </div>

          {facets.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {facets.map(([name, count]) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={tag === name}
                  onClick={() => setTag(tag === name ? null : name)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                    tag === name
                      ? "border-brand/50 bg-brand-muted text-brand dark:bg-brand/15 dark:text-[#8f9dff]"
                      : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                  )}
                >
                  {name}
                  <span className="tabular-nums opacity-60">{count}</span>
                </button>
              ))}
              {tag || query ? (
                <button
                  type="button"
                  onClick={() => {
                    setTag(null);
                    setQuery("");
                  }}
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Clear
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <p className="mt-4 text-[13px] tabular-nums text-muted-foreground">
          {visible.length} of {profile.components.length} components
        </p>

        <div className="mt-4">
          <ResultsGrid
            components={visible}
            emptyState={
              <div>
                <p className="text-sm font-medium">No components match that search</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different term or clear the filter.
                </p>
              </div>
            }
          />
        </div>
      </section>

      {/* ------------------------------------------------- related creators */}
      {related.length > 0 ? (
        <section className="mt-16 border-t border-border pt-8">
          <h2 className="text-[17px] font-medium">More creators like {profile.name.split(" ")[0]}</h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <Link
                key={a.username}
                href={`/@${a.username}`}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
              >
                <Avatar src={a.avatar} name={a.name} size={40} ring />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium transition-colors group-hover:text-brand">
                    {a.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {a.components} components · {compactNumber(a.views)} views
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
