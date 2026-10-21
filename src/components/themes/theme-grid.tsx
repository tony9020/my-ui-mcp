"use client";

import * as React from "react";
import { Check, Copy, Moon, Sun } from "lucide-react";
import { Tabs } from "@/components/ui/menu";
import { Badge } from "@/components/ui/badge";
import { useCopy } from "@/hooks/use-copy";
import { cn } from "@/lib/utils";

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  primary: string;
  primaryForeground: string;
  radius: string;
  font?: string;
  tags: string[];
}

/**
 * shadcn theme browser.
 *
 * Each card renders a real mock of the component library using only the theme's
 * CSS custom properties, so "preview" is genuinely driven by the tokens it
 * would ship with. Copy grabs the exact `:root` block.
 */
export function ThemeGrid({ presets }: { presets: ThemePreset[] }) {
  const [mode, setMode] = React.useState<"light" | "dark">("light");
  const [font, setFont] = React.useState<"sans" | "serif" | "mono">("sans");
  const [query, setQuery] = React.useState("");

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return presets;
    return presets.filter((p) =>
      `${p.name} ${p.description} ${p.tags.join(" ")}`.toLowerCase().includes(q),
    );
  }, [presets, query]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative inline-flex w-full items-center sm:w-72">
          <span className="pointer-events-none absolute left-3 text-muted-foreground">⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search themes…"
            aria-label="Search themes"
            className="h-9 w-full rounded-full border border-border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden text-[13px] text-muted-foreground sm:inline">Font</span>
          <Tabs
            items={[
              { value: "sans", label: "Sans" },
              { value: "serif", label: "Serif" },
              { value: "mono", label: "Mono" },
            ]}
            value={font}
            onChange={(v) => setFont(v as typeof font)}
            size="sm"
          />
          <Tabs
            items={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
            value={mode}
            onChange={(v) => setMode(v as typeof mode)}
            size="sm"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((p) => (
          <ThemeCard key={p.id} preset={p} mode={mode} font={font} />
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">No themes match “{query}”.</p>
      ) : null}
    </div>
  );
}

function ThemeCard({
  preset,
  mode,
  font,
}: {
  preset: ThemePreset;
  mode: "light" | "dark";
  font: "sans" | "serif" | "mono";
}) {
  const { copied, copy } = useCopy();
  const dark = mode === "dark";

  const surface = dark ? "#0e0b12" : "#ffffff";
  const card = dark ? "#15101b" : "#ffffff";
  const fg = dark ? "#f5f1ea" : "#0e0b12";
  const muted = dark ? "#1e1826" : "#f5f1ea";
  const mutedFg = dark ? "#a79fb3" : "#7a716a";
  const border = dark ? "#2c2438" : "#e7dfd6";

  const fontFamily =
    font === "serif"
      ? "var(--font-serif)"
      : font === "mono"
        ? "var(--font-mono)"
        : preset.font ?? "var(--font-sans)";

  const css = [
    ":root {",
    `  --primary: ${preset.primary};`,
    `  --primary-foreground: ${preset.primaryForeground};`,
    `  --radius: ${preset.radius};`,
    "}",
  ].join("\n");

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card">
      {/* live preview stage */}
      <div
        className="relative flex h-[260px] flex-col justify-between p-5 transition-colors"
        style={{ background: surface, color: fg, borderBottom: `1px solid ${border}`, fontFamily }}
      >
        <div
          className="flex items-center justify-between"
          style={{ color: mutedFg, fontSize: 12 }}
        >
          <span style={{ fontWeight: 500 }}>{preset.name}</span>
          <span className="inline-flex items-center gap-1.5">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: preset.primary,
                display: "inline-block",
              }}
            />
            {preset.primary}
          </span>
        </div>

        <div
          className="rounded-xl p-4"
          style={{ background: card, border: `1px solid ${border}`, borderRadius: `calc(${preset.radius} + 6px)` }}
        >
          <p style={{ fontSize: 14, fontWeight: 500 }}>Invite your team</p>
          <p style={{ marginTop: 4, fontSize: 12, color: mutedFg }}>
            Everyone you invite gets full access.
          </p>

          <div className="mt-3" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              tabIndex={-1}
              style={{
                background: preset.primary,
                color: preset.primaryForeground,
                borderRadius: 999,
                padding: "7px 14px",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Send invite
            </button>
            <button
              type="button"
              tabIndex={-1}
              style={{
                background: "transparent",
                color: fg,
                border: `1px solid ${border}`,
                borderRadius: 999,
                padding: "7px 14px",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Later
            </button>
          </div>

          <div
            className="mt-3 inline-flex items-center gap-2"
            style={{ background: muted, color: mutedFg, borderRadius: 999, padding: "4px 10px", fontSize: 11 }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: preset.primary,
                opacity: 0.7,
              }}
            />
            Pro trial · 14 days
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            style={{
              background: muted,
              color: fg,
              borderRadius: `calc(${preset.radius} - 2px)`,
              padding: "6px 10px",
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            Overview
          </span>
          <span style={{ color: mutedFg, fontSize: 11, padding: "6px 4px" }}>Activity</span>
          <span style={{ color: mutedFg, fontSize: 11, padding: "6px 4px" }}>Settings</span>
        </div>
      </div>

      {/* meta + copy */}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="text-sm font-medium">{preset.name}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{preset.description}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {preset.tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="muted">
                {t}
              </Badge>
            ))}
            <Badge variant="outline">radius {preset.radius}</Badge>
          </div>
        </div>

        <button
          type="button"
          onClick={() => copy(css, `${preset.name} tokens copied`)}
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-[13px] font-medium transition-colors",
            copied
              ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy CSS"}
        </button>
      </div>

      <div className="flex items-center gap-1.5 border-t border-border px-4 py-2.5 text-[12px] text-muted-foreground">
        {dark ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
        {dark ? "Dark preview" : "Light preview"} · {font} type
      </div>
    </article>
  );
}
