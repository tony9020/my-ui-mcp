"use client";

import * as React from "react";
import { ArrowRight, Check, Loader2, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A small registry of genuinely interactive previews.
 * When a component slug matches, the detail page renders a real, working
 * implementation instead of a static frame.
 */

function LiveButtonDemo() {
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const run = () => {
    setLoading(true);
    setDone(false);
    window.setTimeout(() => {
      setLoading(false);
      setDone(true);
      window.setTimeout(() => setDone(false), 1600);
    }, 900);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button demo onClick={run}>
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : done ? <Check className="size-3.5" /> : <Sparkles className="size-3.5" />}
        {loading ? "Submitting…" : done ? "Copied!" : "Get unlimited access"}
      </Button>
      <Button demo variant="outline">
        Continue <ArrowRight className="size-3.5" />
      </Button>
    </div>
  );
}

function Button({
  children,
  demo,
  variant = "default",
  onClick,
}: {
  children: React.ReactNode;
  demo?: boolean;
  variant?: "default" | "outline";
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium transition-all active:scale-[0.98]",
        variant === "default"
          ? "bg-black text-white hover:bg-black/90"
          : "border border-black/15 bg-white text-black hover:bg-black/[0.04]",
      )}
    >
      {children}
    </button>
  );
}

function LiveCardDemo() {
  const [active, setActive] = React.useState(0);
  const cards = [
    { title: "Spotlight Card", body: "Pointer-tracking radial highlight." },
    { title: "Magnetic Card", body: "Subtle lift on hover with spring easing." },
    { title: "Glass Card", body: "Backdrop blur over a gradient stage." },
  ];
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      {cards.map((c, i) => (
        <button
          key={c.title}
          type="button"
          onMouseEnter={() => setActive(i)}
          onFocus={() => setActive(i)}
          className={cn(
            "group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300",
            active === i
              ? "-translate-y-1 border-black/20 shadow-xl"
              : "border-black/10 shadow-sm",
            "bg-white",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(300px circle at 50% 0%, rgba(0,51,255,0.14), transparent 70%)",
            }}
          />
          <span className="relative inline-grid size-9 place-items-center rounded-xl bg-black/[0.05] text-black">
            <Star className="size-4" />
          </span>
          <p className="relative mt-3 text-[15px] font-medium text-black">{c.title}</p>
          <p className="relative mt-1 text-[13px] text-black/55">{c.body}</p>
        </button>
      ))}
    </div>
  );
}

function LiveTabsDemo() {
  const [tab, setTab] = React.useState("overview");
  const items = ["overview", "analytics", "settings"];
  return (
    <div className="w-full max-w-md">
      <div role="tablist" className="inline-flex rounded-full bg-black/[0.05] p-0.5">
        {items.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "h-8 rounded-full px-4 text-[13px] font-medium capitalize transition-all",
              tab === t ? "bg-white text-black shadow-sm" : "text-black/55 hover:text-black",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-black/10 bg-white p-5">
        <p className="text-sm font-medium capitalize text-black">{tab}</p>
        <p className="mt-1 text-[13px] text-black/55">
          Panel content for <span className="text-black">{tab}</span> — keyboard navigable with arrow keys.
        </p>
      </div>
    </div>
  );
}

function LiveAccordionDemo() {
  const [open, setOpen] = React.useState<number | null>(0);
  const items = [
    { q: "Is it accessible?", a: "Yes — every interactive block ships with correct ARIA roles and focus handling." },
    { q: "Can I theme it?", a: "All colours resolve through CSS custom properties, so a token change re-skins everything." },
    { q: "Does it work with dark mode?", a: "Each component has matched light and dark treatments out of the box." },
  ];
  return (
    <div className="w-full max-w-lg divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
      {items.map((item, i) => (
        <div key={item.q}>
          <button
            type="button"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
          >
            <span className="text-sm font-medium text-black">{item.q}</span>
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border border-black/10 text-black/60 transition-transform",
                open === i && "rotate-45",
              )}
            >
              +
            </span>
          </button>
          <div
            className={cn(
              "grid transition-all duration-300",
              open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
            )}
          >
            <p className="overflow-hidden px-4 text-[13px] leading-relaxed text-black/60">
              <span className="block pb-4">{item.a}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function LiveMarqueeDemo() {
  const items = ["Design", "Ship", "Iterate", "Compose", "Scale", "Craft"];
  return (
    <div className="w-full overflow-hidden rounded-xl border border-black/10 bg-white py-6">
      <div className="flex w-max animate-marquee items-center gap-10 pr-10">
        {[...items, ...items].map((t, i) => (
          <span key={`${t}-${i}`} className="text-2xl font-medium tracking-tight text-black/80">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function LiveInputDemo() {
  const [value, setValue] = React.useState("");
  return (
    <div className="w-full max-w-md space-y-4">
      <div className="relative">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search components…"
          className="h-11 w-full rounded-full border border-black/12 bg-white pl-11 pr-4 text-sm text-black outline-none placeholder:text-black/40 focus:border-black/30"
        />
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/40">⌕</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-black/10 bg-white p-3">
          <p className="text-[11px] uppercase tracking-wide text-black/45">Filled</p>
          <p className="mt-1 truncate text-sm text-black">{value || "—"}</p>
        </div>
        <div className="rounded-xl border border-dashed border-black/15 bg-black/[0.02] p-3">
          <p className="text-[11px] uppercase tracking-wide text-black/45">Error state</p>
          <p className="mt-1 text-sm text-red-500">This field is required</p>
        </div>
      </div>
    </div>
  );
}

function LiveProgressDemo() {
  const [v, setV] = React.useState(35);
  React.useEffect(() => {
    const id = window.setInterval(() => setV((x) => (x >= 100 ? 0 : x + 5)), 700);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="w-full max-w-md space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-black/55">
          <span>Uploading assets</span>
          <span className="tabular-nums">{v}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-black/8">
          <div className="h-full rounded-full bg-[#6d28d9] transition-all duration-700" style={{ width: `${v}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="size-5 animate-spin rounded-full border-2 border-black/15 border-t-black" />
        <span className="text-sm text-black/60">Syncing 3 files…</span>
      </div>
    </div>
  );
}

const DEMOS: Record<string, React.ReactNode> = {
  button: <LiveButtonDemo />,
  card: <LiveCardDemo />,
  tabs: <LiveTabsDemo />,
  accordion: <LiveAccordionDemo />,
  marquee: <LiveMarqueeDemo />,
  input: <LiveInputDemo />,
  progress: <LiveProgressDemo />,
  spinner: <LiveProgressDemo />,
};

/** Which live demos we can drive from the component's *primary* category. */
export function getLiveDemo(categories: string[]): React.ReactNode | undefined {
  const primary = categories[0];
  return primary ? DEMOS[primary] : undefined;
}
