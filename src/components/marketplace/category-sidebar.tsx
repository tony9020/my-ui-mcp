import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft, Clock, Layers, Search, Sparkles, Users } from "lucide-react";
import { CATEGORY_GROUPS } from "@/data/taxonomy";
import { Badge } from "@/components/ui/badge";
import { LogoBadge } from "@/components/layout/brand";
import { useMarketplace } from "@/lib/store";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  announcement: <MegaphoneGlyph />,
  background: <FrameGlyph />,
  border: <CornerGlyph />,
  cta: <ArrowBoxGlyph />,
  clients: <UserGlyph />,
  comparison: <ColumnsGlyph />,
  dock: <DockGlyph />,
  features: <Sparkles className="size-4" />,
  footer: <FooterGlyph />,
  gallery: <GalleryGlyph />,
  hero: <HeroGlyph />,
  image: <ImageGlyph />,
  marquee: <MarqueeGlyph />,
  "navigation-menu": <NavGlyph />,
  "pricing-section": <TagGlyph />,
  shader: <Sparkles className="size-4" />,
  text: <TypeGlyph />,
  timeline: <Clock className="size-4" />,
  video: <VideoGlyph />,
  accordion: <Layers className="size-4" />,
  "ai-chat": <Sparkles className="size-4" />,
  avatar: <UserGlyph />,
  button: <ButtonGlyph />,
  card: <CardGlyph />,
  checkbox: <CheckGlyph />,
  "data-visualization": <ChartGlyph />,
  dashboard: <DashboardGlyph />,
  input: <InputGlyph />,
  icon: <IconGlyph />,
  profile: <UserGlyph />,
  search: <Search className="size-4" />,
  sidebar: <SidebarGlyph />,
  slider: <SliderGlyph />,
  table: <TableGlyph />,
  tabs: <TabsGlyph />,
  toast: <BellGlyph />,
  toggle: <ToggleGlyph />,
  tooltip: <TooltipGlyph />,
};

