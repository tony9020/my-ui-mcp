"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Blocks, Code2, Command, Palette, Search, Sparkles, Terminal, Layers } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Avatar, GradientPreview } from "@/components/ui/media";
import { Logo } from "@/components/layout/brand";
import { SITE, TRUSTED_BY } from "@/data/taxonomy";
import { cn, compactNumber } from "@/lib/utils";
import type { ComponentRecord, CreatorProfile } from "@/lib/types";

/* -------------------------------------------------------------- Trusted by */

export function TrustedBy() {
  const logos = [...TRUSTED_BY, ...TRUSTED_BY];
  return (
    <section className="relative border-y border-white/6 py-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="text-[clamp(26px,3.4vw,40px)] font-medium tracking-tight text-[#f5f1ea]">
            Used by <span className="text-brand">{SITE.usageCount}</span> builders.
          </h2>
          <p className="mt-3 text-[17px] text-[#a79fb3]">
            From indie makers to the world&apos;s largest product teams
          </p>
        </Reveal>
      </div>

      <div className="mask-fade-x mt-14 overflow-hidden">
        <div className="flex w-max animate-marquee items-center gap-16 pr-16">
          {logos.map((name, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${name}-${i}`}
              src={`/landing/logos/${name}.svg`}
              alt={name}
              loading="lazy"
              className="h-6 w-auto shrink-0 opacity-45 brightness-0 invert transition-opacity hover:opacity-80"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- Authors / creators */

export function AuthorsBand({ authors }: { authors: CreatorProfile[] }) {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal>
          <h2 className="max-w-[20ch] text-balance text-[clamp(28px,3.8vw,44px)] font-medium leading-[1.12] tracking-tight text-[#f5f1ea]">
            Built by real design engineers.
          </h2>
          <p className="mt-4 max-w-[52ch] text-pretty text-[17px] leading-relaxed text-[#a79fb3]">
            Every component has an author. Indexed, searchable, one prompt away.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {authors.slice(0, 6).map((author, i) => (
            <Reveal key={author.username} delay={i * 70}>
              <Link
                href={`/@${author.username}`}
                className="group flex h-full flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-colors hover:border-white/15 hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={author.avatar} name={author.name} size={44} ring />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-[#f5f1ea]">{author.name}</p>
                    <p className="truncate text-xs text-[#a79fb3]">@{author.username}</p>
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-4 text-xs text-[#a79fb3]">
                  <span>
                    <span className="text-[#f5f1ea]">{author.components.length}</span> components
                  </span>
                  <span>
                    <span className="text-[#f5f1ea]">{compactNumber(author.totalViews)}</span> views
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- Showcase grid */

export function MarketShowcase({ components }: { components: ComponentRecord[] }) {
  const featured = components.slice(0, 7);
  if (featured.length < 7) return null;

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[clamp(28px,3.8vw,44px)] font-medium tracking-tight text-[#f5f1ea]">
              A living library
            </h2>
            <p className="mt-3 max-w-[48ch] text-[17px] text-[#a79fb3]">
              Production-grade blocks that drop straight into your codebase — no rewiring required.
            </p>
          </div>
          <Link
            href="/community/components"
            className="inline-flex items-center gap-1 text-[15px] text-[#a79fb3] transition-colors hover:text-white"
          >
            Explore all {compactNumber(12000)} components
            <ArrowRight className="size-4" />
          </Link>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featured.map((c, i) => (
            <Reveal
              key={c.id}
              delay={i * 50}
              className={cn(
                i === 0 && "col-span-2 row-span-2",
                i === 3 && "col-span-2",
                "min-h-0",
              )}
            >
              <Link
                href={`/@${c.author.username}/components/${c.slug}`}
                className="group relative block size-full overflow-hidden rounded-xl border border-white/8 bg-[#15101b]"
              >
                <div className={cn("relative w-full overflow-hidden", i === 0 ? "aspect-[4/3]" : "aspect-[16/10]")}>
                  {c.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.previewUrl}
                      alt={`${c.name} preview`}
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <GradientPreview gradient={c.gradient} name={c.name} />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3">
                    <p className="truncate text-[13px] font-medium text-white">{c.name}</p>
                    <p className="truncate text-[11px] text-white/60">{c.author.name}</p>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- Feature / agents */

const FEATURES = [
  {
    icon: Search,
    title: "Indexed & searchable",
    body: "Every component is semantically indexed, so ⌘K finds the exact block you meant — by name, tag or author.",
    href: "/community/components",
  },
  {
    icon: Terminal,
    title: "One command install",
    body: "Ship any component with the shadcn CLI. Source lands in your repo, not behind a runtime dependency.",
    href: "/community/components",
  },
  {
    icon: Code2,
    title: "Real, readable source",
    body: "Tailwind + React you can actually edit. No black boxes, no proprietary runtime, MIT licensed by default.",
    href: "/community/components/s/button",
  },
  {
    icon: Palette,
    title: "Dark mode built in",
    body: "Every block ships with matched light and dark treatments driven by CSS custom properties.",
    href: "/community/themes",
  },
  {
    icon: Blocks,
    title: "Composable primitives",
    body: "Cards, rails and previews compose into full pages — the same primitives power this marketplace.",
    href: "/community/components/s/card",
  },
  {
    icon: Layers,
    title: "Built for agents",
    body: "Copy the prompt and hand it to your agent. Structured metadata makes generation deterministic.",
    href: "/community/components",
  },
];

export function FeatureGrid() {
  return (
    <section className="relative border-t border-white/6 py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal>
          <h2 className="max-w-[18ch] text-balance text-[clamp(28px,3.8vw,44px)] font-medium leading-[1.12] tracking-tight text-[#f5f1ea]">
            Built by humans. Ready for agents.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <Link href={f.href} className="group block">
                <span className="inline-grid size-10 place-items-center rounded-xl border border-white/8 bg-white/[0.03] text-[#f5f1ea] transition-colors group-hover:border-brand/40 group-hover:text-brand">
                  <f.icon className="size-4.5" />
                </span>
                <h3 className="mt-4 text-[17px] font-medium text-[#f5f1ea]">{f.title}</h3>
                <p className="mt-2 text-pretty text-[15px] leading-relaxed text-[#a79fb3]">{f.body}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Final CTA */

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-white/6 py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 lp-glow opacity-60" />
      <div className="relative mx-auto max-w-[1200px] px-4 text-center sm:px-6">
        <Reveal>
          <h2 className="mx-auto max-w-[16ch] text-balance text-[clamp(32px,4.6vw,54px)] font-medium leading-[1.08] tracking-tight text-[#f5f1ea]">
            The <span className="font-serif font-normal italic text-brand">living</span> library of interfaces
          </h2>
          <p className="mx-auto mt-5 max-w-[46ch] text-pretty text-[17px] text-[#a79fb3]">
            Start with 8,000+ components from the design engineers shipping today&apos;s best products.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/community/components"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-[15px] font-medium text-brand-foreground transition-transform hover:scale-[1.02]"
            >
              Browse components
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex h-12 items-center rounded-full border border-white/15 px-6 text-[15px] font-medium text-[#f5f1ea] transition-colors hover:bg-white/5"
            >
              Join for free
            </Link>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-[13px] text-[#a79fb3]">
            <Command className="size-3.5" />
            Press <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-[11px]">⌘K</kbd> to search anywhere
            on this page
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Footer */

const FOOTER_COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { label: "Components", href: "/community/components" },
      { label: "Templates", href: "/community/templates" },
      { label: "Themes", href: "/community/themes" },
      { label: "Icons", href: "/community/icons" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Heroes", href: "/community/components/s/hero" },
      { label: "Buttons", href: "/community/components/s/button" },
      { label: "Shaders", href: "/community/components/s/shader" },
      { label: "Pricing sections", href: "/community/components/s/pricing-section" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Authors", href: "/community/authors" },
      { label: "Libraries", href: "/community/libraries" },
      { label: "Sign in", href: "/sign-in" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/6 bg-[#0e0b12] py-14">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Logo className="h-5 text-white" />
            <p className="mt-4 max-w-[28ch] text-[13px] leading-relaxed text-[#a79fb3]">
              The living library of interfaces. Crafted React components, templates and themes.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-[13px] font-medium text-[#f5f1ea]">{col.title}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-[#a79fb3] transition-colors hover:text-[#f5f1ea]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/6 pt-6 sm:flex-row sm:items-center">
          <p className="text-[13px] text-[#a79fb3]">
            © {new Date().getFullYear()} My Ui. A design-engineering recreation.
          </p>
          <div className="flex items-center gap-5 text-[13px] text-[#a79fb3]">
            <Link href="/pricing" className="transition-colors hover:text-[#f5f1ea]">
              Pricing
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-3.5" />
              Built with Next.js &amp; Tailwind
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
