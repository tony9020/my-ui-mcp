"use client";

import * as React from "react";
import { Check, Copy, Download, Package } from "lucide-react";
import { Tabs } from "@/components/ui/menu";
import { useCopy } from "@/hooks/use-copy";
import { cn } from "@/lib/utils";

const MANAGERS = [
  { value: "npm", label: "npm", cmd: (c: string) => `npx ${c}` },
  { value: "pnpm", label: "pnpm", cmd: (c: string) => `pnpm dlx ${c}` },
  { value: "yarn", label: "yarn", cmd: (c: string) => `yarn dlx ${c}` },
  { value: "bun", label: "bun", cmd: (c: string) => `bunx ${c}` },
] as const;

export function InstallPanel({
  cliTarget,
  dependencies,
  registry,
  className,
}: {
  cliTarget: string;
  dependencies: Record<string, string>;
  registry: string;
  className?: string;
}) {
  const [manager, setManager] = React.useState<(typeof MANAGERS)[number]["value"]>("npm");
  const { copied, copy } = useCopy();
  const active = MANAGERS.find((m) => m.value === manager) ?? MANAGERS[0];
  const command = active.cmd(`shadcn@latest add ${cliTarget}`);

  const deps = Object.keys(dependencies);

  return (
    <section className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      <header className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[15px] font-medium">
          <Download className="size-4 text-muted-foreground" />
          Install
        </h2>
        <Tabs
          items={MANAGERS.map((m) => ({ value: m.value, label: m.label }))}
          value={manager}
          onChange={(v) => setManager(v as typeof manager)}
          size="sm"
        />
      </header>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-3 py-2.5">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[13px]">
          <span className="text-muted-foreground">$ </span>
          {command}
        </code>
        <button
          type="button"
          onClick={() => copy(command, "Command copied")}
          aria-label="Copy install command"
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-lg transition-colors",
            copied ? "text-emerald-500" : "text-muted-foreground hover:bg-background hover:text-foreground",
          )}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
        <div>
          <dt className="text-muted-foreground">Registry</dt>
          <dd className="mt-0.5 font-medium">{registry}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Dependencies</dt>
          <dd className="mt-0.5 font-medium">{deps.length ? `${deps.length} packages` : "None"}</dd>
        </div>
      </dl>

      {deps.length > 0 ? (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Package className="size-3.5" />
            Requires
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {deps.map((d) => (
              <span
                key={d}
                className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[12px] text-muted-foreground"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
