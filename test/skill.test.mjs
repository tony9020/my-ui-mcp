import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  SOURCE,
  installSkill,
  parseFrontmatter,
  validateSkillDirectory,
} from "../scripts/install-skill.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const skillDir = path.join(root, "skills", "my-ui");
const skillFile = path.join(skillDir, "SKILL.md");
const installer = path.join(root, "scripts", "install-skill.mjs");

const CLI_COMMANDS = [
  "search",
  "audit",
  "review",
  "status",
  "tokens",
  "map-tokens",
  "login",
  "logout",
  "publish",
];

const MCP_TOOLS = [
  "list_components",
  "get_component_details",
  "get_component_bundle",
  "suggest_combination",
  "validate_ui_composition",
  "get_design_tokens",
  "get_component_preview",
  "find_similar",
  "compare_components",
  "plan_install",
  "list_facets",
  "map_tokens",
  "audit_catalogue",
  "server_status",
];

function run(args, options = {}) {
  return spawnSync(process.execPath, [installer, ...args], {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    timeout: 30_000,
    env: { ...process.env, NO_COLOR: "1", ...options.env },
  });
}

function withTempDir(callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "myui-skill-"));
  try {
    return callback(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("SKILL.md frontmatter is valid and matches the directory name", () => {
  const text = fs.readFileSync(skillFile, "utf8");
  const { fields, body } = parseFrontmatter(text);
  assert.equal(fields.name, "my-ui");
  assert.match(fields.name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  assert.ok(fields.description.length >= 80);
  assert.ok(fields.description.length <= 1024);
  assert.match(fields.description, /find a component/i);
  assert.match(fields.description, /audit/i);
  assert.match(fields.description, /publish/i);
  assert.match(body, /^# My Ui/m);

  const info = validateSkillDirectory(skillDir);
  assert.equal(info.name, "my-ui");
  assert.equal(info.references.length, 3);
});

test("SKILL.md documents every CLI command and every MCP tool", () => {
  const text = fs.readFileSync(skillFile, "utf8");
  for (const command of CLI_COMMANDS) {
    assert.match(text, new RegExp(`myui ${command}`), `missing CLI command: ${command}`);
  }
  for (const tool of MCP_TOOLS) {
    assert.match(text, new RegExp(tool), `missing MCP tool: ${tool}`);
  }
  for (const heading of [
    "## When to use this skill",
    "## Choose your interface",
    "## Core workflow",
    "## CLI quick reference",
    "## MCP tool map",
    "## Search rules",
    "## Tokens and theming",
    "## Audit and review",
    "## Publishing",
    "## Guardrails",
    "## References",
  ]) {
    assert.match(text, new RegExp(`^${heading}$`, "m"), `missing heading: ${heading}`);
  }
});

test("installer --help lists every supported target", () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0);
  for (const target of ["opencode", "claude-code", "cursor", "agents"]) {
    assert.match(result.stdout, new RegExp(target));
  }
  assert.match(result.stdout, /--dry-run/);
  assert.match(result.stdout, /--link/);
});

test("installer --dry-run writes nothing", () =>
  withTempDir((directory) => {
    const result = run(["--ide", "all", "--dir", directory, "--dry-run", "--json"]);
    assert.equal(result.status, 0);
    const body = JSON.parse(result.stdout);
    assert.equal(body.dryRun, true);
    assert.equal(body.results.length, 4);
    for (const item of body.results) {
      assert.equal(item.action, "created");
      assert.equal(fs.existsSync(item.path), false);
    }
  }));

test("installer copies the skill to all four targets", () =>
  withTempDir((directory) => {
    const result = run(["--ide", "all", "--dir", directory, "--json"]);
    assert.equal(result.status, 0);
    const body = JSON.parse(result.stdout);
    assert.equal(body.results.length, 4);
    for (const item of body.results) {
      assert.equal(item.action, "created");
      assert.equal(item.mode, "copy");
      assert.ok(fs.existsSync(path.join(item.path, "SKILL.md")));
      assert.ok(fs.existsSync(path.join(item.path, "references", "cli.md")));
      assert.ok(fs.existsSync(path.join(item.path, "references", "handoff.md")));
      assert.ok(fs.existsSync(path.join(item.path, "references", "guardrails.md")));
    }
  }));

test("a second install is idempotent", () =>
  withTempDir((directory) => {
    assert.equal(run(["--ide", "all", "--dir", directory]).status, 0);
    const result = run(["--ide", "all", "--dir", directory, "--json"]);
    assert.equal(result.status, 0);
    const body = JSON.parse(result.stdout);
    for (const item of body.results) {
      assert.equal(item.action, "unchanged");
    }
  }));

test("installer refuses to overwrite a modified skill without --force", () =>
  withTempDir((directory) => {
    assert.equal(run(["--ide", "opencode", "--dir", directory]).status, 0);
    const target = path.join(directory, ".opencode", "skills", "my-ui", "SKILL.md");
    fs.appendFileSync(target, "\n<!-- local edit -->\n");

    const skipped = run(["--ide", "opencode", "--dir", directory, "--json"]);
    assert.equal(skipped.status, 1);
    const skippedBody = JSON.parse(skipped.stdout);
    assert.equal(skippedBody.results[0].action, "skipped");
    assert.match(skippedBody.results[0].reason, /--force/);

    const forced = run(["--ide", "opencode", "--dir", directory, "--force", "--json"]);
    assert.equal(forced.status, 0);
    const forcedBody = JSON.parse(forced.stdout);
    assert.equal(forcedBody.results[0].action, "backed-up");
    assert.ok(fs.existsSync(forcedBody.results[0].backup));
    assert.equal(
      fs.readFileSync(path.join(directory, ".opencode", "skills", "my-ui", "SKILL.md"), "utf8"),
      fs.readFileSync(skillFile, "utf8"),
    );
  }));

test("installer --link creates a symlink to the canonical skill", () =>
  withTempDir((directory) => {
    if (process.platform === "win32") return;
    const result = run(["--ide", "opencode", "--dir", directory, "--link", "--json"]);
    assert.equal(result.status, 0);
    const body = JSON.parse(result.stdout);
    assert.equal(body.results[0].mode, "symlink");
    const target = body.results[0].path;
    assert.equal(fs.lstatSync(target).isSymbolicLink(), true);
    assert.equal(fs.realpathSync(target), fs.realpathSync(skillDir));
  }));

test("installSkill can be called directly", () =>
  withTempDir((directory) => {
    const result = installSkill({ ides: ["cursor"], dir: directory, source: SOURCE });
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0].ide, "cursor");
    assert.equal(result.results[0].action, "created");
    assert.ok(fs.existsSync(path.join(directory, ".cursor", "skills", "my-ui", "SKILL.md")));
  }));

