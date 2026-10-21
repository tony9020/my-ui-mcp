"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { Logo } from "./brand";
import { Kbd } from "@/components/ui/primitives";
import { useMarketplace } from "@/lib/store";
import { NAV_LINKS } from "@/data/taxonomy";
import { cn } from "@/lib/utils";

/**
 * The dark marketing header. Floats over the hero gradient and condenses
 * into a blurred bar once the page is scrolled.
 */
export function SiteHeader({ onDark = true }: { onDark?: boolean }) {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const openSearch = useMarketplace((s) => s.openSearch);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const muted = onDark ? "text-white/60 hover:text-white" : "text-muted-foreground hover:text-foreground";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? onDark
            ? "border-b border-white/8 bg-[#0e0b12]/80 backdrop-blur-xl"
            : "border-b border-border bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="My Ui home"
          className={cn("shrink-0 transition-opacity hover:opacity-80", onDark ? "text-white" : "text-foreground")}
        >
          <Logo className="h-[22px]" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-2 text-[15px] font-medium transition-colors",
                onDark ? "text-white/60 hover:text-white" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => openSearch()}
            className={cn(
              "hidden h-9 items-center gap-2 rounded-full border px-3 text-sm transition-colors sm:inline-flex",
              onDark
                ? "border-white/12 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            <Search className="size-3.5" />
            <span className="pr-6">Search</span>
            <Kbd className={cn("h-5 border-white/10 bg-white/5", onDark && "text-white/50")}>K</Kbd>
          </button>

          <Link
            href="/sign-in"
            className={cn(
              "hidden h-9 items-center rounded-full px-4 text-[15px] font-medium transition-colors sm:inline-flex",
              muted,
            )}
          >
            Log in
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex h-9 items-center rounded-full bg-brand px-4 text-[15px] font-medium text-brand-foreground transition-opacity hover:opacity-90"
          >
            Sign up
          </Link>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "grid size-9 place-items-center rounded-full md:hidden",
              onDark ? "text-white/70 hover:bg-white/10" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          className={cn(
            "border-t px-4 pb-4 pt-2 md:hidden",
            onDark ? "border-white/8 bg-[#15101b]/95 backdrop-blur-xl" : "border-border bg-background",
          )}
        >
          <nav aria-label="Mobile" className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-3 text-base font-medium",
                  onDark ? "text-white/80 hover:bg-white/5" : "text-foreground hover:bg-muted",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
