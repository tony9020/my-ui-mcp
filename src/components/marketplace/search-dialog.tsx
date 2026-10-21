"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CornerDownLeft, Flame, Search, Sparkles, TrendingUp } from "lucide-react";
import { Dialog } from "@/components/ui/overlays";
import { GradientPreview, Avatar } from "@/components/ui/media";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/primitives";
import { useMarketplace } from "@/lib/store";
import { compactNumber, cn } from "@/lib/utils";
import { FEED_RAILS } from "@/data/taxonomy";

interface Result {
  slug: string;
  name: string;
  description: string;
  author: { username: string; name: string; avatar: string };
  previewUrl: string | null;
  gradient: [string, string];
  tags: string[];
  categories: string[];
  downloads: number;
  bookmarks: number;
  license: string;
  registry: string;
}

const QUICK = [
  { label: "Heroes", slug: "hero" },
  { label: "Buttons", slug: "button" },
  { label: "Cards", slug: "card" },
  { label: "Shaders", slug: "shader" },
  { label: "Pricing", slug: "pricing-section" },
  { label: "AI Chats", slug: "ai-chat" },
  { label: "Texts", slug: "text" },
  { label: "Testimonials", slug: "testimonials" },
];

export function SearchDialog() {
  const open = useMarketplace((s) => s.searchOpen);
  const setOpen = useMarketplace((s) => s.setSearchOpen);
  const query = useMarketplace((s) => s.query);
  const setQuery = useMarketplace((s) => s.setQuery);
  const closeSearch = useMarketplace((s) => s.closeSearch);

  const [results, setResults] = React.useState<Result[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  /* --------------------------------------------------- global ⌘K shortcut */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && /input|textarea|select/i.test(target.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useMarketplace.getState().searchOpen ? closeSearch() : useMarketplace.getState().openSearch();
        return;
      }
      if (e.key === "/" && !typing) {
        e.preventDefault();
        useMarketplace.getState().openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeSearch]);

  /* --------------------------------------------------------- debounce fetch */
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=18`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { results: Result[] };
        if (!cancelled) {
          setResults(data.results);
          setActiveIndex(0);
        }
      } catch {
        /* aborted */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, query ? 160 : 0);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(t);
    };
  }, [query, open]);

  /* -------------------------------------------------------------- keyboard */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const r = results[activeIndex];
      if (r) {
        window.location.href = `/@${r.author.username}/components/${r.slug}`;
      }
    }
  };

  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const grouped = React.useMemo(() => {
    if (query.trim()) return null;
    const rail = (slug: string) =>
      results.filter((r) => r.categories.includes(slug)).slice(0, 4);
    return [
      { title: "Trending", icon: <Flame className="size-3.5" />, items: results.slice(0, 4) },
      { title: "New in Heroes", icon: <Sparkles className="size-3.5" />, items: rail("hero") },
      { title: "Popular buttons", icon: <TrendingUp className="size-3.5" />, items: rail("button") },
    ].filter((g) => g.items.length > 0);
  }, [results, query]);

  let flatIndex = -1;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (v ? setOpen(true) : closeSearch())}
      className="max-w-[640px]"
      initialFocusRef={inputRef}
      labelledBy="search-title"
    >
      <h2 id="search-title" className="sr-only">
        Search components
      </h2>

      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          data-autofocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search 8,000+ components, authors, tags…"
          aria-label="Search components"
          aria-controls="search-results"
          role="combobox"
          aria-expanded
          aria-autocomplete="list"
          className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
        {loading ? (
          <span className="size-3.5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
        ) : null}
        <Kbd>Esc</Kbd>
      </div>

      {!query.trim() ? (
        <div className="flex flex-wrap gap-1.5 border-b border-border px-4 py-3">
          {QUICK.map((q) => (
            <Link
              key={q.slug}
              href={`/community/components/s/${q.slug}`}
              onClick={closeSearch}
              className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {q.label}
            </Link>
          ))}
        </div>
      ) : null}

      <div
        ref={listRef}
        id="search-results"
        role="listbox"
        aria-label="Search results"
        className="max-h-[52vh] overflow-y-auto p-2"
      >
        {results.length === 0 && !loading ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium">No components match “{query}”</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a broader term like <span className="text-foreground">hero</span>,{" "}
              <span className="text-foreground">shader</span> or{" "}
              <span className="text-foreground">pricing</span>.
            </p>
          </div>
        ) : grouped ? (
          grouped.map((group) => (
            <section key={group.title} className="mb-2">
              <p className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {group.icon}
                {group.title}
              </p>
              {group.items.map((r) => {
                flatIndex += 1;
                return (
                  <ResultRow
                    key={`${group.title}-${r.slug}-${r.author.username}`}
                    result={r}
                    index={flatIndex}
                    active={flatIndex === activeIndex}
                    onHover={() => setActiveIndex(flatIndex)}
                    onSelect={closeSearch}
                  />
                );
              })}
            </section>
          ))
        ) : (
          results.map((r, i) => (
            <ResultRow
              key={`${r.slug}-${r.author.username}`}
              result={r}
              index={i}
              active={i === activeIndex}
              onHover={() => setActiveIndex(i)}
              onSelect={closeSearch}
            />
          ))
        )}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigate
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>
              <CornerDownLeft className="size-2.5" />
            </Kbd>{" "}
            open
          </span>
        </div>
        <span>{results.length} results</span>
      </div>
    </Dialog>
  );
}

function ResultRow({
  result,
  index,
  active,
  onHover,
  onSelect,
}: {
  result: Result;
  index: number;
  active: boolean;
  onHover: () => void;
  onSelect: () => void;
}) {
  return (
    <Link
      href={`/@${result.author.username}/components/${result.slug}`}
      role="option"
      aria-selected={active}
      data-index={index}
      onMouseEnter={onHover}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
        active ? "bg-muted" : "hover:bg-muted/60",
      )}
    >
      <span className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
        {result.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={result.previewUrl} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <GradientPreview gradient={result.gradient} name={result.name} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{result.name}</span>
          {result.registry === "blocks" ? (
            <Badge variant="outline" className="hidden sm:inline-flex">
              block
            </Badge>
          ) : null}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Avatar src={result.author.avatar} name={result.author.name} size={14} />
          <span className="truncate">{result.author.name}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{compactNumber(result.downloads)} downloads</span>
        </span>
      </span>
      {active ? <ArrowRight className="size-4 shrink-0 text-muted-foreground" /> : null}
    </Link>
  );
}
