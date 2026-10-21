"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import { Avatar, GradientPreview } from "@/components/ui/media";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/menu";
import { compactNumber, timeAgoCalendar, cn } from "@/lib/utils";

export interface AuthorCardData {
  username: string;
  name: string;
  avatar: string;
  components: number;
  views: number;
  bookmarks: number;
  downloads: number;
  since: string | null;
  /** a representative component, used for the thumbnail */
  sample: { name: string; slug: string; preview: string | null; gradient: [string, string] } | null;
}

type SortValue = "views" | "components" | "downloads" | "newest";

const SORTS: { value: SortValue; label: string }[] = [
  { value: "views", label: "Most viewed" },
  { value: "components", label: "Most components" },
  { value: "downloads", label: "Most downloaded" },
  { value: "newest", label: "Recently joined" },
];

export function AuthorDirectory({ authors }: { authors: AuthorCardData[] }) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortValue>("views");

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? authors.filter((a) => `${a.name} ${a.username}`.toLowerCase().includes(q))
      : authors;
    const copy = [...list];
    switch (sort) {
      case "components":
        return copy.sort((a, b) => b.components - a.components);
      case "downloads":
        return copy.sort((a, b) => b.downloads - a.downloads);
      case "newest":
        return copy.sort(
          (a, b) => new Date(b.since ?? 0).getTime() - new Date(a.since ?? 0).getTime(),
        );
      default:
        return copy.sort((a, b) => b.views - a.views);
    }
  }, [authors, query, sort]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs items={SORTS} value={sort} onChange={(v) => setSort(v as SortValue)} size="sm" />
        <label className="relative inline-flex w-full items-center sm:w-72">
          <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators…"
            aria-label="Search creators"
            className="h-9 w-full rounded-full border border-border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
          />
        </label>
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((a) => (
          <li key={a.username}>
            <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-foreground/20">
              <Link
                href={`/@${a.username}`}
                className="relative block aspect-[16/9] overflow-hidden border-b border-border bg-muted"
                aria-label={`${a.name}'s profile`}
              >
                {a.sample?.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.sample.preview}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <GradientPreview
                    gradient={a.sample?.gradient ?? ["#6d28d9", "#15101b"]}
                    name={a.name}
                  />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                {a.sample ? (
                  <span className="absolute inset-x-3 bottom-3 truncate text-[11px] text-white/85">
                    {a.sample.name}
                  </span>
                ) : null}
              </Link>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-3">
                  <Avatar src={a.avatar} name={a.name} size={40} ring />
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-medium leading-tight">
                      <Link href={`/@${a.username}`} className="transition-colors hover:text-brand">
                        {a.name}
                      </Link>
                    </h3>
                    <p className="truncate text-[13px] text-muted-foreground">@{a.username}</p>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-[12px]">
                  <div>
                    <dt className="text-muted-foreground">Components</dt>
                    <dd className="mt-0.5 font-medium tabular-nums">{a.components}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Views</dt>
                    <dd className="mt-0.5 font-medium tabular-nums">{compactNumber(a.views)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Bookmarks</dt>
                    <dd className="mt-0.5 font-medium tabular-nums">{compactNumber(a.bookmarks)}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <Badge variant="muted">Joined {timeAgoCalendar(a.since)}</Badge>
                  <Badge variant="outline" className={cn("gap-1")}>
                    <Download className="size-3" />
                    {compactNumber(a.downloads)}
                  </Badge>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>

      {visible.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">No creators match “{query}”.</p>
      ) : null}
    </div>
  );
}
