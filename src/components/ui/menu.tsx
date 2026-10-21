"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* --------------------------------------------------------------- Dropdown */

export function Dropdown({
  trigger,
  children,
  align = "start",
  className,
  contentClassName,
  label,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: React.ReactNode | ((props: { close: () => void }) => React.ReactNode);
  align?: "start" | "end";
  className?: string;
  contentClassName?: string;
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open ? (
        <div
          role="menu"
          aria-label={label}
          className={cn(
            "absolute top-[calc(100%+6px)] z-50 min-w-52 overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl animate-scale-in",
            align === "end" ? "right-0" : "left-0",
            contentClassName,
          )}
        >
          {typeof children === "function" ? children({ close: () => setOpen(false) }) : children}
        </div>
      ) : null}
    </div>
  );
}

export function DropdownItem({
  active,
  children,
  onClick,
  className,
  disabled,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none disabled:opacity-40",
        className,
      )}
    >
      <span className="truncate">{children}</span>
      {active ? <Check className="size-3.5 shrink-0 text-brand" /> : null}
    </button>
  );
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{children}</div>;
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-border" />;
}

/* ------------------------------------------------------------------ Select */

export function Select<T extends string>({
  value,
  onChange,
  options,
  className,
  ariaLabel,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
  className?: string;
  ariaLabel?: string;
  size?: "sm" | "md";
}) {
  const current = options.find((o) => o.value === value);
  return (
    <Dropdown
      label={ariaLabel}
      align="end"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={ariaLabel}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 font-medium transition-colors hover:bg-muted",
            size === "sm" ? "h-8 text-[13px]" : "h-9 text-sm",
            className,
          )}
        >
          <span className="truncate">{current?.label ?? value}</span>
          <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      )}
    >
      {({ close }) => (
        <div className="min-w-52">
          {options.map((o) => (
            <DropdownItem
              key={o.value}
              active={o.value === value}
              onClick={() => {
                onChange(o.value);
                close();
              }}
            >
              {o.label}
            </DropdownItem>
          ))}
        </div>
      )}
    </Dropdown>
  );
}

/* -------------------------------------------------------------------- Tabs */

export interface TabItem {
  value: string;
  label: React.ReactNode;
  badge?: React.ReactNode;
}

export function Tabs({
  items,
  value,
  onChange,
  className,
  size = "md",
  variant = "segmented",
}: {
  items: TabItem[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
  size?: "sm" | "md";
  variant?: "segmented" | "underline";
}) {
  const listRef = React.useRef<HTMLDivElement>(null);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = items.findIndex((i) => i.value === value);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = (idx + dir + items.length) % items.length;
      onChange(items[next].value);
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
    }
  };

  if (variant === "underline") {
    return (
      <div ref={listRef} role="tablist" onKeyDown={onKeyDown} className={cn("flex items-center gap-5 border-b border-border", className)}>
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              role="tab"
              type="button"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(item.value)}
              className={cn(
                "-mb-px inline-flex items-center gap-2 border-b-2 px-0.5 pb-3 text-sm font-medium transition-colors",
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
              {item.badge}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn("inline-flex items-center gap-0.5 rounded-full bg-muted p-0.5", className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full font-medium transition-all",
              size === "sm" ? "h-7 px-3 text-[13px]" : "h-8 px-3.5 text-sm",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            {item.badge}
          </button>
        );
      })}
    </div>
  );
}
