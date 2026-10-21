import { packageVersion } from "../../mcp/lib/paths";
import { derivedMap, isDerivedFresh } from "../../mcp/lib/derived";
import { configPath, readConfig, redactToken, resolveApiUrl, resolveToken } from "../lib/config";
import { getIndex } from "../lib/index";
import { printJson } from "../lib/output";

export interface StatusCommandOptions {
  json?: boolean;
}

export async function runStatus(options: StatusCommandOptions): Promise<number> {
  const started = Date.now();
  const index = getIndex();
  const config = readConfig();

  const payload = {
    version: packageVersion(),
    node: process.version,
    platform: `${process.platform}/${process.arch}`,
    cwd: process.cwd(),
    index: {
      root: index.root,
      localComponents: index.localComponentCount,
      catalogueRecords: index.catalogueRecordCount,
      totalComponents: index.components.length,
      canonicalComponents: index.components.filter((component) => component.isCanonical !== false).length,
      categories: index.categories.length,
      sourceFiles: index.sourceFileCount,
      catalogueSource: index.catalogueSource,
    },
    derived: {
      present: Boolean(derivedMap()),
      fresh: isDerivedFresh(),
      file: "src/data/catalogue-derived.json",
    },
    config: {
      path: configPath(),
      apiUrl: resolveApiUrl(),
      token: redactToken(resolveToken()),
      local: config.local ?? false,
      email: config.email ?? null,
      updatedAt: config.updatedAt ?? null,
    },
    elapsedMs: Date.now() - started,
  };

  if (options.json) {
    printJson(payload);
    return 0;
  }

  process.stdout.write(
    [
      `My Ui CLI ${payload.version}`,
      `Node ${payload.node} · ${payload.platform}`,
      "",
      `Index root:        ${payload.index.root}`,
      `Local components:  ${payload.index.localComponents}`,
      `Catalogue records: ${payload.index.catalogueRecords}`,
      `Total records:     ${payload.index.totalComponents}`,
      `Canonical:         ${payload.index.canonicalComponents}`,
      `Categories:        ${payload.index.categories}`,
      `Derived data:      ${payload.derived.present ? (payload.derived.fresh ? "present, fresh" : "present, stale (in-process recompute)") : "missing (in-process recompute)"}`,
      "",
      `Config:            ${payload.config.path}`,
      `API URL:           ${payload.config.apiUrl ?? "not configured"}`,
      `Token:             ${payload.config.token ?? "not configured"}${payload.config.local ? " (unverified, --local)" : ""}`,
      `Account:           ${payload.config.email ?? "unknown"}`,
      `Status built in:   ${payload.elapsedMs} ms`,
    ].join("\n") + "\n",
  );
  return 0;
}
