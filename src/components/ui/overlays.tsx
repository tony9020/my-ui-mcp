"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function useMounted() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

function useLockScroll(locked: boolean) {
  React.useEffect(() => {
    if (!locked) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [locked]);
}

function useEscape(active: boolean, onEscape: () => void) {
  React.useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onEscape();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [active, onEscape]);
}

/* ------------------------------------------------------------------ Dialog */

export function Dialog({
  open,
  onOpenChange,
  children,
  className,
  labelledBy,
  initialFocusRef,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const mounted = useMounted();
  const panelRef = React.useRef<HTMLDivElement>(null);

  useLockScroll(open);
  useEscape(open, () => onOpenChange(false));

  React.useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const target = initialFocusRef?.current ?? panelRef.current?.querySelector<HTMLElement>("[data-autofocus]");
      target?.focus();
    }, 20);
    return () => window.clearTimeout(t);
  }, [open, initialFocusRef]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[8vh] sm:items-center sm:pt-4">
      <div
        aria-hidden
        onClick={() => onOpenChange(false)}
        className="fixed inset-0 bg-black/45 backdrop-blur-[2px] animate-fade-in"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onKeyDown={onKeyDown}
        className={cn(
          "relative z-10 max-h-[85vh] w-full overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl animate-scale-in",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------- Sheet */

export function Sheet({
  open,
  onOpenChange,
  children,
  side = "right",
  className,
  labelledBy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
  side?: "right" | "left" | "bottom";
  className?: string;
  labelledBy?: string;
}) {
  const mounted = useMounted();
  useLockScroll(open);
  useEscape(open, () => onOpenChange(false));

  if (!mounted || !open) return null;

  const position =
    side === "right"
      ? "inset-y-0 right-0 h-full w-full max-w-md border-l"
      : side === "left"
        ? "inset-y-0 left-0 h-full w-full max-w-sm border-r"
        : "inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t";

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div
        aria-hidden
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-fade-in"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          "absolute flex flex-col overflow-hidden border-border bg-background shadow-2xl",
          position,
          className,
        )}
        style={{
          animation:
            side === "right"
              ? "sheet-in-right .28s cubic-bezier(.22,.61,.36,1)"
              : side === "left"
                ? "sheet-in-left .28s cubic-bezier(.22,.61,.36,1)"
                : "sheet-in-bottom .28s cubic-bezier(.22,.61,.36,1)",
        }}
      >
        <style>{`
          @keyframes sheet-in-right{from{transform:translateX(100%)}to{transform:translateX(0)}}
          @keyframes sheet-in-left{from{transform:translateX(-100%)}to{transform:translateX(0)}}
          @keyframes sheet-in-bottom{from{transform:translateY(100%)}to{transform:translateY(0)}}
        `}</style>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function SheetHeader({
  children,
  onClose,
  className,
}: {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 border-b border-border px-5 py-4", className)}>
      <div className="min-w-0">{children}</div>
      {onClose ? (
        <button
          onClick={onClose}
          aria-label="Close"
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
