#!/usr/bin/env node
/**
 * Portable MCP entry point.
 *
 * Every IDE config in this repo points at `node <repo>/mcp/run.mjs`.
 * It resolves the repository from its own file location, so it works no matter
 * what the client's working directory is, and it fails loudly instead of
 * silently when dependencies are missing.
 *
 * stdout is reserved for JSON-RPC. All diagnostics go to stderr.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const tsxCli = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
const tsServer = path.join(here, "server.ts");
const distServer = path.join(root, "dist", "server.mjs");

// Prefer the compiled build when it is present and fresh. A published
// package ships dist/ but no tsx, so dist wins when the tsx fallback is
// unavailable even if tar extraction order makes its mtime look older.
let useDist = false;
if (fs.existsSync(distServer)) {
  if (!fs.existsSync(tsServer) || !fs.existsSync(tsxCli)) {
    useDist = true;
  } else {
    try {
      useDist = fs.statSync(distServer).mtimeMs >= fs.statSync(tsServer).mtimeMs;
    } catch {
      useDist = true;
    }
  }
}

let child;
if (useDist) {
  child = spawn(process.execPath, [distServer], { cwd: root, stdio: "inherit", env: process.env });
} else {
  if (!fs.existsSync(tsxCli)) {
    console.error(
      [
        `[my-ui-mcp] Missing dependency: ${path.relative(process.cwd(), tsxCli) || tsxCli}`,
        `[my-ui-mcp] Run \`npm install\` in ${root} and restart your MCP client.`,
      ].join("\n"),
    );
    process.exit(1);
  }
  if (!fs.existsSync(tsServer)) {
    console.error(`[my-ui-mcp] Server not found: ${tsServer}`);
    process.exit(1);
  }
  child = spawn(process.execPath, [tsxCli, tsServer], { cwd: root, stdio: "inherit", env: process.env });
}

const forward = (signal) => {
  if (!child.killed) child.kill(signal);
};
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => forward(signal));
}

child.on("error", (error) => {
  console.error(`[my-ui-mcp] Failed to start server: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
