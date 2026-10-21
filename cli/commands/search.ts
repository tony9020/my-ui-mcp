import { searchComponents, summaryOf } from "../../mcp/lib/component-index";
import type { ComponentInfo } from "../../mcp/lib/types";
import { remoteSearch } from "../lib/api";
import { getIndex } from "../lib/index";
import { paint, printJson, truncate } from "../lib/output";

export type LicensePolicy = "permissive-only" | "allow-weak-copyleft" | "any";
export type TrustTierOption = "verified" | "linked" | "reference";
export type SortOption = "relevance" | "popularity" | "recent" | "compliance";

export interface SearchCommandOptions {
  category?: string;
  tag?: string[];
  kind?: string;
  license?: LicensePolicy;
  trust?: TrustTierOption;
  limit?: number;
  includeDuplicates?: boolean;
  sort?: SortOption;
  remote?: boolean;
  json?: boolean;
  apiUrl?: string;
  token?: string;
}

function cliSummary(component: ComponentInfo) {
  return {
    ...summaryOf(component),
    trustTier: component.trustTier ?? null,
    licenseClass: component.licenseClass ?? null,
    isCanonical: component.isCanonical ?? true,
    complianceScore: component.complianceScore ?? null,
    popularityScore: component.popularityScore ?? null,
    resolvedPreviewUrl: component.resolvedPreviewUrl ?? null,
  };
}

function provenance(component: ComponentInfo): string {
  if (component.origin === "local") return "local";
  const author = component.catalogue?.author.username;
  return author ? `catalogue @${author}` : "catalogue";
}

function location(component: ComponentInfo): string {
  if (component.origin === "local") return component.file;
  return `${component.catalogue?.author.username ?? "?"}/${component.slug}`;
}

function printComponent(component: ComponentInfo, index: number): void {
  const tier = component.trustTier ?? "reference";
  const licence = component.licenseClass ?? "unknown";
  const badge = paint("dim", `[${provenance(component)} · ${tier} · ${licence}]`);
  process.stdout.write(`${paint("bold", `${index + 1}. ${component.name}`)} ${badge}\n`);
  process.stdout.write(
    `   ${paint("cyan", location(component))} · ${component.category} · ${component.kind} · ${component.props.length} prop(s)\n`,
  );
  process.stdout.write(`   ${truncate(component.description, 180)}\n`);
}

export async function runSearch(query: string, options: SearchCommandOptions): Promise<number> {
  const started = Date.now();
  const limit = Math.max(1, options.limit ?? 10);

  if (options.remote) {
    try {
      const response = await remoteSearch(
        query,
        {
          category: options.category,
          kind: options.kind,
          license: options.license,
          trust: options.trust,
          limit,
          include_duplicates: options.includeDuplicates,
          sort: options.sort,
        },
        { apiUrl: options.apiUrl, token: options.token },
      );
      if (options.json) {
        printJson({ ...response, elapsedMs: Date.now() - started });
        return 0;
      }
      const results = Array.isArray(response.results) ? response.results : [];
      if (!results.length) {
        process.stdout.write(`No remote results for "${query}".\n`);
        return 0;
      }
      for (const [index, item] of results.entries()) {
        const record = item as Record<string, unknown>;
        const name = String(record.name ?? record.slug ?? "unknown");
        const description = String(record.description ?? "");
        process.stdout.write(`${index + 1}. ${name}\n   ${truncate(description, 180)}\n`);
      }
      process.stdout.write(
        `\n${results.length} of ${response.total ?? results.length} · ${Date.now() - started} ms · remote\n`,
      );
      return 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`error: remote search failed: ${message}\n`);
      return 1;
    }
  }

  const index = getIndex();
  const result = searchComponents(index, query, {
    categories: options.category ? [options.category] : undefined,
    tags: options.tag?.length ? options.tag : undefined,
    license_policy: options.license ?? "permissive-only",
    min_trust: options.trust ?? "reference",
    include_duplicates: options.includeDuplicates ?? false,
    sort: options.sort,
  });

  const filtered = options.kind
    ? result.components.filter((component) => component.kind === options.kind)
    : result.components;
  const sliced = filtered.slice(0, limit);
  const elapsed = Date.now() - started;

  if (options.json) {
    printJson({
      query,
      count: sliced.length,
      total: filtered.length,
      excludedForLicence: result.excludedForLicence,
      excludedDuplicates: result.excludedDuplicates,
      elapsedMs: elapsed,
      results: sliced.map(cliSummary),
    });
    return 0;
  }

  if (!sliced.length) {
    process.stdout.write(`No component matched "${query}".\n`);
    process.stdout.write("Try a broader term, a category, or `myui search \"\" --category <category>`.\n");
    return 0;
  }

  for (const [index, component] of sliced.entries()) {
    printComponent(component, index);
  }

  const notes = [
    `${sliced.length} of ${filtered.length}`,
    `${elapsed} ms`,
    `${result.excludedForLicence} excluded by licence`,
    `${result.excludedDuplicates} non-canonical record(s) collapsed`,
  ];
  process.stdout.write(`\n${notes.join(" · ")}\n`);
  return 0;
}
