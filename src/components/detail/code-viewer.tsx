"use client";

import * as React from "react";
import { Check, Copy, FileCode2, Maximize2, Minimize2, WrapText } from "lucide-react";
import { useCopy } from "@/hooks/use-copy";
import { cn } from "@/lib/utils";

export interface CodeFile {
  name: string;
  path: string;
  lang: string;
  /** pre-highlighted HTML from Shiki (server-rendered) */
  html: string;
  /** raw source for the copy button */
  code: string;
}

/**
 * Code viewer with file tabs, Shiki highlighting, copy-to-clipboard feedback,
 * line-number gutter, wrap toggle and an expand affordance.
 */
export function CodeViewer({
  files,
  className,
  initialFile,
}: {
  files: CodeFile[];
  className?: string;
  initialFile?: string;
}) {
  const [activePath, setActivePath] = React.useState(
    initialFile ?? files[0]?.path ?? "",
  );
  const [wrapped, setWrapped] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const { copied, copy } = useCopy();

  const active = files.find((f) => f.path === activePath) ?? files[0];

  React.useEffect(() => {
    if (!files.some((f) => f.path === activePath) && files[0]) setActivePath(files[0].path);
  }, [files, activePath]);

  if (!active) return null;

  const lineCount = active.code.split("\n").length;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      {/* header: file tabs + actions */}
      <div className="flex items-stretch gap-0 overflow-x-auto border-b border-border bg-muted/40">
        <div role="tablist" aria-label="Component files" className="no-scrollbar flex min-w-0 flex-1 items-stretch">
          {files.map((f) => {
            const isActive = f.path === active.path;
            return (
              <button
                key={f.path}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setActivePath(f.path)}
                className={cn(
                  "relative inline-flex shrink-0 items-center gap-2 px-4 py-3 text-[13px] font-medium transition-colors",
                  isActive ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <FileCode2 className="size-3.5" />
                {f.name}
                {isActive ? (
                  <span aria-hidden className="absolute inset-x-0 -bottom-px h-px bg-card" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 px-2">
          <button
            type="button"
            onClick={() => setWrapped((w) => !w)}
            aria-pressed={wrapped}
            aria-label={wrapped ? "Disable line wrapping" : "Wrap long lines"}
            className={cn(
              "grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              wrapped && "bg-muted text-foreground",
            )}
          >
            <WrapText className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? "Collapse code" : "Expand code"}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => copy(active.code, `${active.name} copied`)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors",
              copied
                ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* code body */}
      <div
        className={cn(
          "relative overflow-auto bg-card font-mono text-[13px] leading-[1.6]",
          expanded ? "max-h-none" : "max-h-[560px]",
          wrapped ? "[&_.line]:whitespace-pre-wrap" : "[&_.line]:whitespace-pre",
        )}
      >
        <div
          // Shiki output is generated server-side from trusted local strings.
          dangerouslySetInnerHTML={{ __html: active.html }}
          className="min-w-full py-3"
        />
        {!expanded && lineCount > 22 ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="sticky bottom-0 left-0 w-full bg-gradient-to-t from-card via-card/95 to-transparent px-4 py-4 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Show all {lineCount} lines
          </button>
        ) : null}
      </div>
    </div>
  );
}
