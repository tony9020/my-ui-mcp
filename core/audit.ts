/**
 * Shared audit logic for the CLI, the HTTP API and (later) the MCP tools.
 *
 * Two modes:
 *   - catalogue audit: read-only health report over the derived index.
 *   - source audit: static analysis of one file or a tree of files.
 *
 * This module is deliberately free of CLI concerns (no printing, no exit
 * codes) so it can be reused by the hosted API in Phase 4.
 */
import fs from "node:fs";
import path from "node:path";
import { extractImports } from "../mcp/lib/derived";
import type { ComponentIndex, LicenseClass, ValidationReport } from "../mcp/lib/types";
import { validateComposition } from "../mcp/lib/validate";

export interface CatalogueAudit {
  total: number;
  canonical: number;
  nonCanonical: number;
  linked: number;
  reference: number;
  verified: number;
  licences: Record<string, number>;
  trust: Record<string, number>;
  issues: {
    declaredDepsUnused: number;
    undefinedKeyframes: number;
    demoMismatch: number;
    hardcodedColor: number;
    unresolvableImports: number;
    reducedMotion: number;
  };
  topHeavyDeps: [string, number][];
}

export function auditCatalogue(index: ComponentIndex): CatalogueAudit {
  const catalogue = index.components.filter((component) => component.origin === "catalogue");
  const licences: Record<string, number> = {};
  const trust: Record<string, number> = {};
  const heavy: Record<string, number> = {};

  let canonical = 0;
  let linked = 0;
  let reference = 0;
  let verified = 0;
  let declaredDepsUnused = 0;
  let undefinedKeyframes = 0;
  let demoMismatch = 0;
  let hardcodedColor = 0;
  let unresolvableImports = 0;
  let reducedMotion = 0;

  for (const component of catalogue) {
    if (component.isCanonical !== false) canonical += 1;
    const tier = component.trustTier ?? "reference";
    trust[tier] = (trust[tier] ?? 0) + 1;
    if (tier === "linked") linked += 1;
    if (tier === "reference") reference += 1;
    if (tier === "verified") verified += 1;

    const licence: LicenseClass = component.licenseClass ?? "unknown";
    licences[licence] = (licences[licence] ?? 0) + 1;

    const quality = component.codeQuality;
    if (quality) {
      if (quality.declaredDepsUnused.length) declaredDepsUnused += 1;
      if (quality.usesUndefinedKeyframes) undefinedKeyframes += 1;
      if (!quality.demoMatchesComponent) demoMismatch += 1;
      if (quality.usesHardcodedColor) hardcodedColor += 1;
      if (!quality.importsResolvable) unresolvableImports += 1;
      if (quality.hasReducedMotion) reducedMotion += 1;
    }

    for (const dependency of component.heavyDeps ?? []) {
      heavy[dependency] = (heavy[dependency] ?? 0) + 1;
    }
  }

  return {
    total: catalogue.length,
    canonical,
    nonCanonical: catalogue.length - canonical,
    linked,
    reference,
    verified,
    licences,
    trust,
    issues: {
      declaredDepsUnused,
      undefinedKeyframes,
      demoMismatch,
      hardcodedColor,
      unresolvableImports,
      reducedMotion,
    },
    topHeavyDeps: Object.entries(heavy).sort((a, b) => b[1] - a[1]).slice(0, 10),
  };
}

export interface SourceAudit {
  file: string;
  bytes: number;
  imports: string[];
  report: ValidationReport;
}

export function auditSource(file: string, code?: string): SourceAudit {
  const source = code ?? fs.readFileSync(file, "utf8");
  return {
    file,
    bytes: Buffer.byteLength(source, "utf8"),
    imports: [...extractImports(source)].sort(),
    report: validateComposition(source, { fileName: file }),
  };
}

const SOURCE_EXTENSIONS = new Set([
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".mjs",
  ".cjs",
  ".html",
  ".vue",
  ".svelte",
  ".css",
]);

const SKIP_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  "coverage",
  ".turbo",
]);

/** Resolve a file or directory into a sorted list of analysable files. */
export function collectSourceFiles(target: string, limit = 500): string[] {
  const absolute = path.resolve(target);
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [absolute];

  const files: string[] = [];
  const walk = (directory: string): void => {
    if (files.length >= limit) return;
    const entries = fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (files.length >= limit) return;
      if (entry.isDirectory()) {
        if (!SKIP_DIRECTORIES.has(entry.name)) walk(path.join(directory, entry.name));
        continue;
      }
      if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        files.push(path.join(directory, entry.name));
      }
    }
  };
  walk(absolute);
  return files;
}

export interface AuditSummary {
  files: number;
  errors: number;
  warnings: number;
  infos: number;
  failing: number;
  verdict: "pass" | "warn" | "fail";
}

export function summariseAudits(audits: SourceAudit[]): AuditSummary {
  let errors = 0;
  let warnings = 0;
  let infos = 0;
  let failing = 0;
  for (const audit of audits) {
    errors += audit.report.counts.error;
    warnings += audit.report.counts.warning;
    infos += audit.report.counts.info;
    if (audit.report.verdict === "fail") failing += 1;
  }
  return {
    files: audits.length,
    errors,
    warnings,
    infos,
    failing,
    verdict: errors > 0 ? "fail" : warnings > 0 ? "warn" : "pass",
  };
}
