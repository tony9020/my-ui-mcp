import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { extractImports } from "../../mcp/lib/derived";
import { validateComposition } from "../../mcp/lib/validate";
import { packageVersion } from "../../mcp/lib/paths";
import { ApiError, publishRemote } from "../lib/api";
import { resolveApiUrl, resolveToken } from "../lib/config";
import { fail, paint, printJson } from "../lib/output";

const MAX_BYTES = 1024 * 1024;

export interface PublishCommandOptions {
  dryRun?: boolean;
  local?: boolean;
  force?: boolean;
  includeContent?: boolean;
  name?: string;
  slug?: string;
  category?: string;
  license?: string;
  description?: string;
  apiUrl?: string;
  token?: string;
  json?: boolean;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "component"
  );
}

function titleCase(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function describe(content: string): string {
  for (const line of content.split("\n")) {
    const text = line
      .replace(/\/\/.*$/, "")
      .replace(/[{}<>]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (
      text.length > 30 &&
      !/^(import|export|const|let|var|function|return|className|type|interface)\b/.test(text)
    ) {
      return text.slice(0, 200);
    }
  }
  return "Published from the My Ui CLI.";
}

export async function runPublish(file: string, options: PublishCommandOptions): Promise<number> {
  const absolute = path.resolve(file);
  if (!fs.existsSync(absolute)) {
    fail(`file not found: ${file}`);
    return 1;
  }
  const stat = fs.statSync(absolute);
  if (!stat.isFile()) {
    fail(`not a file: ${file}`);
    return 1;
  }
  if (stat.size > MAX_BYTES) {
    fail(`${file} is ${stat.size} bytes; the publish limit is ${MAX_BYTES} bytes.`);
    return 1;
  }

  const content = fs.readFileSync(absolute, "utf8");
  const report = validateComposition(content, { fileName: absolute });
  if (report.counts.error > 0 && !options.force) {
    fail(
      `${report.counts.error} validation error(s) in ${file}. Run \`myui audit ${file}\` for details, or pass --force to publish anyway.`,
    );
    return 1;
  }

  const base = path.basename(absolute, path.extname(absolute));
  const slug = slugify(options.slug ?? options.name ?? base);
  const name = options.name ?? titleCase(base);
  const checksum = crypto.createHash("sha256").update(content).digest("hex");
  const imports = [...extractImports(content)].sort();

  const payload = {
    name,
    slug,
    fileName: path.basename(absolute),
    category: options.category ?? null,
    license: options.license ?? "MIT",
    description: options.description ?? describe(content),
    content,
    imports,
    checksum,
    bytes: Buffer.byteLength(content, "utf8"),
    validation: {
      verdict: report.verdict,
      score: report.score,
      counts: report.counts,
    },
    client: { name: "myui-cli", version: packageVersion() },
    publishedAt: new Date().toISOString(),
  };

  const summary = {
    name,
    slug,
    fileName: payload.fileName,
    bytes: payload.bytes,
    checksum,
    imports,
    validation: payload.validation,
    dryRun: Boolean(options.dryRun),
    local: Boolean(options.local),
  };

  if (options.dryRun) {
    if (options.json) {
      printJson({
        ...summary,
        payload: options.includeContent ? payload : { ...payload, content: undefined },
      });
    } else {
      process.stdout.write(
        [
          paint("bold", "Publish dry run"),
          "",
          `  Name:    ${name}`,
          `  Slug:    ${slug}`,
          `  File:    ${payload.fileName} (${payload.bytes} bytes)`,
          `  Checksum:${checksum}`,
          `  Licence: ${payload.license}`,
          `  Verdict: ${report.verdict} (${report.counts.error} error, ${report.counts.warning} warning)`,
          `  Imports: ${imports.join(", ") || "none"}`,
          "",
          "Nothing was uploaded. Remove --dry-run to publish to the configured API.",
        ].join("\n") + "\n",
      );
    }
    return 0;
  }

  if (options.local) {
    const directory = path.resolve(process.cwd(), ".myui", "registry");
    fs.mkdirSync(directory, { recursive: true });
    const target = path.join(directory, `${slug}.json`);
    fs.writeFileSync(target, JSON.stringify(payload, null, 2) + "\n", "utf8");
    if (options.json) {
      printJson({ ...summary, local: true, path: target });
    } else {
      process.stdout.write(`Wrote ${target}\n`);
      process.stdout.write("Local only — this did not reach a hosted registry.\n");
    }
    return 0;
  }

  const apiUrl = resolveApiUrl(options.apiUrl);
  const token = resolveToken(options.token);
  if (!apiUrl || !token) {
    fail(
      "No hosted API configured. Run `myui login --api-url <url> --token <token>`, set MYUI_API_URL and MYUI_TOKEN, or use --dry-run / --local.",
    );
    return 2;
  }

  try {
    const response = await publishRemote(payload, { apiUrl, token });
    if (options.json) {
      printJson({ ...summary, dryRun: false, remote: response });
    } else {
      process.stdout.write(`Published ${name} to ${apiUrl}.\n`);
      if (response && typeof response === "object" && "url" in response) {
        process.stdout.write(`URL: ${String((response as { url: unknown }).url)}\n`);
      }
    }
    return 0;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        fail("The host rejected the token (401). Run `myui login` again.");
      } else if (error.status === 404) {
        fail(
          "The host has no /api/v1/publish endpoint yet. That route ships in Phase 4; use --dry-run or --local for now.",
        );
      } else if (error.status === 0) {
        fail(`Could not reach the API: ${error.message}`);
      } else {
        fail(`Publish failed: ${error.message}`);
      }
      return 1;
    }
    const message = error instanceof Error ? error.message : String(error);
    fail(`Publish failed: ${message}`);
    return 1;
  }
}
