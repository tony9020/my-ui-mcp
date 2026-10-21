"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleDollarSign, Menu, Search } from "lucide-react";
import { CategorySidebar } from "./category-sidebar";
import { SearchDialog } from "./search-dialog";
import { Toaster } from "@/components/ui/toast";
import { Sheet, SheetHeader } from "@/components/ui/overlays";
import { LogoBadge } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Kbd } from "@/components/ui/primitives";
import { useMarketplace, hydrateMarketplace } from "@/lib/store";
import { CATEGORY_GROUPS } from "@/data/taxonomy";
import { cn, titleCase } from "@/lib/utils";

const CATEGORY_NAME = new Map<string, string>();
for (const g of CATEGORY_GROUPS) for (const item of g.items) CATEGORY_NAME.set(item.slug, item.name);

function useBreadcrumb() {
  const pathname = usePathname();
  return React.useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    // /community/components/s/<tag>
    if (parts.length >= 4 && parts[1] === "components" && parts[2] === "s") {
      const slug = parts[3];
      return [
        { label: "Components", href: "/community/components" },
        { label: CATEGORY_NAME.get(slug) ?? titleCase(slug) },
      ];
    }
    if (parts.length >= 2) {
      return [{ label: titleCase(parts[parts.length - 1]) }];
    }
    return [{ label: "Components" }];
  }, [pathname]);
}

export function MarketplaceShell({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useMarketplace((s) => s.sidebarOpen);
  const setSidebarOpen = useMarketplace((s) => s.setSidebarOpen);
  const openSearch = useMarketplace((s) => s.openSearch);
  const crumb = useBreadcrumb();

  React.useEffect(() => {
    hydrateMarketplace();
  }, []);

  return (
    <div className="flex min-h-dvh bg-surface">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[300px] shrink-0 border-r border-sidebar-border lg:block">
        <CategorySidebar />
      </aside>

      {/* mobile drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen} side="left" labelledBy="nav-title">
        <SheetHeader onClose={() => setSidebarOpen(false)}>
          <span id="nav-title" className="text-sm font-medium">
            Browse
          </span>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <CategorySidebar onNavigate={() => setSidebarOpen(false)} />
        </div>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-surface/85 px-3 backdrop-blur-xl sm:px-5">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
            className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground lg:hidden dark:hover:bg-white/8"
          >
            <Menu className="size-5" />
          </button>

          <Link href="/" aria-label="My Ui home" className="lg:hidden">
            <LogoBadge size={26} />
          </Link>

          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <ol className="flex items-center gap-1.5 text-[15px] text-muted-foreground">
              {crumb.map((c, i) => (
                <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
                  {i > 0 ? <span className="text-muted-foreground/50">/</span> : null}
                  {c.href ? (
                    <Link href={c.href} className="truncate transition-colors hover:text-foreground">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="truncate font-medium text-foreground">{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <button
            type="button"
            onClick={() => openSearch()}
            className="hidden h-9 items-center gap-2 rounded-full border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted md:inline-flex"
          >
            <Search className="size-3.5" />
            <span className="pr-6">Search</span>
            <Kbd>K</Kbd>
          </button>

          <ThemeToggle compact />

          <Link
            href="/pricing"
            className="hidden h-9 items-center gap-1.5 rounded-full px-3 text-[15px] font-medium text-foreground transition-colors hover:bg-black/5 sm:inline-flex dark:hover:bg-white/8"
          >
            <CircleDollarSign className="size-4" />
            Pricing
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex h-9 items-center rounded-full bg-foreground px-4 text-[15px] font-medium text-background transition-opacity hover:opacity-90"
          >
            Sign in
          </Link>
        </header>

        <main id="main" className={cn("min-w-0 flex-1")}>
          {children}
        </main>
      </div>

      <SearchDialog />
      <Toaster />
    </div>
  );
}
