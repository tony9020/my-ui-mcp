"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { HERO_WORDS, LANDING_TABS } from "@/data/taxonomy";
import { cn } from "@/lib/utils";
import type { ComponentRecord } from "@/lib/types";
import { GradientPreview } from "@/components/ui/media";

/**
 * The landing hero.
 * A dark radial-gradient stage, a `clamp(40px, 6.2vw, 64px)` headline with an
 * Averia Serif Libre italic accent that is underlined by an animated
 * hand-drawn squiggle rendered to canvas.
 */
export function LandingHero({ previews }: { previews: ComponentRecord[] }) {
  const [wordIndex, setWordIndex] = React.useState(0);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const wordRef = React.useRef<HTMLSpanElement>(null);
  const [tab, setTab] = React.useState(0);

  /* rotate the accent word */
  React.useEffect(() => {
    const id = window.setInterval(() => setWordIndex((i) => (i + 1) % HERO_WORDS.length), 2600);
    return () => window.clearInterval(id);
  }, []);

  /* hand-drawn underline, redrawn on resize */
  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    const word = wordRef.current;
    if (!canvas || !word) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = word.getBoundingClientRect();
    const w = rect.width + 18;
    const h = 14;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--lp-accent").trim() || "#a78bfa";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // two slightly-offset strokes make it read as a drawn, not vector, line
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      ctx.globalAlpha = pass === 0 ? 0.95 : 0.4;
      const offset = pass * 1.6;
      ctx.moveTo(3, h / 2 + offset);
      for (let x = 3; x <= w - 4; x += 8) {
        const t = (x - 3) / (w - 7);
        const y =
          h / 2 +
          Math.sin(t * Math.PI * 2.4) * 3.2 * (1 - t * 0.25) +
          Math.sin(t * 17) * 0.7 +
          offset;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, []);

  React.useEffect(() => {
    draw();
    const ro = new ResizeObserver(draw);
    if (wordRef.current) ro.observe(wordRef.current);
    window.addEventListener("resize", draw);
    const t = window.setTimeout(draw, 300); // after webfont swap
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", draw);
      window.clearTimeout(t);
    };
  }, [draw, wordIndex]);

  const railComponents = React.useMemo(() => {
    // rotate the strip when a tab is picked
    return previews.slice(tab, tab + 4).concat(previews.slice(0, Math.max(0, tab))).slice(0, 4);
  }, [previews, tab]);

  return (
    <section className="relative isolate overflow-hidden pb-10 pt-16 md:pb-12 md:pt-24">
      {/* gradient stage */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 lp-glow animate-aurora" />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 lp-grid mask-fade-b opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        <h1 className="max-w-[13ch] text-balance text-[clamp(40px,6.2vw,64px)] font-medium leading-[1.06] tracking-[-0.022em] text-[#f5f1ea]">
          The{" "}
          <em className="relative inline-block not-italic">
            <span
              ref={wordRef}
              className="relative inline-block font-serif text-[1.08em] font-normal italic leading-[1] text-lp-accent transition-opacity duration-300"
              style={{ fontSynthesis: "none" }}
            >
              {HERO_WORDS[wordIndex]}
            </span>
            <canvas
              ref={canvasRef}
              aria-hidden
              className="pointer-events-none absolute -bottom-2 left-[-6px]"
            />
          </em>{" "}
          library
          <br />
          of interfaces
        </h1>

        <p className="mt-6 max-w-[46ch] text-pretty text-[17px] leading-relaxed text-[#a79fb3] sm:text-[19px]">
          <Link
            href="/community/components"
            className="border-b border-[#3a3145] font-medium text-[#f5f1ea] transition-colors hover:border-white"
          >
            8,000+
          </Link>{" "}
          crafted React components, templates, and shadcn themes. Built by real design engineers.
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-3 text-[17px] text-[#a79fb3]">
          <span>
            <span className="text-[#f5f1ea]">2,000+</span> Marketing blocks:
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {LANDING_TABS.map((t, i) => (
              <button
                key={t.slug}
                type="button"
                onClick={() => setTab(i)}
                aria-pressed={tab === i}
                className={cn(
                  "rounded-full px-3.5 py-2 text-[16px] transition-colors",
                  tab === i
                    ? "bg-white/[0.09] font-medium text-[#f5f1ea]"
                    : "text-[#a79fb3] hover:text-[#f5f1ea]",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* live preview strip */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {railComponents.slice(0, 2).map((c, i) => (
            <PreviewTile key={c.id} component={c} priority={i === 0} />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
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
      </div>
    </section>
  );
}

function PreviewTile({ component, priority }: { component: ComponentRecord; priority?: boolean }) {
  const [hover, setHover] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const hasVideo = Boolean(component.videoUrl);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hover) v.play().catch(() => {});
    else {
      v.pause();
      v.currentTime = 0;
    }
  }, [hover]);

  return (
    <Link
      href={`/@${component.author.username}/components/${component.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative block overflow-hidden rounded-xl border border-white/8 bg-[#15101b]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {component.videoUrl ? (
          <video
            ref={videoRef}
            src={component.videoUrl}
            muted
            loop
            playsInline
            preload={priority ? "metadata" : "none"}
            aria-hidden
            tabIndex={-1}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-500",
              hover ? "opacity-100" : "opacity-0",
            )}
          />
        ) : null}
        {component.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={component.previewUrl}
            alt={`${component.name} preview`}
            loading={priority ? "eager" : "lazy"}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-500",
              hover && hasVideo ? "opacity-0" : "opacity-100",
            )}
          />
        ) : (
          <GradientPreview gradient={component.gradient} name={component.name} />
        )}

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{component.name}</p>
            <p className="truncate text-xs text-white/60">by {component.author.name}</p>
          </div>
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur transition-colors group-hover:bg-white/20">
            <Play className="size-3.5 fill-current" />
          </span>
        </div>
      </div>
    </Link>
  );
}
