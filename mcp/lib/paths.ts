import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** Repository root, resolved from this module rather than the client's cwd. */
export const ROOT = path.resolve(HERE, "../..");
export const COMPONENTS_DIR = path.join(ROOT, "src", "components");
export const APP_DIR = path.join(ROOT, "src", "app");
export const GLOBALS_CSS = path.join(APP_DIR, "globals.css");
export const PACKAGE_JSON = path.join(ROOT, "package.json");
export const CATALOGUE_JSON = path.join(ROOT, "src", "data", "components.json");

export function relativeToRoot(absolutePath: string): string {
  return path.relative(ROOT, absolutePath).split(path.sep).join("/");
}

export function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function packageVersion(): string {
  const pkg = readJson<{ version?: string }>(PACKAGE_JSON, {});
  return pkg.version ?? "1.0.0";
}