test("unknown IDE and unknown flags fail with a clear message", () =>
  withTempDir((directory) => {
    const ide = run(["--ide", "vscode", "--dir", directory, "--dry-run"]);
    assert.equal(ide.status, 1);
    assert.match(ide.stderr, /Unknown IDE/);

    const flag = run(["--nope"]);
    assert.equal(flag.status, 1);
    assert.match(flag.stderr, /Unknown option/);
  }));

test("validateSkillDirectory rejects an invalid name", () =>
  withTempDir((directory) => {
    const bad = path.join(directory, "Bad_Name");
    fs.mkdirSync(path.join(bad, "references"), { recursive: true });
    fs.writeFileSync(path.join(bad, "SKILL.md"), "---\nname: Bad_Name\ndescription: x\n---\n# x\n");
    for (const reference of ["cli.md", "handoff.md", "guardrails.md"]) {
      fs.writeFileSync(path.join(bad, "references", reference), "# x\n");
    }
    assert.throws(() => validateSkillDirectory(bad), /Invalid skill name/);
  }));

test("validateSkillDirectory rejects a description over 1024 characters", () =>
  withTempDir((directory) => {
    const bad = path.join(directory, "too-long");
    fs.mkdirSync(path.join(bad, "references"), { recursive: true });
    fs.writeFileSync(
      path.join(bad, "SKILL.md"),
      `---\nname: too-long\ndescription: ${"x".repeat(1025)}\n---\n# x\n`,
    );
    for (const reference of ["cli.md", "handoff.md", "guardrails.md"]) {
      fs.writeFileSync(path.join(bad, "references", reference), "# x\n");
    }
    assert.throws(() => validateSkillDirectory(bad), /limit is 1024/);
  }));
