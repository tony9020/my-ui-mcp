/**
 * Route + information-architecture map for the component marketplace.
 *
 * Observed public routes:
 *   /                                  dark marketing landing
 *   /community/components              discovery feed (sidebar nav + category rails)
 *   /community/components/featured     grid, "recommended" sort
 *   /community/components/newest       grid, "newest" sort
 *   /community/components/s/<tag>      tag grid (sortable + filterable)
 *   /community/templates               templates marketplace
 *   /community/themes                  shadcn themes marketplace
 *   /community/icons                   icon marketplace
 *   /community/<user>/library/<lib>    creator library
 *   /@<username>                       creator profile
 *   /@<username>/components/<slug>     component detail (preview + code + install)
 *   /pricing                           pricing
 *   /sign-in                           auth
 */

export const SITE = {
  name: "My Ui",
  tagline: "The living library of interfaces",
  description:
    "8,000+ crafted React components, templates, and shadcn themes. Built by real design engineers.",
  usageCount: "4,226,417",
  componentCount: "8,000+",
  views: "6.7M",
} as const;

export type CategorySlug = string;

export interface Category {
  slug: CategorySlug;
  name: string;
  count: number | null;
  badge?: "New" | "Updated";
}

export interface CategoryGroup {
  title: string;
  items: Category[];
}

/** Sidebar taxonomy, harvested verbatim from the live marketplace sidebar. */
export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    title: "Marketing Blocks",
    items: [
      { slug: "announcement", name: "Announcements", count: 58 },
      { slug: "ascii-art", name: "ASCII Art", count: 343, badge: "New" },
      { slug: "background", name: "Backgrounds", count: 1318 },
      { slug: "border", name: "Borders", count: 94 },
      { slug: "cta", name: "Calls to Action", count: 348 },
      { slug: "clients", name: "Clients", count: 151 },
      { slug: "comparison", name: "Comparisons", count: 73 },
      { slug: "dock", name: "Docks", count: 67 },
      { slug: "faq", name: "FAQs", count: 103 },
      { slug: "features", name: "Features", count: 148 },
      { slug: "footer", name: "Footers", count: 59 },
      { slug: "gallery", name: "Galleries", count: 303 },
      { slug: "gradient", name: "Gradients", count: 893, badge: "New" },
      { slug: "hero", name: "Heroes", count: 1391 },
      { slug: "hook", name: "Hooks", count: 38 },
      { slug: "image", name: "Images", count: 235 },
      { slug: "map", name: "Maps", count: 30 },
      { slug: "marquee", name: "Marquees", count: 185 },
      { slug: "navigation-menu", name: "Navigation Menus", count: 434 },
      { slug: "pricing-section", name: "Pricing Sections", count: 187 },
      { slug: "scroll-area", name: "Scroll Areas", count: 413 },
      { slug: "shader", name: "Shaders", count: 1135, badge: "New" },
      { slug: "stat", name: "Stats & KPIs", count: 206 },
      { slug: "steps", name: "Steppers", count: 72 },
      { slug: "team", name: "Team Sections", count: 68 },
      { slug: "testimonials", name: "Testimonials", count: 140 },
      { slug: "text", name: "Texts", count: 905 },
      { slug: "timeline", name: "Timelines", count: 127 },
      { slug: "video", name: "Videos", count: 296 },
    ],
  },
  {
    title: "UI Components",
    items: [
      { slug: "accordion", name: "Accordions", count: 200 },
      { slug: "ai-chat", name: "AI Chats", count: 312 },
      { slug: "alert", name: "Alerts", count: 59 },
      { slug: "avatar", name: "Avatars", count: 245 },
      { slug: "badge", name: "Badges", count: 425 },
      { slug: "button", name: "Buttons", count: 875 },
      { slug: "calendar", name: "Calendars", count: 153 },
      { slug: "card", name: "Cards", count: 1510 },
      { slug: "carousel", name: "Carousels", count: 213 },
      { slug: "data-visualization", name: "Charts & Data Viz", count: 279 },
      { slug: "checkbox", name: "Checkboxes", count: 156 },
      { slug: "cursor", name: "Cursors", count: 740 },
      { slug: "dashboard", name: "Dashboards", count: 288 },
      { slug: "date-picker", name: "Date Pickers", count: 122 },
      { slug: "modal", name: "Dialogs / Modals", count: 213 },
      { slug: "dropdown", name: "Dropdowns", count: 269 },
      { slug: "empty-state", name: "Empty States", count: 126 },
      { slug: "file-tree", name: "File Trees", count: 43 },
      { slug: "file-upload", name: "File Uploads", count: 105 },
      { slug: "form", name: "Forms", count: 755 },
      { slug: "globe", name: "Globes", count: 37 },
      { slug: "grid", name: "Grids & Bento", count: 396 },
      { slug: "icon", name: "Icons", count: 740 },
      { slug: "input", name: "Inputs", count: 570 },
      { slug: "link", name: "Links", count: 175 },
      { slug: "list", name: "Lists", count: 207 },
      { slug: "menu", name: "Menus", count: 310 },
      { slug: "notification", name: "Notifications", count: 292 },
      { slug: "number", name: "Numbers", count: 96 },
      { slug: "onboarding", name: "Onboarding", count: 73 },
      { slug: "pagination", name: "Paginations", count: 72 },
      { slug: "popover", name: "Popovers", count: 117 },
      { slug: "profile", name: "Profiles", count: 205 },
      { slug: "progress", name: "Progress", count: 241 },
      { slug: "radio-group", name: "Radio Groups", count: 61 },
      { slug: "search", name: "Search Bars", count: 169 },
      { slug: "select", name: "Selects", count: 174 },
      { slug: "sidebar", name: "Sidebars", count: 52 },
      { slug: "sign-in", name: "Sign Ins", count: 139 },
      { slug: "sign-up", name: "Sign ups", count: 46 },
      { slug: "slider", name: "Sliders", count: 126 },
      { slug: "spinner", name: "Spinner Loaders", count: 526 },
      { slug: "table", name: "Tables", count: 147 },
      { slug: "tabs", name: "Tabs", count: 128 },
      { slug: "tag", name: "Tags", count: 66 },
      { slug: "textarea", name: "Text Areas", count: 108 },
      { slug: "toast", name: "Toasts", count: 94 },
      { slug: "toggle", name: "Toggles", count: 250 },
      { slug: "tooltip", name: "Tooltips", count: 120 },
    ],
  },
];

