#!/usr/bin/env node
/**
 * my-ui-mcp setup
 *
 * Writes the MCP entry point into the config file of one or more IDEs so a
 * freshly forked clone can be used from that IDE without hand-editing JSON.
 *
 * Design rules:
 *   - Node built-ins only. Nothing to install before running it.
 *   - Never destroys an existing config: read, merge, back up, write.
 *   - Never rewrites a config it cannot parse (JSONC comments, trailing
 *     commas, corrupted files) — it prints the snippet instead.
 *   - stdout carries the report; nothing here talks to the MCP protocol.
 *
 * Usage:
 *   npm run setup -- --ide opencode
 *   npm run setup -- --ide all
 *   npm run setup -- --ide cursor --scope project --dir ~/code/my-app
 *   npm run setup -- --ide claude-code,zend --dry-run
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTRY = path.join(ROOT, "mcp", "run.mjs");
const DEFAULT_NAME = "myui-mcp";

/* ------------------------------------------------------------------ config shapes */

function ensureObject(parent, key) {
  const value = parent[key];
  if (!value || typeof value !== "object" || Array.isArray(value)) parent[key] = {};
  return parent[key];
}

const SHAPES = {
  /** Claude Code, Claude Desktop, Cursor, Windsurf */
  mcpServers(config, name, entry) {
    ensureObject(config, "mcpServers")[name] = { command: "node", args: [entry] };
  },
  /** OpenCode */
  opencode(config, name, entry) {
    ensureObject(ensureObject(config, "mcp"), "servers")[name] = {
      type: "local",
      command: ["node", entry],
    };
  },
  /** VS Code (.vscode/mcp.json and the user-level equivalent) */
  vscode(config, name, entry) {
    ensureObject(config, "servers")[name] = {
      type: "stdio",
      command: "node",
      args: [entry],
    };
  },
  /** Zed (settings.json, JSONC) */
  zed(config, name, entry) {
    ensureObject(config, "context_servers")[name] = {
      source: "custom",
      command: "node",
      args: [entry],
    };
  },
};

/* ------------------------------------------------------------------ IDE targets */

const home = os.homedir();

function vscodeUserConfig() {
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA ?? path.join(home, "AppData", "Roaming"), "Code", "User", "mcp.json");
  }
  if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Code", "User", "mcp.json");
  }
  return path.join(home, ".config", "Code", "User", "mcp.json");
}

function claudeDesktopConfig() {
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA ?? path.join(home, "AppData", "Roaming"), "Claude", "claude_desktop_config.json");
  }
  if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
  }
  return path.join(home, ".config", "Claude", "claude_desktop_config.json");
}

/**
 * A location is installable when its directory already exists, so `--ide all`
 * only touches IDEs that are actually present instead of littering the home
 * directory with config files nobody reads.
 */
const IDES = [
  {
    id: "opencode",
    label: "OpenCode",
    scopes: ["global", "project"],
    global: { file: () => path.join(home, ".config", "opencode", "opencode.json"), shape: "opencode" },
    project: { file: (dir) => path.join(dir, "opencode.json"), shape: "opencode" },
    reload: "Run `opencode reload`, or restart OpenCode.",
  },
  {
    id: "claude-code",
    label: "Claude Code",
    scopes: ["global", "project"],
    global: { file: () => path.join(home, ".claude.json"), shape: "mcpServers", probe: () => [path.join(home, ".claude.json"), path.join(home, ".claude")] },
    project: { file: (dir) => path.join(dir, ".mcp.json"), shape: "mcpServers", probe: (dir) => [path.join(dir, ".mcp.json"), path.join(dir, ".claude")] },
    reload: "Run `/mcp` inside Claude Code, or restart it.",
  },
  {
    id: "claude-desktop",
    label: "Claude Desktop",
    scopes: ["global"],
    global: { file: () => claudeDesktopConfig(), shape: "mcpServers" },
    reload: "Quit Claude Desktop completely and reopen it.",
  },
  {
    id: "cursor",
    label: "Cursor",
    scopes: ["global", "project"],
    global: { file: () => path.join(home, ".cursor", "mcp.json"), shape: "mcpServers" },
    project: { file: (dir) => path.join(dir, ".cursor", "mcp.json"), shape: "mcpServers" },
    reload: "Open Cursor Settings → MCP and refresh, or restart Cursor.",
  },
  {
    id: "vscode",
    label: "VS Code",
    scopes: ["global", "project"],
    global: { file: () => vscodeUserConfig(), shape: "vscode" },
    project: { file: (dir) => path.join(dir, ".vscode", "mcp.json"), shape: "vscode" },
    reload: "Run “MCP: List Servers” from the Command Palette, or reload the window.",
  },
  {
    id: "windsurf",
    label: "Windsurf",
    scopes: ["global"],
    global: { file: () => path.join(home, ".codeium", "windsurf", "mcp_config.json"), shape: "mcpServers" },
    reload: "Restart Windsurf.",
  },
  {
    id: "zed",
    label: "Zed",
    scopes: ["global"],
    global: { file: () => path.join(home, ".config", "zed", "settings.json"), shape: "zed" },
    reload: "Restart Zed, or run “zed: reload settings”.",
  },
];

