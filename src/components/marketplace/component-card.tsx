"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Sparkles } from "lucide-react";
import { GradientPreview } from "@/components/ui/media";
import { compactNumber, cn } from "@/lib/utils";
import type { ComponentRecord } from "@/lib/types";

/**
 * Interactive preview card.
 * - renders the component's real screenshot
 * - swaps to its real screen-recording on hover (when one is available)
 * - falls back to a deterministic gradient placeholder
 */
export function ComponentCard({
  component,
  priority = false,
  className,
  showStats = true,
}: {
  component: ComponentRecord;
  priority?: boolean;
  className?: string;
  showStats?: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const href = `/@${component.author.username}/components/${component.slug}`;
  const hasVideo = Boolean(component.videoUrl);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovered) {
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [hovered]);

  return (
    <article className={cn("group/card flex flex-col", className)}>
      <Link
        href={href}
        aria-label={`${component.name} by ${component.author.name}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className="relative block overflow-hidden rounded-xl border border-border bg-card transition-[border-color,box-shadow,transform] duration-200 hover:border-foreground/20 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-white dark:bg-[#15101b]">
          {component.previewUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={component.previewUrl}
              alt={`${component.name} preview`}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priority ? "high" : "auto"}
              onError={() => setImgError(true)}
              className={cn(
                "absolute inset-0 size-full object-cover transition-[opacity,transform] duration-500",
                hovered && hasVideo ? "opacity-0" : "opacity-100",
                hovered ? "scale-[1.02]" : "scale-100",
              )}
            />
          ) : component.previewUrl ? (
            <div
              className="absolute inset-0 grid place-items-center bg-muted text-xs text-muted-foreground"
              aria-hidden
            >
              {component.name}
            </div>
          ) : (
            <GradientPreview gradient={component.gradient} name={component.name} />
          )}

          {hasVideo ? (
            <video
              ref={videoRef}
              src={component.videoUrl ?? undefined}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden
              tabIndex={-1}
              className={cn(
                "absolute inset-0 size-full object-cover transition-opacity duration-500",
                hovered ? "opacity-100" : "opacity-0",
              )}
            />
          ) : null}

          {showStats ? (
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/55 to-transparent p-3 text-white transition-opacity duration-200",
                hovered ? "opacity-100" : "opacity-0",
              )}
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                <Download className="size-3.5" />
                {compactNumber(component.downloads)}
              </span>
              {component.generated ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium backdrop-blur">
                  <Sparkles className="size-2.5" /> generated
                </span>
              ) : (
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide backdrop-blur">
                  {component.registry}
                </span>
              )}
            </div>
          ) : null}
        </div>
      </Link>

      <div className="mt-2.5 min-w-0">
        <h3 className="truncate text-[15px] font-medium leading-tight">
          <Link href={href} className="transition-colors hover:text-brand">
            {component.name}
          </Link>
        </h3>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          by{" "}
          <Link href={`/@${component.author.username}`} className="transition-colors hover:text-foreground">
            {component.author.name}
          </Link>
        </p>
      </div>
    </article>
  );
}

/** Compact horizontal variant used in rails and lists. */
export function ComponentListRow({ component }: { component: ComponentRecord }) {
  const href = `/@${component.author.username}/components/${component.slug}`;
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-transparent p-2 transition-colors hover:border-border hover:bg-card"
    >
      <span className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-card">
        {component.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={component.previewUrl} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <GradientPreview gradient={component.gradient} name={component.name} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium transition-colors group-hover:text-brand">
          {component.name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {component.author.name} · {compactNumber(component.downloads)} downloads
        </span>
      </span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {compactNumber(component.views)}
      </span>
    </Link>
  );
}
