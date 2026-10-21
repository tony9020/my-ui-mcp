import dataset from "@/data/components.json";
import { CATEGORY_GROUPS } from "@/data/taxonomy";
import type { ComponentDataset, ComponentRecord, CreatorProfile } from "./types";
import { popularity, sortComponents, type SortKey } from "./sort";

export { sortComponents, popularity };
export type { SortKey };

const DATA = dataset as unknown as ComponentDataset;
const ALL: ComponentRecord[] = DATA.components;

/* ------------------------------------------------------------------ indexes */

const byKey = new Map<string, ComponentRecord>();
const bySlug = new Map<string, ComponentRecord>();
const byAuthor = new Map<string, ComponentRecord[]>();
const byCategory = new Map<string, ComponentRecord[]>();
const categoryMeta = new Map<string, { slug: string; name: string; count: number | null }>();

for (const group of CATEGORY_GROUPS) {
  for (const item of group.items) categoryMeta.set(item.slug, item);
}

for (const c of ALL) {
  byKey.set(`${c.author.username}/${c.slug}`, c);
  if (!bySlug.has(c.slug)) bySlug.set(c.slug, c);
  const list = byAuthor.get(c.author.username) ?? [];
  list.push(c);
  byAuthor.set(c.author.username, list);
  for (const cat of c.categories) {
    const bucket = byCategory.get(cat) ?? [];
    bucket.push(c);
    byCategory.set(cat, bucket);
  }
}

/* ------------------------------------------------------------------ helpers */

export function getAllComponents(): ComponentRecord[] {
  return ALL;
}

export function getTotalCount(): number {
  return ALL.length;
}

export function getRealCount(): number {
  return ALL.filter((c) => !c.generated).length;
}

export function getComponent(username: string, slug: string): ComponentRecord | undefined {
  return byKey.get(`${username}/${slug}`) ?? bySlug.get(slug);
}

export function getComponentBySlug(slug: string): ComponentRecord | undefined {
  return bySlug.get(slug);
}

export function getComponentsByCategory(
  category: string,
  { sort = "recommended", limit, offset = 0 }: { sort?: SortKey; limit?: number; offset?: number } = {},
): ComponentRecord[] {
  const base = category === "all" ? ALL : (byCategory.get(category) ?? []);
  const sorted = sortComponents(base, sort);
  if (limit == null) return sorted.slice(offset);
  return sorted.slice(offset, offset + limit);
}

export function getCategoryCount(category: string): number {
  if (category === "all") return ALL.length;
  return byCategory.get(category)?.length ?? 0;
}

export function getCategoryMeta(slug: string) {
  return categoryMeta.get(slug) ?? { slug, name: slug, count: null };
}

/** Newest-first rail. */
export function getNewest(limit = 10): ComponentRecord[] {
  return sortComponents(ALL, "newest").slice(0, limit);
}

/** Popular rail — real components only so the thumbnails stay on-brand. */
export function getPopular(limit = 10): ComponentRecord[] {
  return sortComponents(
    ALL.filter((c) => !c.generated),
    "downloads",
  ).slice(0, limit);
}

export function getFeatured(limit = 10): ComponentRecord[] {
  const featured = ALL.filter((c) => !c.generated && c.bookmarks > 40);
  return sortComponents(featured.length ? featured : ALL.filter((c) => !c.generated), "recommended").slice(0, limit);
}

export function getRail(slug: string, limit = 10): ComponentRecord[] {
  switch (slug) {
    case "newest":
      return getNewest(limit);
    case "popular":
      return getPopular(limit);
    default:
      return getComponentsByCategory(slug, { limit });
  }
}

export function searchComponents(query: string, limit = 40, offset = 0): ComponentRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  const scored: { c: ComponentRecord; score: number }[] = [];
  for (const c of ALL) {
    const haystack = `${c.name} ${c.description} ${c.tags.join(" ")} ${c.categories.join(" ")} ${c.author.username} ${c.author.name}`.toLowerCase();
    if (!terms.every((t) => haystack.includes(t))) continue;
    let score = 0;
    if (c.name.toLowerCase() === q) score += 120;
    if (c.name.toLowerCase().startsWith(q)) score += 60;
    if (c.name.toLowerCase().includes(q)) score += 30;
    if (c.tags.some((t) => t.toLowerCase() === q)) score += 25;
    if (!c.generated) score += 40;
    score += Math.min(popularity(c) / 400, 30);
    scored.push({ c, score });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(offset, offset + limit)
    .map((s) => s.c);
}

