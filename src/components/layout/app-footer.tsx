import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Logo } from "./brand";
import { NAV_LINKS } from "@/data/taxonomy";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Components", href: "/community/components" },
      { label: "Templates", href: "/community/templates" },
      { label: "Themes", href: "/community/themes" },
      { label: "Icons", href: "/community/icons" },
    ],
  },
  {
    title: "Categories",
    links: [
      { label: "Heroes", href: "/community/components/s/hero" },
      { label: "Buttons", href: "/community/components/s/button" },
      { label: "Shaders", href: "/community/components/s/shader" },
      { label: "Pricing sections", href: "/community/components/s/pricing-section" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Creators", href: "/community/authors" },
      { label: "Libraries", href: "/community/libraries" },
      { label: "Pricing", href: "/pricing" },
      { label: "Sign in", href: "/sign-in" },
    ],
  },
];

/** Theme-aware footer for every page outside the sidebar shell. */
export function AppFooter() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" aria-label="My Ui home">
              <Logo className="h-5" />
            </Link>
            <p className="mt-4 max-w-[28ch] text-[13px] leading-relaxed text-muted-foreground">
              The living library of interfaces. Crafted React components, templates and themes.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-[13px] font-medium">{col.title}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-[13px] text-muted-foreground">
            © {new Date().getFullYear()} My Ui. A design-engineering recreation.
          </p>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-5 text-[13px] text-muted-foreground">
            {NAV_LINKS.slice(0, 3).map((l) => (
              <Link key={l.href} href={l.href} className="transition-colors hover:text-foreground">
                {l.label}
              </Link>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-3.5" />
              Built with Next.js &amp; Tailwind
            </span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
