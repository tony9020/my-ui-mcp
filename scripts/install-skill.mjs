#!/usr/bin/env node
/**
 * Install the canonical My Ui skill into an IDE's skill directory.
 *
 * Source of truth: `skills/my-ui/` in this repository. The installer never
 * edits the source. It copies the directory (SKILL.md + references) or, with
 * `--link`, creates a symlink so future edits in the repo are picked up.
 *
 * Supported targets:
 *   opencode     .opencode/skills/my-ui          ~/.config/opencode/skills/my-ui
 *   claude-code  .claude/skills/my-ui            ~/.claude/skills/my-ui
 *   cursor       .cursor/skills/my-ui            ~/.cursor/skills/my-ui
 *   agents       .agents/skills/my-ui            ~/.agents/skills/my-ui
 *
 * Existing different skills are skipped unless `--force` is passed; `--force`
 * renames the old directory to `<target>.bak-<timestamp>` before writing.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
export const SOURCE = path.join(ROOT, "skills", "my-ui");
export const SKILL_NAME = "my-ui";

export const TARGETS = {
  opencode: {
    project: path.join(".opencode", "skills", SKILL_NAME),
    global: path.join(os.homedir(), ".config", "opencode", "skills", SKILL_NAME),
  },
  "claude-code": {
    project: path.join(".claude", "skills", SKILL_NAME),
    global: path.join(os.homedir(), ".claude", "skills", SKILL_NAME),
  },
  cursor: {
    project: path.join(".cursor", "skills", SKILL_NAME),
    global: path.join(os.homedir(), ".cursor", "skills", SKILL_NAME),
  },
  agents: {
    project: path.join(".agents", "skills", SKILL_NAME),
    global: path.join(os.homedir(), ".agents", "skills", SKILL_NAME),
  },
};

const IDE_ALIASES = {
  opencode: "opencode",
  "claude-code": "claude-code",
  claude: "claude-code",
  cursor: "cursor",
  agents: "agents",
  all: "all",
};

function shouldSkip(name) {
  return name === ".DS_Store" || name === "node_modules" || name.startsWith(".bak-");
}

export function parseFrontmatter(text) {
  const normalized = text.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    throw new Error("SKILL.md must start with a YAML frontmatter block (---).");
  }
  const end = normalized.indexOf("\n---", 4);
  if (end === -1) {
    throw new Error("SKILL.md frontmatter is not closed with ---.");
  }
  const yaml = normalized.slice(4, end);
  const body = normalized.slice(end + 4).replace(/^\n/, "");
  const fields = {};
  const lines = yaml.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.startsWith(" ") || line.startsWith("\t")) continue;
    const match = line.match(/^([A-Za-z0-9_/-]+):\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if (value === ">-" || value === ">" || value === "|" || value === "|-") {
      const folded = value.startsWith(">");
      const collected = [];
      while (
        index + 1 < lines.length &&
        (lines[index + 1].startsWith(" ") || lines[index + 1].startsWith("\t"))
      ) {
        collected.push(lines[index + 1].trim());
        index += 1;
      }
      value = folded ? collected.join(" ") : collected.join("\n");
    }
    fields[key] = value.replace(/^["']|["']$/g, "");
  }
  return { fields, body };
}

export function validateSkillDirectory(directory = SOURCE) {
  const skillFile = path.join(directory, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    throw new Error(`Missing ${skillFile}.`);
  }
  const text = fs.readFileSync(skillFile, "utf8");
  const { fields, body } = parseFrontmatter(text);
  const name = fields.name ?? "";
  const description = fields.description ?? "";

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    throw new Error(
      `Invalid skill name "${name}". Use lowercase letters, digits and single hyphens (^[a-z0-9]+(-[a-z0-9]+)*$).`,
    );
  }
  if (name.length > 64) {
    throw new Error(`Skill name "${name}" is ${name.length} characters; the limit is 64.`);
  }
  if (name !== path.basename(directory)) {
    throw new Error(`Skill name "${name}" must match the directory name "${path.basename(directory)}".`);
  }
  if (!description) {
    throw new Error("SKILL.md frontmatter needs a non-empty description.");
  }
  if (description.length > 1024) {
    throw new Error(`Description is ${description.length} characters; the limit is 1024.`);
  }
  if (!body.trim()) {
    throw new Error("SKILL.md needs a body after the frontmatter.");
  }

  const references = ["cli.md", "handoff.md", "guardrails.md"];
  for (const reference of references) {
    if (!fs.existsSync(path.join(directory, "references", reference))) {
      throw new Error(`Missing reference: references/${reference}.`);
    }
  }

  return { name, description, license: fields.license ?? null, body, references };
}

function listFiles(directory, base = directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (shouldSkip(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(full, base));
    else if (entry.isFile()) files.push(path.relative(base, full));
  }
  return files.sort();
}

function directoriesEqual(a, b) {
  const left = listFiles(a);
  const right = listFiles(b);
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
    const leftBytes = fs.readFileSync(path.join(a, left[index]));
    const rightBytes = fs.readFileSync(path.join(b, right[index]));
    if (!leftBytes.equals(rightBytes)) return false;
  }
  return true;
}

function copyDirectory(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (shouldSkip(entry.name)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) copyDirectory(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
  }
}

function pathExists(target) {
  try {
    fs.lstatSync(target);
    return true;
  } catch {
    return false;
  }
}

function isSymlinkTo(target, source) {
  try {
    if (!fs.lstatSync(target).isSymbolicLink()) return false;
    return fs.realpathSync(target) === fs.realpathSync(source);
  } catch {
    return false;
  }
}

function createAt(target, source, link, dryRun) {
  if (dryRun) return link ? "symlink" : "copy";
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (link) {
    try {
      fs.symlinkSync(source, target, process.platform === "win32" ? "junction" : "dir");
      return "symlink";
    } catch (error) {
      process.stderr.write(
        `warning: could not create a symlink at ${target}: ${error instanceof Error ? error.message : String(error)}. Copying instead.\n`,
      );
    }
  }
  copyDirectory(source, target);
  return "copy";
}

function backupPath(target) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  let candidate = `${target}.bak-${stamp}`;
  let suffix = 1;
  while (pathExists(candidate)) {
    candidate = `${target}.bak-${stamp}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function installSkill(options) {
  const source = options.source ?? SOURCE;
  validateSkillDirectory(source);

  const scope = options.scope ?? "project";
  const baseDir = path.resolve(options.dir ?? process.cwd());
  const link = Boolean(options.link);
  const force = Boolean(options.force);
  const dryRun = Boolean(options.dryRun);
  const requested = options.ides ?? ["opencode", "claude-code", "cursor", "agents"];

  const results = [];
  for (const ide of requested) {
    const definition = TARGETS[ide];
    if (!definition) throw new Error(`Unknown IDE: ${ide}`);
    const target = scope === "global" ? definition.global : path.join(baseDir, definition.project);
    const exists = pathExists(target);

    if (!exists) {
      const mode = createAt(target, source, link, dryRun);
      results.push({ ide, path: target, action: "created", mode });
      continue;
    }

    if (isSymlinkTo(target, source)) {
      results.push({ ide, path: target, action: "unchanged", mode: "symlink" });
      continue;
    }

    if (!link && !fs.lstatSync(target).isSymbolicLink() && directoriesEqual(source, target)) {
      results.push({ ide, path: target, action: "unchanged", mode: "copy" });
      continue;
    }

    if (!force) {
      results.push({
        ide,
        path: target,
        action: "skipped",
        mode: "existing",
        reason: "target exists and differs; pass --force to replace it",
      });
      continue;
    }

    const backup = backupPath(target);
    if (!dryRun) fs.renameSync(target, backup);
    const mode = createAt(target, source, link, dryRun);
    results.push({ ide, path: target, action: "backed-up", mode, backup });
  }

  return { source, scope, dir: baseDir, dryRun, results };
}

export function parseArgs(argv) {
  const options = {
    ides: ["opencode", "claude-code", "cursor", "agents"],
    scope: "project",
    dir: process.cwd(),
    link: false,
    force: false,
    dryRun: false,
    json: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    switch (argument) {
      case "--ide": {
        const value = argv[++index];
        if (!value) throw new Error("--ide needs a value.");
        const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
        if (parts.includes("all")) {
          options.ides = ["opencode", "claude-code", "cursor", "agents"];
        } else {
          options.ides = parts.map((part) => {
            const resolved = IDE_ALIASES[part];
            if (!resolved) throw new Error(`Unknown IDE "${part}". Use opencode, claude-code, cursor, agents or all.`);
            return resolved;
          });
        }
        break;
      }
      case "--scope": {
        const value = argv[++index];
        if (value !== "project" && value !== "global") {
          throw new Error("--scope must be project or global.");
        }
        options.scope = value;
        break;
      }
      case "--dir": {
        const value = argv[++index];
        if (!value) throw new Error("--dir needs a value.");
        options.dir = value;
        break;
      }
      case "--link":
        options.link = true;
        break;
      case "--force":
        options.force = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--json":
        options.json = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new Error(`Unknown option "${argument}".`);
    }
  }

  return options;
}

function usage() {
  return [
    "My Ui skill installer",
    "",
    "Usage:",
    "  node scripts/install-skill.mjs [options]",
    "",
    "Options:",
    "  --ide <list>       opencode, claude-code, cursor, agents, all (default: all)",
    "  --scope <scope>    project or global (default: project)",
    "  --dir <path>       project root (default: cwd)",
    "  --link             symlink the skill directory instead of copying",
    "  --force            replace an existing different skill (backs it up first)",
    "  --dry-run          print actions without writing",
    "  --json             machine-readable result",
    "  -h, --help         show this help",
    "",
    "Examples:",
    "  npm run skill -- --ide all",
    "  npm run skill -- --ide opencode --scope global",
    "  npm run skill -- --ide cursor --dir ~/code/my-app --dry-run",
  ].join("\n");
}

function printHuman(result) {
  const rows = result.results.map((item) => [
    item.ide,
    item.path,
    item.action === "backed-up" ? `backed up + ${item.mode}` : item.action,
    item.backup ?? item.reason ?? "",
  ]);
  const widths = [12, 58, 20, 24];
  const line = (cells) =>
    cells
      .map((cell, index) => String(cell).padEnd(widths[index] ?? 0))
      .join("  ")
      .trimEnd();
  process.stdout.write(`${line(["target", "path", "action", "note"])}\n`);
  process.stdout.write(`${line(["─".repeat(12), "─".repeat(58), "─".repeat(20), "─".repeat(12)])}\n`);
  for (const row of rows) process.stdout.write(`${line(row)}\n`);
  process.stdout.write(
    `\n${result.dryRun ? "Dry run — nothing was written." : "Done."} Reload your IDE; the skill appears as \`${SKILL_NAME}\`` +
      (result.results.some((item) => item.ide === "opencode") ? " (OpenCode: `/my-ui`)." : ".") +
      "\n",
  );
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(usage() + "\n");
    return 0;
  }

  const result = installSkill(options);
  if (options.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } else {
    process.stdout.write(
      `Source: ${result.source}\nScope:  ${result.scope}${result.scope === "project" ? ` (${result.dir})` : ""}\nMode:   ${options.link ? "symlink" : "copy"}${result.dryRun ? " · dry run" : ""}\n\n`,
    );
    printHuman(result);
  }

  return result.results.some((item) => item.action === "skipped") ? 1 : 0;
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  }
}

if (isMainModule()) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      process.stderr.write(`error: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