/** Number of components in a view: all / newest / popular / featured. */
export function getViewTotal(view: string): number {
  if (view === "featured") {
    const featured = ALL.filter((c) => !c.generated && c.bookmarks > 40);
    return featured.length || ALL.filter((c) => !c.generated).length;
  }
  return ALL.length;
}

export function getRelated(component: ComponentRecord, limit = 12): ComponentRecord[] {
  const scored: { c: ComponentRecord; score: number }[] = [];
  for (const c of ALL) {
    if (c.id === component.id) continue;
    let score = 0;
    for (const cat of c.categories) if (component.categories.includes(cat)) score += 10;
    for (const tag of c.tags) if (component.tags.includes(tag)) score += 6;
    if (c.author.username === component.author.username) score += 4;
    if (!c.generated) score += 5;
    if (score > 0) scored.push({ c, score });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.c);
}

export function getAuthorProfile(username: string): CreatorProfile | undefined {
  const components = byAuthor.get(username);
  if (!components || components.length === 0) return undefined;
  const sorted = sortComponents(components, "downloads");
  const first = sorted[0];
  let since: string | null = null;
  for (const c of components) {
    if (c.createdAt && (!since || c.createdAt < since)) since = c.createdAt;
  }
  return {
    username,
    name: first.author.name || username,
    avatar: first.author.avatar,
    components: sorted,
    totalViews: components.reduce((a, c) => a + c.views, 0),
    totalBookmarks: components.reduce((a, c) => a + c.bookmarks, 0),
    totalDownloads: components.reduce((a, c) => a + c.downloads, 0),
    since,
  };
}

export interface AuthorSummary {
  username: string;
  name: string;
  avatar: string;
  components: number;
  views: number;
  bookmarks: number;
}

export function getAllAuthors(): AuthorSummary[] {
  const out: AuthorSummary[] = [];
  for (const [username, components] of byAuthor) {
    if (components.length < 1) continue;
    const first = components[0];
    out.push({
      username,
      name: first.author.name || username,
      avatar: first.author.avatar,
      components: components.length,
      views: components.reduce((a, c) => a + c.views, 0),
      bookmarks: components.reduce((a, c) => a + c.bookmarks, 0),
    });
  }
  return out.sort((a, b) => b.views - a.views);
}

export function getRelatedAuthors(username: string, limit = 5): AuthorSummary[] {
  const mine = new Set(byAuthor.get(username)?.flatMap((c) => c.categories) ?? []);
  return getAllAuthors()
    .filter((a) => a.username !== username)
    .map((a) => {
      const theirs = byAuthor.get(a.username) ?? [];
      const overlap = theirs.filter((c) => c.categories.some((cat) => mine.has(cat))).length;
      return { a, overlap };
    })
    .sort((x, y) => y.overlap - x.overlap || y.a.views - x.a.views)
    .slice(0, limit)
    .map((x) => x.a);
}

export function getAllLibraries(): { name: string; author: string; slug: string; count: number }[] {
  // Libraries are modelled as authors with 2+ components — enough to render the rail.
  return getAllAuthors()
    .filter((a) => a.components >= 1)
    .slice(0, 24)
    .map((a) => ({
      name: `${a.name.split(" ")[0]}'s Library`,
      author: a.username,
      slug: a.username,
      count: a.components,
    }));
}

/** Slim payload for client-side search. */
export interface SearchDoc {
  s: string;
  n: string;
  u: string;
  a: string;
  av: string;
  t: string[];
  c: string[];
  p: string | null;
  g: [string, string];
  d: number;
}

let searchIndex: SearchDoc[] | null = null;

export function getSearchIndex(): SearchDoc[] {
  if (searchIndex) return searchIndex;
  searchIndex = ALL.map((c) => ({
    s: c.slug,
    n: c.name,
    u: c.author.username,
    a: c.author.name,
    av: c.author.avatar,
    t: c.tags.slice(0, 4),
    c: c.categories.slice(0, 3),
    p: c.previewUrl,
    g: c.gradient,
    d: c.downloads,
  }));
  return searchIndex;
}

export function getDatasetMeta() {
  return DATA.meta;
}
