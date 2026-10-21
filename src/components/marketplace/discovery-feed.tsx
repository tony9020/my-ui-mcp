"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { SectionRail } from "./component-grid";
import { Skeleton } from "@/components/ui/primitives";
import { useMarketplace } from "@/lib/store";
import type { ComponentRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface Rail {
  slug: string;
  title: string;
  href: string;
  components: ComponentRecord[];
}

/**
 * The discovery feed: a stack of horizontally-scrolling category rails, each
 * with a "View all" affordance — exactly how /community/components is organised.
 */
export function DiscoveryFeed({ rails, total }: { rails: Rail[]; total: number }) {
  const openSearch = useMarketplace((s) => s.openSearch);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <div className="pb-16">
      {/* search + intro */}
      <div className="px-4 pt-6 sm:px-6">
        <button
          type="button"
          onClick={() => openSearch()}
          className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-foreground/20"
        >
          <Search className="size-4 text-muted-foreground" />
          <span className="flex-1 text-[15px] text-muted-foreground">
            Search 8,000+ components, tags and authors…
          </span>
          <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex">
            <kbd className="rounded border border-border px-1.5 py-0.5">⌘</kbd>
            <kbd className="rounded border border-border px-1.5 py-0.5">K</kbd>
          </span>
        </button>
      </div>

      <div className="px-4 pt-8 sm:px-6">
        <div className="flex items-center gap-2 text-[13px] font-medium text-brand">
          <Sparkles className="size-3.5" />
          <span>Featured this week</span>
        </div>
      </div>

      {!mounted ? (
        <div className="space-y-10 px-4 pt-8 sm:px-6">
          {Array.from({ length: 3 }).map((_, r) => (
            <div key={r}>
              <Skeleton className="mb-3 h-6 w-28" />
              <div className="flex gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-[min(70vw,300px)] shrink-0">
                    <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                    <Skeleton className="mt-3 h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          {rails.map((rail) => (
            <SectionRail
              key={rail.slug}
              title={rail.title}
              href={rail.href}
              components={rail.components}
            />
          ))}
        </div>
      )}

      {/* browse the entire catalogue */}
      <div className="mt-8 px-4 sm:px-6">
        <Link
          href="/community/components/all"
          className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Browse all {total.toLocaleString()} components
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* SEO / crawl surface, mirroring the on-page category index */}
      <section className="mt-14 px-4 sm:px-6">
        <h1 className="text-[22px] font-medium tracking-tight">
          Community UI Components for React &amp; Next.js
        </h1>
        <p className="mt-2 max-w-[70ch] text-[15px] leading-relaxed text-muted-foreground">
          Browse thousands of free, open-source Tailwind CSS and shadcn/ui components. Every block is
          copy-and-paste ready, ships with light and dark modes, and can be installed with a single CLI
          command.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-2 gap-y-2">
          {CATEGORY_LINKS.map((c) => (
            <Link
              key={c.slug}
              href={`/community/components/s/${c.slug}`}
              className={cn(
                "rounded-full border border-border px-3 py-1.5 text-[13px] text-muted-foreground transition-colors",
                "hover:border-foreground/25 hover:text-foreground",
              )}
            >
              {c.label} components
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

const CATEGORY_LINKS = [
  { slug: "hero", label: "Hero" },
  { slug: "button", label: "Button" },
  { slug: "card", label: "Card" },
  { slug: "gradient", label: "Gradient" },
  { slug: "glow", label: "Glow" },
  { slug: "cta", label: "CTA" },
  { slug: "features", label: "Features" },
  { slug: "pricing-section", label: "Pricing" },
  { slug: "shader", label: "Shader" },
  { slug: "background", label: "Background" },
  { slug: "marquee", label: "Marquee" },
  { slug: "testimonials", label: "Testimonial" },
  { slug: "ai-chat", label: "AI Chat" },
  { slug: "input", label: "Input" },
  { slug: "form", label: "Form" },
  { slug: "table", label: "Table" },
  { slug: "tabs", label: "Tabs" },
  { slug: "avatar", label: "Avatar" },
  { slug: "badge", label: "Badge" },
  { slug: "spinner", label: "Spinner" },
  { slug: "carousel", label: "Carousel" },
  { slug: "gallery", label: "Gallery" },
  { slug: "timeline", label: "Timeline" },
  { slug: "footer", label: "Footer" },
];
