"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays,
  ExternalLink,
  Github,
  Globe,
  Heart,
  Layers,
  Scale,
  Download,
  Eye,
  Bookmark,
} from "lucide-react";
import { PreviewFrame } from "./preview-frame";
import { CodeViewer, type CodeFile } from "./code-viewer";
import { InstallPanel } from "./install-panel";
import { ActionBar } from "./action-bar";
import { getLiveDemo } from "./live-demos";
import { Avatar, GradientPreview } from "@/components/ui/media";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/menu";
import { useMarketplace } from "@/lib/store";
import { SITE_URL } from "@/lib/site";
import { compactNumber, formatDate, cn } from "@/lib/utils";
import type { ComponentRecord } from "@/lib/types";

export function ComponentDetail({
  component,
  files,
  similar,
  libraryName,
}: {
  component: ComponentRecord;
  files: CodeFile[];
  similar: ComponentRecord[];
  libraryName?: string;
}) {
  const tab = useMarketplace((s) => s.detailTab);
  const setTab = useMarketplace((s) => s.setDetailTab);
  const pushRecentlyViewed = useMarketplace((s) => s.pushRecentlyViewed);

  // Real registry media is the faithful preview. Only fall back to a generic
  // category demo when the component ships no recording or screenshot — a hero
  // that happens to be tagged "button" must not render the stock button demo.
  const liveDemo = React.useMemo(
    () =>
      component.videoUrl || component.previewUrl
        ? undefined
        : getLiveDemo(component.categories),
    [component.videoUrl, component.previewUrl, component.categories],
  );

  React.useEffect(() => {
    setTab("preview");
  }, [component.id, setTab]);

  React.useEffect(() => {
    pushRecentlyViewed(`${component.author.username}/${component.slug}`);
  }, [component.author.username, component.slug, pushRecentlyViewed]);

  const cliTarget = `${SITE_URL}/r/${component.author.username}/${component.slug}`;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6">
      {/* ------------------------------------------------------------ header */}
      <header className="max-w-[80ch]">
        <h1 className="text-[clamp(26px,3.2vw,34px)] font-medium tracking-tight">{component.name}</h1>
        <p className="mt-2 text-pretty text-[15px] leading-relaxed text-muted-foreground">
          {component.description}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px]">
          <Link
            href={`/@${component.author.username}`}
            className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <Avatar src={component.author.avatar} name={component.author.name} size={26} ring />
            <span className="font-medium">{component.author.name}</span>
          </Link>
          <span className="text-muted-foreground">by</span>
          <Link
            href={`/@${component.author.username}`}
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Layers className="size-4" />
            {libraryName ?? `${component.author.name}'s Library`}
          </Link>
        </div>

        <div className="mt-6">
          <ActionBar
            name={component.name}
            slug={component.slug}
            author={component.author.username}
            description={component.description}
            registry={component.registry}
            installCommand={`npx shadcn@latest add ${cliTarget}`}
          />
        </div>
      </header>

      {/* ------------------------------------------------------- stat strip */}
      <dl className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-border py-3 text-[13px] text-muted-foreground">
        <Stat icon={<Download className="size-3.5" />} label="downloads" value={compactNumber(component.downloads)} />
        <Stat icon={<Eye className="size-3.5" />} label="views" value={compactNumber(component.views)} />
        <Stat icon={<Bookmark className="size-3.5" />} label="bookmarks" value={compactNumber(component.bookmarks)} />
        <Stat icon={<Heart className="size-3.5" />} label="likes" value={compactNumber(component.likes)} />
        <span className="ml-auto hidden items-center gap-1.5 sm:flex">
          <CalendarDays className="size-3.5" />
          Published {formatDate(component.createdAt)}
        </span>
      </dl>

      {/* ----------------------------------------------------------- body */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <Tabs
            variant="underline"
            className="mb-5"
            value={tab}
            onChange={(v) => setTab(v as typeof tab)}
            items={[
              { value: "preview", label: "Preview" },
              { value: "code", label: "Code" },
              { value: "info", label: "Info" },
            ]}
          />

          {tab === "preview" ? (
            <PreviewFrame
              name={component.name}
              previewUrl={component.previewUrl}
              videoUrl={component.videoUrl}
              fallbackUrl={`/api/preview/${component.id}.svg`}
              live={liveDemo}
            />
          ) : null}

          {tab === "code" ? <CodeViewer files={files} /> : null}

          {tab === "info" ? <InfoPanel component={component} /> : null}
        </div>

        {/* --------------------------------------------------------- aside */}
        <aside className="flex min-w-0 flex-col gap-6">
          <InstallPanel
            cliTarget={cliTarget}
            dependencies={component.dependencies}
            registry={component.registry}
          />

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-[15px] font-medium">Tags</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {component.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/community/components/s/${slugForTag(tag, component)}`}
                  className="rounded-full border border-border px-2.5 py-1 text-[13px] text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
                >
                  {tag}
                </Link>
              ))}
            </div>

            <dl className="mt-5 space-y-2.5 border-t border-border pt-4 text-[13px]">
              <Row icon={<Scale className="size-3.5" />} label="License" value={component.license} />
              <Row
                icon={<Layers className="size-3.5" />}
                label="Registry"
                value={component.registry}
              />
              <Row
                icon={<CalendarDays className="size-3.5" />}
                label="Published"
                value={formatDate(component.createdAt)}
              />
              {component.websiteUrl ? (
                <Row
                  icon={<Globe className="size-3.5" />}
                  label="Website"
                  value={
                    <a
                      href={normalizeUrl(component.websiteUrl)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-brand hover:underline"
                    >
                      Visit <ExternalLink className="size-3" />
                    </a>
                  }
                />
              ) : null}
              {component.sourceUrl ? (
                <Row
                  icon={<Github className="size-3.5" />}
                  label="Source"
                  value={
                    <a
                      href={component.sourceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-brand hover:underline"
                    >
                      GitHub <ExternalLink className="size-3" />
                    </a>
                  }
                />
              ) : null}
            </dl>
          </section>

          {similar.length > 0 ? (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-[15px] font-medium">Similar components</h2>
              <ul className="mt-3 flex flex-col gap-1">
                {similar.slice(0, 8).map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/@${s.author.username}/components/${s.slug}`}
                      className="group flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-muted"
                    >
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                        {s.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.previewUrl} alt="" loading="lazy" className="size-full object-cover" />
                        ) : (
                          <GradientPreview gradient={s.gradient} name={s.name} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium transition-colors group-hover:text-brand">
                          {s.name}
                        </span>
                        <span className="block truncate text-[12px] text-muted-foreground">
                          {s.author.name}
                        </span>
                      </span>
                      <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground">
                        {compactNumber(s.downloads)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      {icon}
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="font-medium text-foreground">{value}</span> {label}
      </dd>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="min-w-0 truncate text-right font-medium">{value}</dd>
    </div>
  );
}

function InfoPanel({ component }: { component: ComponentRecord }) {
  const deps = Object.entries(component.dependencies);
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-[15px] font-medium">About this component</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{component.description}</p>

      <dl className="mt-5 grid grid-cols-2 gap-4 text-[13px]">
        <div>
          <dt className="text-muted-foreground">Author</dt>
          <dd className="mt-1 inline-flex items-center gap-2 font-medium">
            <Avatar src={component.author.avatar} name={component.author.name} size={20} />
            {component.author.name}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">License</dt>
          <dd className="mt-1 font-medium">{component.license}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Published</dt>
          <dd className="mt-1 font-medium">{formatDate(component.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Last updated</dt>
          <dd className="mt-1 font-medium">{formatDate(component.updatedAt ?? component.createdAt)}</dd>
        </div>
      </dl>

      {component.tags.length ? (
        <div className="mt-5">
          <p className="text-[13px] text-muted-foreground">Tags</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {component.tags.map((t) => (
              <Badge key={t} variant="muted">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {deps.length ? (
        <div className="mt-5">
          <p className="text-[13px] text-muted-foreground">Dependencies</p>
          <ul className="mt-2 space-y-1 font-mono text-[12px]">
            {deps.map(([k, v]) => (
              <li key={k} className="flex items-center justify-between gap-3 rounded-md bg-muted px-2.5 py-1.5">
                <span className="truncate">{k}</span>
                <span className="shrink-0 text-muted-foreground">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {component.generated ? (
        <p className={cn("mt-5 rounded-xl bg-muted px-3 py-2.5 text-[12px] leading-relaxed text-muted-foreground")}>
          This entry is part of the generated catalogue used to fill out the marketplace grid. Real
          components show their live preview recording and source.
        </p>
      ) : null}
    </div>
  );
}

function normalizeUrl(url: string) {
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}

function slugForTag(tag: string, component: ComponentRecord) {
  const known = component.categories[0];
  return known ?? tag.toLowerCase().replace(/\s+/g, "-");
}