export function CategorySidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const openSearch = useMarketplace((s) => s.openSearch);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({
    "Marketing Blocks": true,
    "UI Components": true,
  });

  const isActive = (slug: string) => pathname === `/community/components/s/${slug}`;

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* brand row */}
      <div className="flex items-center gap-2 px-5 pb-2 pt-5">
        <Link href="/" aria-label="My Ui home" className="inline-flex items-center gap-2">
          <LogoBadge size={26} />
          <span className="text-[17px] font-semibold tracking-tight text-foreground">My Ui</span>
        </Link>
      </div>

      {/* back row */}
      <div className="px-4 pb-3 pt-1">
        <Link
          href="/community/components"
          className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[17px] font-medium text-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        >
          <ChevronLeft className="size-4 text-muted-foreground" />
          Components
        </Link>
      </div>

      {/* search trigger */}
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={() => {
            openSearch();
            onNavigate?.();
          }}
          className="group flex h-10 w-full items-center gap-2.5 rounded-xl bg-black/[0.045] px-3 text-left text-[15px] text-muted-foreground transition-colors hover:bg-black/[0.07] dark:bg-white/[0.06] dark:hover:bg-white/[0.09]"
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1 truncate">Search components</span>
          <span className="text-xs opacity-60">/</span>
        </button>
      </div>

      {/* scrollable nav */}
      <nav aria-label="Component categories" className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        <ul className="flex flex-col gap-0.5">
          <SidebarRow icon={<Sparkles className="size-4" />} label="Featured" href="/community/components/featured" active={pathname === "/community/components/featured"} onClick={onNavigate} />
          <SidebarRow icon={<Clock className="size-4" />} label="Newest" href="/community/components/newest" active={pathname === "/community/components/newest"} onClick={onNavigate} />
          <SidebarRow icon={<Layers className="size-4" />} label="All components" href="/community/components/all" active={pathname === "/community/components/all"} onClick={onNavigate} />
          <SidebarRow icon={<Users className="size-4" />} label="Authors" href="/community/authors" active={pathname === "/community/authors"} onClick={onNavigate} />
          <SidebarRow
            icon={<Layers className="size-4" />}
            label="Libraries"
            href="/community/libraries"
            active={pathname === "/community/libraries"}
            onClick={onNavigate}
            right={<Badge variant="new">Updated</Badge>}
          />
        </ul>

        {CATEGORY_GROUPS.map((group) => (
          <div key={group.title} className="mt-5">
            <button
              type="button"
              aria-expanded={expanded[group.title]}
              onClick={() => setExpanded((e) => ({ ...e, [group.title]: !e[group.title] }))}
              className="flex w-full items-center gap-1.5 px-2 py-1.5 text-[15px] font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              {group.title}
              <ChevronDown
                className={cn(
                  "size-3.5 text-muted-foreground transition-transform",
                  !expanded[group.title] && "-rotate-90",
                )}
              />
            </button>
            {expanded[group.title] ? (
              <ul className="mt-0.5 flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/community/components/s/${item.slug}`}
                      onClick={onNavigate}
                      aria-current={isActive(item.slug) ? "page" : undefined}
                      className={cn(
                        "group flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[15px] transition-colors",
                        isActive(item.slug)
                          ? "bg-black/[0.06] font-medium text-foreground dark:bg-white/[0.08]"
                          : "text-foreground/75 hover:bg-black/[0.045] hover:text-foreground dark:hover:bg-white/[0.06]",
                      )}
                    >
                      <span className="grid size-4 shrink-0 place-items-center text-muted-foreground">
                        {CATEGORY_ICONS[item.slug] ?? <BoxGlyph />}
                      </span>
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.badge ? (
                        <Badge variant="new">{item.badge}</Badge>
                      ) : item.count != null ? (
                        <span className="text-[13px] tabular-nums text-muted-foreground">{item.count}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </nav>

      {/* promo card — mirrors the "Design Bug Bot" upsell pinned to the sidebar */}
      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
          <p className="text-[15px] font-medium text-foreground">Design Bug Bot</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Catch UI issues in pull requests and get code to fix them.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            5 free reviews in your first week on a paid plan.
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-brand text-[14px] font-medium text-brand-foreground transition-opacity hover:opacity-90"
          >
            Add Bug Bot
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href="/pricing"
            className="mt-2 block text-center text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Read the announcement
          </Link>
        </div>
      </div>
    </div>
  );
}

function SidebarRow({
  icon,
  label,
  href,
  active,
  right,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[15px] transition-colors",
          active
            ? "bg-black/[0.06] font-medium text-foreground dark:bg-white/[0.08]"
            : "text-foreground/80 hover:bg-black/[0.045] hover:text-foreground dark:hover:bg-white/[0.06]",
        )}
      >
        <span className="grid size-4 shrink-0 place-items-center text-muted-foreground">{icon}</span>
        <span className="flex-1 truncate">{label}</span>
        {right}
      </Link>
    </li>
  );
}

/* --- lightweight inline glyphs (the real sidebar uses a bespoke icon set) --- */
function BoxGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="2" y="2" width="12" height="12" rx="3" />
    </svg>
  );
}
function MegaphoneGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="2.5" width="13" height="11" rx="2.5" />
      <path d="M4.5 5.5h5M4.5 8h3" strokeLinecap="round" />
    </svg>
  );
}
function FrameGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="2" y="3" width="12" height="10" rx="2" />
      <path d="M5 6l2 2-2 2M9 10h2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CornerGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M2 6.5V4.5A2.5 2.5 0 0 1 4.5 2h2" strokeLinecap="round" />
      <path d="M2.5 13.5c1-.6 1.5-1.6 1.5-3v-1" strokeLinecap="round" />
    </svg>
  );
}
function ArrowBoxGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="3.5" width="13" height="9" rx="2.5" />
      <path d="M6 8h4M8.5 6l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function UserGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="8" cy="5.5" r="2.6" />
      <path d="M2.8 13.5c.6-2.2 2.6-3.4 5.2-3.4s4.6 1.2 5.2 3.4" strokeLinecap="round" />
    </svg>
  );
}
function ColumnsGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="3" width="13" height="10" rx="2" />
      <path d="M8 3v10" />
    </svg>
  );
}
function DockGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="4" width="13" height="8" rx="4" />
      <circle cx="6" cy="8" r="1" fill="currentColor" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="10" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}
function FooterGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
      <path d="M1.5 10.5h13" />
    </svg>
  );
}
function GalleryGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="2" y="2.5" width="7.5" height="7.5" rx="1.6" />
      <path d="M6.5 13.5h7a1 1 0 0 0 1-1v-7" strokeLinecap="round" />
    </svg>
  );
}
function HeroGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 12c1.4-4.6 6.6-4.6 8 0" strokeLinecap="round" />
      <circle cx="8" cy="4.6" r="1.1" fill="currentColor" />
    </svg>
  );
}
function ImageGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="2" y="2.5" width="12" height="11" rx="2" />
      <circle cx="5.6" cy="6" r="1.1" fill="currentColor" />
      <path d="M3 11.5l3.2-3 2.4 2.2L11 8l2 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MarqueeGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="5.5" width="5" height="5" rx="1.4" />
      <rect x="9.5" y="5.5" width="5" height="5" rx="1.4" />
    </svg>
  );
}
function NavGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="3" width="13" height="4" rx="1.6" />
      <rect x="1.5" y="9" width="13" height="4" rx="1.6" />
    </svg>
  );
}
function TagGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M2 7.5V3.5A1.5 1.5 0 0 1 3.5 2h4L14 8.5 8.5 14 2 7.5Z" strokeLinejoin="round" />
      <circle cx="5.4" cy="5.4" r="1" fill="currentColor" />
    </svg>
  );
}
function TypeGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 4h10M8 4v9M5.5 13h5" strokeLinecap="round" />
    </svg>
  );
}
function VideoGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="3.5" width="9" height="9" rx="2" />
      <path d="M10.5 8l4-2.5v5L10.5 8Z" strokeLinejoin="round" />
    </svg>
  );
}
function ButtonGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="4.5" width="13" height="7" rx="3.5" />
      <path d="M5.5 8h5" strokeLinecap="round" />
    </svg>
  );
}
function CardGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="2" y="2.5" width="12" height="11" rx="2" />
      <path d="M5 6h6M5 8.5h4" strokeLinecap="round" />
    </svg>
  );
}
function CheckGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="2" y="2.5" width="12" height="11" rx="2.5" />
      <path d="M5 8l2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChartGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M2 13V3M2 13h12" strokeLinecap="round" />
      <path d="M5 11V7M8 11V4.5M11 11V8.5" strokeLinecap="round" />
    </svg>
  );
}
function DashboardGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="2" y="2.5" width="12" height="11" rx="2" />
      <path d="M2.5 5.5h11M5.5 5.5v8" />
    </svg>
  );
}
function InputGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="4" width="13" height="8" rx="2.5" />
      <path d="M4.5 6v4" strokeLinecap="round" />
    </svg>
  );
}
function IconGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M8 2.2l1.6 3.6 3.6 1.6-3.6 1.6L8 12.6 6.4 9 2.8 7.4 6.4 5.8 8 2.2Z" strokeLinejoin="round" />
    </svg>
  );
}
function SidebarGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="2" y="2.5" width="12" height="11" rx="2" />
      <path d="M6.5 2.5v11" />
    </svg>
  );
}
function SliderGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M2 8h12" strokeLinecap="round" />
      <circle cx="6" cy="8" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
function TableGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="2" y="3" width="12" height="10" rx="1.8" />
      <path d="M2.5 6.5h11M6.5 6.5V13" />
    </svg>
  );
}
function TabsGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M2 12.5V6a1 1 0 0 1 1-1h3.2l1 1.6H13a1 1 0 0 1 1 1v4.9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1Z" strokeLinejoin="round" />
    </svg>
  );
}
function BellGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 6.8a4 4 0 1 1 8 0c0 2.4.8 3.3 1.2 3.7H2.8C3.2 10.1 4 9.2 4 6.8Z" strokeLinejoin="round" />
      <path d="M6.4 13a1.7 1.7 0 0 0 3.2 0" strokeLinecap="round" />
    </svg>
  );
}
function ToggleGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="4.5" width="13" height="7" rx="3.5" />
      <circle cx="10.5" cy="8" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
function TooltipGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="2" y="2.5" width="8" height="5" rx="1.6" />
      <path d="M5 12.5h9v-5" strokeLinecap="round" />
    </svg>
  );
}