/** Landing-page category rails (order observed on /community/components). */
export const FEED_RAILS: { slug: CategorySlug; label: string; title: string }[] = [
  { slug: "newest", label: "Newest", title: "Newest" },
  { slug: "popular", label: "Popular", title: "Popular" },
  { slug: "shader", label: "Shaders", title: "Shaders" },
  { slug: "hero", label: "Heros", title: "Heros" },
  { slug: "features", label: "Features", title: "Features" },
  { slug: "button", label: "Buttons", title: "Buttons" },
  { slug: "card", label: "Cards", title: "Cards" },
  { slug: "gradient", label: "Gradients", title: "Gradients" },
  { slug: "pricing-section", label: "Pricing", title: "Pricing Sections" },
  { slug: "testimonials", label: "Testimonials", title: "Testimonials" },
  { slug: "ai-chat", label: "AI Chats", title: "AI Chats" },
];

export const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "downloads", label: "Most downloaded" },
  { value: "bookmarks", label: "Most bookmarked" },
  { value: "newest", label: "Newest" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const NAV_LINKS = [
  { href: "/community/components", label: "Components" },
  { href: "/community/templates", label: "Templates" },
  { href: "/community/themes", label: "Themes" },
  { href: "/pricing", label: "Pricing" },
] as const;

/** Landing hero rotating "living library" adjectives, mirroring the type animation. */
export const HERO_WORDS = ["living", "crafted", "breathing", "infinite"] as const;

export const LANDING_TABS = [
  { label: "Animated heroes", slug: "hero" },
  { label: "Hero sections", slug: "hero-section" },
  { label: "Shaders", slug: "shader" },
  { label: "Liquid & metal", slug: "liquid" },
  { label: "Backgrounds", slug: "background" },
];

export const TRUSTED_BY = [
  "google", "meta", "nvidia", "bytedance", "shopify", "paypal",
  "vercel", "lovable", "webflow", "razorpay", "mistralai", "nubank", "atlassian",
];
