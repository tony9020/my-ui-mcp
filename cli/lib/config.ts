/**
 * Local CLI configuration.
 *
 * The token lives in a single JSON file outside the repository:
 *   $MYUI_CONFIG || ~/.config/myui/config.json
 *
 * Written with mode 0600 so a shared machine does not leak the token. The
 * file is never bundled into the package, never printed, and never forwarded
 * to the MCP server (which stays stateless and stdio-only).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface MyUiConfig {
  /** Hosted API base URL, for example https://my-ui.example.com */
  apiUrl?: string;
  /** Bearer token issued by the hosted API. */
  token?: string;
  /** Email or handle returned by /api/v1/me, when available. */
  email?: string;
  /** ISO timestamp from the host, when available. */
  expiresAt?: string;
  /** True when the token was stored with `--local` and never verified. */
  local?: boolean;
  /** Last write time, for diagnostics only. */
  updatedAt?: string;
}

export function configPath(): string {
  return process.env.MYUI_CONFIG || path.join(os.homedir(), ".config", "myui", "config.json");
}

export function readConfig(): MyUiConfig {
  try {
    const raw = fs.readFileSync(configPath(), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as MyUiConfig) : {};
  } catch {
    return {};
  }
}

export function writeConfig(config: MyUiConfig): string {
  const file = configPath();
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const body = JSON.stringify({ ...config, updatedAt: new Date().toISOString() }, null, 2) + "\n";
  fs.writeFileSync(file, body, { mode: 0o600 });
  try {
    fs.chmodSync(file, 0o600);
  } catch {
    // Some filesystems (Windows, mounted volumes) do not support chmod.
  }
  return file;
}

export function clearConfig(): boolean {
  try {
    fs.unlinkSync(configPath());
    return true;
  } catch {
    return false;
  }
}

export function resolveApiUrl(explicit?: string): string | null {
  const value = explicit || process.env.MYUI_API_URL || readConfig().apiUrl || "";
  return value ? value.replace(/\/+$/, "") : null;
}

export function resolveToken(explicit?: string): string | null {
  return explicit || process.env.MYUI_TOKEN || readConfig().token || null;
}

/** Show enough of a token to recognise it without leaking it. */
export function redactToken(token: string | null): string | null {
  if (!token) return null;
  if (token.length <= 8) return "••••";
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}
