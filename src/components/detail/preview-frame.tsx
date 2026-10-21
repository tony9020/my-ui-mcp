"use client";

import * as React from "react";
import {
  Expand,
  Monitor,
  Moon,
  RotateCw,
  Smartphone,
  Sun,
  Tablet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers";
import { Button } from "@/components/ui/button";

type Device = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTH: Record<Device, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

/**
 * Interactive preview surface.
 *
 * - plays the component's real screen-recording when available
 * - falls back to its rendered screenshot
 * - supports device widths, preview light/dark, reload and fullscreen
 * - when a component ships no media at all, a faithful generic live demo
 *   (buttons, tabs, accordions …) fills the frame instead of an empty box
 */
export function PreviewFrame({
  name,
  previewUrl,
  videoUrl,
  fallbackUrl,
  live,
  className,
}: {
  name: string;
  previewUrl: string | null;
  videoUrl: string | null;
  fallbackUrl?: string;
  live?: React.ReactNode;
  className?: string;
}) {
  const { resolvedTheme, toggle } = useTheme();
  const [device, setDevice] = React.useState<Device>("desktop");
  const [nonce, setNonce] = React.useState(0);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [previewDark, setPreviewDark] = React.useState(false);
  const [videoFailed, setVideoFailed] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState<string | null>(
    previewUrl ?? fallbackUrl ?? null,
  );
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => {
    setImageSrc(previewUrl ?? fallbackUrl ?? null);
    setImageFailed(false);
  }, [previewUrl, fallbackUrl]);

  const showVideo = Boolean(videoUrl) && !videoFailed;
  const showImage = Boolean(imageSrc) && !imageFailed;

  const reload = () => {
    setNonce((n) => n + 1);
    setVideoFailed(false);
    setImageSrc(previewUrl ?? fallbackUrl ?? null);
    setImageFailed(false);
  };

  const frame = (
    <div
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden rounded-xl transition-colors duration-300",
        previewDark ? "dark bg-[#15101b]" : "bg-white",
        fullscreen ? "h-full min-h-[70vh]" : "min-h-[420px] sm:min-h-[560px]",
      )}
    >
      <div className="flex h-full w-full items-center justify-center p-6" style={{ maxWidth: DEVICE_WIDTH[device] }}>
        {live ? (
          <div className="w-full">{live}</div>
        ) : showVideo ? (
          <video
            key={nonce}
            src={videoUrl ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoFailed(true)}
            className="max-h-full w-full rounded-lg object-contain"
          />
        ) : showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${nonce}-${imageSrc}`}
            src={imageSrc ?? undefined}
            alt={`${name} preview`}
            onError={() => {
              if (fallbackUrl && imageSrc !== fallbackUrl) {
                setImageSrc(fallbackUrl);
              } else {
                setImageFailed(true);
              }
            }}
            className="max-h-full w-full rounded-lg object-contain"
          />
        ) : (
          <div className="grid place-items-center gap-3 text-center">
            <div
              className="size-24 rounded-2xl"
              style={{ backgroundImage: "linear-gradient(135deg,#6d28d9,#7c3aed)" }}
            />
            <p className="text-sm font-medium">{name}</p>
          </div>
        )}
      </div>
    </div>
  );

  const toolbar = (
    <div className="inline-flex items-center gap-0.5 rounded-xl border border-border bg-background/80 p-1 shadow-sm backdrop-blur">
      <ToolButton
        label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
        onClick={() => setFullscreen((f) => !f)}
        active={fullscreen}
      >
        <Expand className="size-4" />
      </ToolButton>
      <ToolButton
        label="Toggle preview theme"
        onClick={() => {
          setPreviewDark((d) => !d);
          if (!previewDark) toggle();
        }}
        active={previewDark}
      >
        {previewDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </ToolButton>
      <ToolButton label="Reload preview" onClick={reload}>
        <RotateCw className="size-4" />
      </ToolButton>
    </div>
  );

  return (
    <div className={cn("relative", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        {toolbar}
        <div className="inline-flex items-center gap-0.5 rounded-xl border border-border bg-background/80 p-1 shadow-sm backdrop-blur">
          {(
            [
              { d: "desktop" as const, icon: Monitor, label: "Desktop preview" },
              { d: "tablet" as const, icon: Tablet, label: "Tablet preview" },
              { d: "mobile" as const, icon: Smartphone, label: "Mobile preview" },
            ] as const
          ).map((o) => (
            <ToolButton key={o.d} label={o.label} onClick={() => setDevice(o.d)} active={device === o.d}>
              <o.icon className="size-4" />
            </ToolButton>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/40 p-3 sm:p-4">{frame}</div>

      {fullscreen ? (
        <div className="fixed inset-0 z-[90] flex flex-col bg-background/95 p-4 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">
                {resolvedTheme === "dark" ? "Dark" : "Light"} mode · {device}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setFullscreen(false)} className="gap-1.5">
              <X className="size-3.5" />
              Close
            </Button>
          </div>
          <div className="min-h-0 flex-1">{frame}</div>
        </div>
      ) : null}
    </div>
  );
}

function ToolButton({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}
