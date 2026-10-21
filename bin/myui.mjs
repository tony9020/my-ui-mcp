#!/usr/bin/env node
/**
 * Portable CLI entry point.
 *
 * `npx myui` and `node bin/myui.mjs` both land here. It prefers the compiled
 * `dist/cli.mjs` when it is present and newer than the TypeScript source, and
 * falls back to `tsx` for a fresh clone that has not run `npm run build`.
 *
 * The child runs with the caller's cwd so `myui publish ./Button.tsx` resolves
 * the path the user typed, not the package root. Diagnostics go to stderr;
 * command output owns stdout.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const distCli = path.join(root, "dist", "cli.mjs");
const tsCli = path.join(root, "cli", "main.ts");
const tsxCli = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");

// Prefer the compiled build when it is present and fresh. A published package
// ships dist/ but no tsx, so dist wins when the fallback is unavailable even
// if tar extraction order makes its mtime look older.
let useDist = false;
if (fs.existsSync(distCli)) {
  if (!fs.existsSync(tsCli) || !fs.existsSync(tsxCli)) {
    useDist = true;
  } else {
    try {
      useDist = fs.statSync(distCli).mtimeMs >= fs.statSync(tsCli).mtimeMs;
    } catch {
      useDist = true;
    }
  }
}

let child;
if (useDist) {
  child = spawn(process.execPath, [distCli, ...process.argv.slice(2)], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });
} else {
  if (!fs.existsSync(tsxCli)) {
    process.stderr.write(
      [
        `[myui] Missing dependency: ${tsxCli}`,
        `[myui] Run \`npm install\` in ${root}, or use the published package (which ships dist/cli.mjs).`,
        "",
      ].join("\n"),
    );
    process.exit(1);
  }
  child = spawn(process.execPath, [tsxCli, tsCli, ...process.argv.slice(2)], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });
}

const forward = (signal) => {
  if (!child.killed) child.kill(signal);
};
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => forward(signal));
}

child.on("error", (error) => {
  process.stderr.write(`[myui] Failed to start: ${error.message}\n`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
