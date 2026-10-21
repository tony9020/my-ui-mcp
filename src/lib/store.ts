"use client";

import { create } from "zustand";
import type { SortKey } from "./sort";

export type ViewMode = "grid" | "list";
export type DetailTab = "preview" | "code" | "info";

interface MarketplaceState {
  /* command palette / search */
  searchOpen: boolean;
  query: string;
  openSearch: (initial?: string) => void;
  closeSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  setQuery: (q: string) => void;

  /* filtering */
  sort: SortKey;
  setSort: (s: SortKey) => void;
  activeTags: string[];
  toggleTag: (tag: string) => void;
  clearFilters: () => void;
  license: "any" | "mit";
  setLicense: (l: "any" | "mit") => void;
  freeOnly: boolean;
  setFreeOnly: (v: boolean) => void;
  filtersOpen: boolean;
  setFiltersOpen: (v: boolean) => void;

  /* presentation */
  view: ViewMode;
  setView: (v: ViewMode) => void;
  detailTab: DetailTab;
  setDetailTab: (t: DetailTab) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;

  /* recently viewed (persisted to localStorage) */
  recentlyViewed: string[];
  pushRecentlyViewed: (key: string) => void;
}

export const useMarketplace = create<MarketplaceState>((set, get) => ({
  searchOpen: false,
  query: "",
  openSearch: (initial) =>
    set((s) => ({ searchOpen: true, query: initial ?? s.query })),
  closeSearch: () => set({ searchOpen: false }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setQuery: (query) => set({ query }),

  sort: "recommended",
  setSort: (sort) => set({ sort }),
  activeTags: [],
  toggleTag: (tag) =>
    set((s) => ({
      activeTags: s.activeTags.includes(tag)
        ? s.activeTags.filter((t) => t !== tag)
        : [...s.activeTags, tag],
    })),
  clearFilters: () => set({ activeTags: [], license: "any", freeOnly: false }),
  license: "any",
  setLicense: (license) => set({ license }),
  freeOnly: false,
  setFreeOnly: (freeOnly) => set({ freeOnly }),
  filtersOpen: false,
  setFiltersOpen: (filtersOpen) => set({ filtersOpen }),

  view: "grid",
  setView: (view) => set({ view }),
  detailTab: "preview",
  setDetailTab: (detailTab) => set({ detailTab }),
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  recentlyViewed: [],
  pushRecentlyViewed: (key) => {
    const next = [key, ...get().recentlyViewed.filter((k) => k !== key)].slice(0, 12);
    set({ recentlyViewed: next });
    try {
      localStorage.setItem("myui:recent", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  },
}));

/** Hydrate persisted slices once on the client. */
export function hydrateMarketplace() {
  try {
    const raw = localStorage.getItem("myui:recent");
    if (raw) useMarketplace.setState({ recentlyViewed: JSON.parse(raw) });
  } catch {
    /* ignore */
  }
}
