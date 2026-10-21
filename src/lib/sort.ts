import type { ComponentRecord } from "./types";

/**
 * Sorting helpers for the marketplace grid.
 *
 * Kept in their own module (free of the JSON dataset import) so client
 * components can sort the rows the server already handed them without
 * pulling the entire 2.4 MB catalogue into the browser bundle.
 */

export type SortKey = "recommended" | "downloads" | "bookmarks" | "newest";

export function popularity(c: ComponentRecord) {
  return c.downloads * 3 + c.bookmarks * 2 + c.likes + c.views * 0.01;
}

export function sortComponents(list: ComponentRecord[], sort: SortKey = "recommended") {
  const copy = [...list];
  switch (sort) {
    case "downloads":
      return copy.sort((a, b) => b.downloads - a.downloads);
    case "bookmarks":
      return copy.sort((a, b) => b.bookmarks - a.bookmarks);
    case "newest":
      return copy.sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
      );
    default:
      // real, editorially curated entries surface first, then by popularity
      return copy.sort((a, b) => {
        if (a.generated !== b.generated) return a.generated ? 1 : -1;
        return popularity(b) - popularity(a);
      });
  }
}
