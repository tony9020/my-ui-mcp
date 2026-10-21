"use client";

import * as React from "react";
import { cn, initials } from "@/lib/utils";

/* ----------------------------------------------------------------- Tooltip */

export function Tooltip({
  content,
  children,
  side = "top",
  className,
  delay = 150,
}: {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "bottom" | "right" | "left";
  className?: string;
  delay?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);

  const show = () => {
    timer.current = window.setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const position =
    side === "top"
      ? "bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2"
      : side === "bottom"
        ? "top-[calc(100%+6px)] left-1/2 -translate-x-1/2"
        : side === "right"
          ? "left-[calc(100%+6px)] top-1/2 -translate-y-1/2"
          : "right-[calc(100%+6px)] top-1/2 -translate-y-1/2";

  return (
    <span className="relative inline-flex">
      {React.cloneElement(children, {
        onMouseEnter: show,
        onMouseLeave: hide,
        onFocus: show,
        onBlur: hide,
      } as React.HTMLAttributes<HTMLElement>)}
      {open ? (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-[70] w-max max-w-xs rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg animate-fade-in",
            position,
            className,
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------ Avatar */

export function Avatar({
  src,
  name,
  size = 32,
  className,
  ring,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  const [failed, setFailed] = React.useState(false);
  const showImg = src && !failed;
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-[11px] font-semibold text-muted-foreground",
        ring && "ring-1 ring-border",
        className,
      )}
      style={{ width: size, height: size }}
      title={name}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
      <span className="sr-only">{name}</span>
    </span>
  );
}

/* ------------------------------------------------------------- Placeholder */

/** Deterministic gradient placeholder used when a component has no rendered preview. */
export function GradientPreview({
  gradient,
  name,
  className,
}: {
  gradient: [string, string];
  name: string;
  className?: string;
}) {
  const short = initials(name);
  return (
    <div
      className={cn("relative grid size-full place-items-center overflow-hidden", className)}
      style={{
        backgroundImage: `radial-gradient(120% 120% at 20% 0%, ${gradient[0]} 0%, ${gradient[1]} 55%, #15101b 100%)`,
      }}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
      <span className="relative select-none text-3xl font-semibold tracking-tight text-white/85">{short}</span>
    </div>
  );
}
