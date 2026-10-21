"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleDollarSign, Menu, Search } from "lucide-react";
import { Logo, LogoBadge } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { SearchDialog } from "@/components/marketplace/search-dialog";
import { Toaster } from "@/components/ui/toast";
import { Sheet, SheetHeader } from "@/components/ui/overlays";
import { Kbd } from "@/components/ui/primitives";
import { useMarketplace, hydrateMarketplace } from "@/lib/store";
import { CategorySidebar } from "@/components/marketplace/category-sidebar";
import { NAV_LINKS } from "@/data/taxonomy";
import { cn } from "@/lib/utils";

/**
 * Full-width header used on creator profiles, component detail pages,
 * pricing and auth — i.e. everything outside the sidebar shell.
 */
export function AppHeader({
  breadcrumb,
  children,
}: {
  breadcrumb?: { label: string; href?: string }[];
  children?: React.ReactNode;
}) {
  const openSearch = useMarketplace((s) => s.openSearch);
  const [mobileNav, setMobileNav] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    hydrateMarketplace();
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="My Ui home" className="inline-flex shrink-0 items-center gap-2">
            <LogoBadge size={26} />
            <span className="hidden text-[17px] font-semibold tracking-tight sm:inline">My Ui</span>
          </Link>

          {breadcrumb && breadcrumb.length > 0 ? (
            <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
              <ol className="flex items-center gap-1.5 text-[15px] text-muted-foreground">
                {breadcrumb.map((c, i) => (
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
          ) : (
            <div className="flex-1" />
          )}

          {children}

          <button
            type="button"
            onClick={() => openSearch()}
            className="hidden h-9 items-center gap-2 rounded-full border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted md:inline-flex"
          >
            <Search className="size-3.5" />
            <span className="pr-10">Search</span>
            <Kbd>⌘K</Kbd>
          </button>

          <ThemeToggle compact />

          <Link
            href="/pricing"
            className="hidden h-9 items-center gap-1.5 rounded-full px-3 text-[15px] font-medium transition-colors hover:bg-muted sm:inline-flex"
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

          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileNav(true)}
            className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      <Sheet open={mobileNav} onOpenChange={setMobileNav} side="left" labelledBy="app-nav-title">
        <SheetHeader onClose={() => setMobileNav(false)}>
          <span id="app-nav-title" className="text-sm font-medium">
            Browse
          </span>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <nav aria-label="Mobile" className="flex flex-col p-3">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileNav(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors hover:bg-muted",
                  pathname.startsWith(l.href) && "bg-muted",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-border">
            <CategorySidebar onNavigate={() => setMobileNav(false)} />
          </div>
        </div>
      </Sheet>

      <SearchDialog />
      <Toaster />
    </>
  );
}
