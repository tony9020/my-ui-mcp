"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers";
import { Dropdown, DropdownItem } from "@/components/ui/menu";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { theme, setTheme, resolvedTheme, toggle } = useTheme();

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`}
        className={cn(
          "grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          className,
        )}
      >
        {resolvedTheme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </button>
    );
  }

  return (
    <Dropdown
      label="Theme"
      align="end"
      trigger={({ open, toggle: t }) => (
        <button
          type="button"
          onClick={t}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Change theme"
          className={cn(
            "grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            className,
          )}
        >
          {resolvedTheme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>
      )}
    >
      {({ close }) => (
        <div className="min-w-40">
          {(
            [
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
              { value: "system", label: "System", icon: Monitor },
            ] as const
          ).map((opt) => (
            <DropdownItem
              key={opt.value}
              active={theme === opt.value}
              onClick={() => {
                setTheme(opt.value);
                close();
              }}
            >
              <span className="inline-flex items-center gap-2">
                <opt.icon className="size-3.5 text-muted-foreground" />
                {opt.label}
              </span>
            </DropdownItem>
          ))}
        </div>
      )}
    </Dropdown>
  );
}
