"use client";

import * as React from "react";
import { Bookmark, Check, ChevronDown, ClipboardCopy, Flag, Sparkles, Terminal } from "lucide-react";
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/overlays";
import { useCopy } from "@/hooks/use-copy";
import { SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

export function ActionBar({
  name,
  slug,
  author,
  description,
  registry,
  installCommand,
}: {
  name: string;
  slug: string;
  author: string;
  description: string;
  registry: string;
  installCommand: string;
}) {
  const [saved, setSaved] = React.useState(false);
  const [cliOpen, setCliOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const { copied, copy } = useCopy();

  const componentUrl = `${SITE_URL}/@${author}/components/${slug}`;

  const prompt = [
    `Add the "${name}" component to my project.`,
    "",
    `Source: ${componentUrl}`,
    `Description: ${description}`,
    "",
    "Install it with:",
    installCommand,
    "",
    "Then use it like this:",
    `import { ${pascal(name)} } from "@/components/${registry}/${slug}";`,
  ].join("\n");

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        {/* split "Copy prompt" button */}
        <div className="inline-flex overflow-hidden rounded-full">
          <button
            type="button"
            onClick={() => copy(prompt, "Prompt copied — paste it into your agent")}
            className={cn(
              "inline-flex h-10 items-center gap-2 bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90",
              copied && "bg-emerald-600 hover:bg-emerald-600",
            )}
          >
            {copied ? <Check className="size-4" /> : <ClipboardCopy className="size-4" />}
            {copied ? "Copied" : "Copy prompt"}
          </button>
          <Dropdown
            label="Copy options"
            align="end"
            trigger={({ open, toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-label="More copy options"
                className="grid h-10 w-9 place-items-center border-l border-white/20 bg-brand text-brand-foreground transition-colors hover:bg-brand/90"
              >
                <ChevronDown className="size-4" />
              </button>
            )}
          >
            {({ close }) => (
              <>
                <DropdownItem
                  onClick={() => {
                    copy(prompt, "Prompt copied");
                    close();
                  }}
                >
                  Copy prompt for agents
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem
                  onClick={() => {
                    copy(installCommand, "Install command copied");
                    close();
                  }}
                >
                  Copy CLI command
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    copy(componentUrl, "Link copied");
                    close();
                  }}
                >
                  Copy component link
                </DropdownItem>
              </>
            )}
          </Dropdown>
        </div>

        <Button
          variant="default"
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          className={cn("gap-2", saved && "bg-emerald-600 hover:bg-emerald-600")}
        >
          <Bookmark className={cn("size-4", saved && "fill-current")} />
          {saved ? "Saved" : "Save"}
        </Button>

        <Button variant="outline" className="gap-2">
          <Sparkles className="size-4" />
          Remix
        </Button>

        <Button variant="ghost" onClick={() => setCliOpen(true)} className="gap-2 text-muted-foreground">
          <Terminal className="size-4" />
          CLI
        </Button>

        <Button variant="ghost" onClick={() => setReportOpen(true)} className="gap-2 text-muted-foreground">
          <Flag className="size-4" />
          Report
        </Button>
      </div>

      <Dialog open={cliOpen} onOpenChange={setCliOpen} className="max-w-lg" labelledBy="cli-title">
        <div className="p-5">
          <h2 id="cli-title" className="text-[15px] font-medium">
            Install with the shadcn CLI
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Adds the source directly to your project — no runtime dependency.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-muted p-4 font-mono text-[13px]">
            {installCommand}
          </pre>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCliOpen(false)}>
              Close
            </Button>
            <Button variant="brand" onClick={() => copy(installCommand, "Install command copied")}>
              Copy command
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen} className="max-w-lg" labelledBy="report-title">
        <div className="p-5">
          <h2 id="report-title" className="text-[15px] font-medium">
            Report this component
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Licensing, attribution or functionality issue? Let the maintainers know.
          </p>
          <textarea
            rows={4}
            placeholder="Describe the problem…"
            className="mt-4 w-full resize-none rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring/25"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setReportOpen(false);
                // eslint-disable-next-line no-alert
                alert("Thanks — the report was queued for review.");
              }}
            >
              Submit report
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function pascal(name: string) {
  return name
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}
