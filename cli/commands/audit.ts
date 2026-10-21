import path from "node:path";
import { auditCatalogue, auditSource, collectSourceFiles, summariseAudits } from "../../core/audit";
import type { AuditSummary } from "../../core/audit";
import { validationMarkdown } from "../../mcp/lib/validate";
import { getIndex } from "../lib/index";
import { paint, printJson, table } from "../lib/output";

export type FailOn = "none" | "error" | "warning";

export interface AuditCommandOptions {
  json?: boolean;
  verbose?: boolean;
  failOn?: FailOn;
  limit?: number;
}

function exitCode(summary: AuditSummary, failOn: FailOn): number {
  if (failOn === "none") return 0;
  if (failOn === "warning") return summary.errors + summary.warnings > 0 ? 1 : 0;
  return summary.errors > 0 ? 1 : 0;
}

function catalogueMarkdown(report: ReturnType<typeof auditCatalogue>): string {
  const lines = [
    "# Catalogue audit",
    "",
    `- Total records: ${report.total}`,
    `- Canonical: ${report.canonical}`,
    `- Non-canonical (collapsed by default): ${report.nonCanonical}`,
    `- Verified: ${report.verified}`,
    `- Linked (has sourceUrl): ${report.linked}`,
    `- Reference (no sourceUrl): ${report.reference}`,
    "",
    "## Licence classes",
    ...Object.entries(report.licences)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => `- ${name}: ${count}`),
    "",
    "## Trust tiers",
    ...Object.entries(report.trust)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => `- ${name}: ${count}`),
    "",
    "## Code-quality signals",
    `- Declared-but-unused dependencies: ${report.issues.declaredDepsUnused}`,
    `- Undefined keyframes: ${report.issues.undefinedKeyframes}`,
    `- Demo/component mismatch: ${report.issues.demoMismatch}`,
    `- Hardcoded colours: ${report.issues.hardcodedColor}`,
    `- Unresolvable imports: ${report.issues.unresolvableImports}`,
    `- Has reduced-motion handling: ${report.issues.reducedMotion}`,
    "",
    "## Top heavy dependencies",
    ...(report.topHeavyDeps.length
      ? report.topHeavyDeps.map(([name, count]) => `- ${name}: ${count}`)
      : ["- none"]),
  ];
  return lines.join("\n");
}

export async function runAudit(target: string | undefined, options: AuditCommandOptions): Promise<number> {
  if (!target) {
    const report = auditCatalogue(getIndex());
    if (options.json) {
      printJson({ target: "catalogue", catalogue: report });
    } else {
      process.stdout.write(catalogueMarkdown(report) + "\n");
    }
    return 0;
  }

  let files: string[];
  try {
    files = collectSourceFiles(target, options.limit ?? 500);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`error: ${message}\n`);
    return 1;
  }

  if (!files.length) {
    process.stderr.write(`error: no analysable source files under ${target}\n`);
    return 1;
  }

  const audits = files.map((file) => auditSource(file));
  const summary = summariseAudits(audits);
  const code = exitCode(summary, options.failOn ?? "error");

  if (options.json) {
    printJson({
      target,
      summary,
      files: audits.map((audit) => ({
        file: audit.file,
        bytes: audit.bytes,
        imports: audit.imports,
        report: audit.report,
      })),
    });
    return code;
  }

  for (const audit of audits) {
    if (audits.length > 1) {
      process.stdout.write(`\n${paint("bold", path.relative(process.cwd(), audit.file))}\n\n`);
    }
    process.stdout.write(validationMarkdown(audit.report) + "\n");
  }

  if (audits.length > 1) {
    const rows = audits.map((audit) => [
      path.relative(process.cwd(), audit.file),
      String(audit.report.counts.error),
      String(audit.report.counts.warning),
      String(audit.report.counts.info),
      audit.report.verdict,
    ]);
    process.stdout.write("\n" + table(["file", "errors", "warnings", "info", "verdict"], rows) + "\n");
  }

  process.stdout.write(
    `\n${summary.files} file(s) · ${summary.errors} error(s) · ${summary.warnings} warning(s) · ${summary.infos} info · verdict ${summary.verdict}\n`,
  );
  return code;
}