const IDE_BY_ID = new Map(IDES.map((ide) => [ide.id, ide]));

/* ------------------------------------------------------------------ config IO */

class ParseError extends Error {}

function readConfig(file) {
  if (!fs.existsSync(file)) return { config: {}, existed: false };
  const raw = fs.readFileSync(file, "utf8");
  if (!raw.trim()) return { config: {}, existed: true };
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new ParseError(`${error.message}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ParseError("top level must be a JSON object");
  }
  return { config: parsed, existed: true };
}

function backup(file) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = `${file}.bak.${stamp}`;
  fs.copyFileSync(file, target);
  return target;
}

function writeFile(file, config) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function existsAny(paths) {
  return paths.some((candidate) => fs.existsSync(candidate));
}

function detect(ide, scope, dir) {
  const location = ide[scope];
  if (!location) return false;
  const file = location.file(dir);
  const probes = location.probe ? location.probe(dir) : [path.dirname(file)];
  return existsAny(probes);
}

/* ------------------------------------------------------------------ CLI */

const HELP = `
my-ui-mcp setup — register this MCP server with your IDE(s).

Usage
  npm run setup -- --ide <id>[,<id>...] [options]
  node scripts/setup.mjs --ide <id> [options]

Options
  -i, --ide <ids>     One or more of: ${IDES.map((ide) => ide.id).join(", ")}, or "all".
                      Comma-separated values are accepted.
      --scope <s>     global (default) or project.
      --global        Shorthand for --scope global.
      --project       Shorthand for --scope project.
      --dir <path>    Project directory for --scope project (default: the
                      current directory). Point this at your own project when
                      you run the installer from inside this repo.
  -n, --name <name>   Server name to register (default: ${DEFAULT_NAME}).
      --dry-run       Print what would be written; change nothing.
      --list          List supported IDEs and exit.
  -h, --help          Show this help.

Examples
  npm run setup -- --ide opencode
  npm run setup -- --ide all
  npm run setup -- --ide cursor --project --dir ~/code/my-app
  npm run setup -- --ide vscode --dry-run

What gets written
  The server always launches as:  node <this-repo>/mcp/run.mjs
  Absolute paths are used, so the IDE's working directory never matters.
`;

function fail(message) {
  console.error(`\n  ✗ ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const options = {
    ide: [],
    scope: "global",
    dir: null,
    name: DEFAULT_NAME,
    dryRun: false,
    list: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = () => {
      const next = argv[index + 1];
      if (next === undefined) fail(`${arg} requires a value`);
      index += 1;
      return next;
    };
    switch (arg) {
      case "-h":
      case "--help":
        options.help = true;
        break;
      case "--list":
        options.list = true;
        break;
      case "-i":
      case "--ide":
        options.ide.push(...value().split(",").map((item) => item.trim()).filter(Boolean));
        break;
      case "--scope": {
        const scope = value();
        if (scope !== "global" && scope !== "project") fail(`--scope must be global or project, got "${scope}"`);
        options.scope = scope;
        break;
      }
      case "--global":
        options.scope = "global";
        break;
      case "--project":
        options.scope = "project";
        break;
      case "--dir":
        options.dir = path.resolve(value());
        break;
      case "-n":
      case "--name":
        options.name = value();
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      default:
        fail(`Unknown option: ${arg} (run with --help)`);
    }
  }
  return options;
}

/* ------------------------------------------------------------------ main */

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(HELP);
    return;
  }

  if (options.list) {
    console.log("\nSupported IDEs:\n");
    for (const ide of IDES) {
      console.log(`  ${ide.id.padEnd(15)} ${ide.label}  (scopes: ${ide.scopes.join(", ")})`);
    }
    console.log("");
    return;
  }

  if (!options.ide.length) {
    console.log(HELP);
    fail('Tell me where to install: pass --ide <id> or --ide all.');
  }

  if (!/^[A-Za-z0-9._-]+$/.test(options.name)) {
    fail(`--name must be simple (letters, digits, dot, dash, underscore); got "${options.name}"`);
  }

  if (!fs.existsSync(ENTRY)) {
    fail(`MCP entry point missing: ${ENTRY}`);
  }
  if (!fs.existsSync(path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs"))) {
    fail(`Dependencies are not installed. Run \`npm install\` in ${ROOT} first.`);
  }

  const requested = options.ide.includes("all")
    ? [...IDES]
    : options.ide.map((id) => {
        const ide = IDE_BY_ID.get(id);
        if (!ide) fail(`Unknown IDE "${id}". Run --list to see what is supported.`);
        return ide;
      });

  const dir = options.scope === "project" ? (options.dir ?? process.cwd()) : null;
  if (options.scope === "project" && !options.dir && path.resolve(dir) === ROOT) {
    console.error(
      `\n  ! --scope project with no --dir would write into the MCP repo itself:\n    ${ROOT}\n    Pass --dir /path/to/your/project to target your own project.\n`,
    );
  }

  const explicit = !options.ide.includes("all");
  const written = [];
  const skipped = [];
  const blocked = [];

  for (const ide of requested) {
    if (!ide.scopes.includes(options.scope)) {
      if (explicit) skipped.push(`${ide.label}: ${options.scope} scope is not supported (use ${ide.scopes.join(" or ")})`);
      continue;
    }

    if (!explicit && !detect(ide, options.scope, dir)) {
      skipped.push(`${ide.label}: not detected, skipped`);
      continue;
    }

    const location = ide[options.scope];
    const file = location.file(dir);
    const apply = SHAPES[location.shape];

    try {
      const { config, existed } = readConfig(file);
      apply(config, options.name, ENTRY);

      if (options.dryRun) {
        console.log(`\n  ~ ${ide.label} (${options.scope}) — dry run, ${file}`);
        console.log(`      would set ${describeKey(location.shape, options.name)}`);
        console.log(`${JSON.stringify(config, null, 2).split("\n").map((line) => `      ${line}`).join("\n")}`);
        written.push(`${ide.label} (${options.scope}) — dry run`);
        continue;
      }

      let backupPath = null;
      if (existed) backupPath = backup(file);
      writeFile(file, config);

      console.log(`\n  ✓ ${ide.label} (${options.scope})`);
      console.log(`      file  ${file}`);
      console.log(`      key   ${describeKey(location.shape, options.name)}`);
      if (backupPath) console.log(`      backup ${backupPath}`);
      written.push(`${ide.label} (${options.scope})`);
    } catch (error) {
      if (error instanceof ParseError) {
        blocked.push(`${ide.label}: could not parse ${file} (${error.message})`);
        console.log(`\n  ! ${ide.label} (${options.scope}) — left untouched`);
        console.log(`      ${file} is not plain JSON, so it was not modified.`);
        console.log("      Add this block manually:");
        printSnippet(location.shape, options.name);
      } else {
        throw error;
      }
    }
  }

  console.log("\n────────────────────────────────────────────");
  if (written.length) {
    console.log(`  ${options.dryRun ? "Would update" : "Updated"} ${written.length} location(s): ${written.join(", ")}`);
    console.log(`  Server: node ${ENTRY}`);
    if (!options.dryRun) {
      const reloads = [...new Set(
        requested.filter((ide) => written.some((entry) => entry.startsWith(ide.label))).map((ide) => ide.reload),
      )];
      if (reloads.length) console.log("  Next step:");
      for (const hint of reloads) console.log(`    • ${hint}`);
      console.log("  Then ask the agent: “use myui to help me build …”");
    }
  }
  if (skipped.length) {
    console.log(`\n  Skipped:`);
    for (const line of skipped) console.log(`    • ${line}`);
  }
  if (blocked.length) {
    console.log(`\n  Needs manual edit:`);
    for (const line of blocked) console.log(`    • ${line}`);
  }
  if (!written.length && !blocked.length) {
    console.log("  Nothing was installed. Re-run with an explicit --ide value.");
  }
  console.log("");
}

function describeKey(shape, name) {
  if (shape === "opencode") return `mcp.servers.${name}`;
  if (shape === "vscode") return `servers.${name}`;
  if (shape === "zed") return `context_servers.${name}`;
  return `mcpServers.${name}`;
}

function snippetFor(shape, name) {
  const config = {};
  SHAPES[shape](config, name, ENTRY);
  return JSON.stringify(config, null, 2);
}

function printSnippet(shape, name) {
  for (const line of snippetFor(shape, name).split("\n")) console.log(`        ${line}`);
}

main();
