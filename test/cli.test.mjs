import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const cli = path.join(root, "bin", "myui.mjs");
const fixtures = path.join(here, "fixtures");

// A per-process config path keeps the tests away from the developer's real
// ~/.config/myui/config.json.
const TEST_CONFIG = path.join(os.tmpdir(), `myui-cli-test-${process.pid}.json`);

function run(args, { env = {}, cwd = root } = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8",
    timeout: 90_000,
    env: {
      ...process.env,
      NO_COLOR: "1",
      MYUI_ALLOW_NETWORK: "false",
      MYUI_CONFIG: TEST_CONFIG,
      ...env,
    },
  });
}

function json(result) {
  assert.equal(
    result.status,
    0,
    `expected exit 0, got ${result.status}\nstderr:\n${result.stderr}\nstdout:\n${result.stdout}`,
  );
  return JSON.parse(result.stdout);
}

test("help lists the Phase 1 commands", () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0);
  for (const command of ["search", "audit", "review", "status", "tokens", "map-tokens", "login", "logout", "publish"]) {
    assert.match(result.stdout, new RegExp(`\\b${command}\\b`));
  }
});

test("status reports the real index counts", () => {
  const body = json(run(["status", "--json"]));
  assert.equal(body.index.localComponents, 57);
  assert.equal(body.index.catalogueRecords, 8157);
  assert.equal(body.index.totalComponents, 8214);
  assert.equal(body.derived.fresh, true);
  assert.equal(body.config.apiUrl, null);
});

test("search finds the local Button and reports licence exclusions", () => {
  const body = json(run(["search", "button", "--json", "--limit", "5"]));
  assert.ok(body.count >= 1);
  assert.ok(body.results.some((item) => item.name === "Button"));
  assert.ok(body.excludedForLicence > 0);
  assert.ok(body.excludedDuplicates > 0);
  assert.equal(typeof body.elapsedMs, "number");
});

test("search can widen the licence gate and keep duplicates", () => {
  const narrow = json(run(["search", "button", "--json", "--limit", "20"]));
  const wide = json(
    run([
      "search",
      "button",
      "--json",
      "--limit",
      "20",
      "--include-duplicates",
      "--license",
      "any",
    ]),
  );
  assert.ok(wide.total >= narrow.total);
  assert.equal(wide.excludedForLicence, 0);
  assert.equal(wide.excludedDuplicates, 0);
});

test("audit passes the clean fixture", () => {
  const body = json(run(["audit", path.join(fixtures, "clean.tsx"), "--json"]));
  assert.equal(body.summary.errors, 0);
  assert.equal(body.summary.verdict, "pass");
  assert.equal(body.files[0].report.verdict, "pass");
});

test("audit fails the bad fixture with a non-zero exit", () => {
  const result = run(["audit", path.join(fixtures, "bad.tsx"), "--json"]);
  assert.equal(result.status, 1);
  const body = JSON.parse(result.stdout);
  assert.ok(body.summary.errors >= 5);
  assert.equal(body.summary.verdict, "fail");
  assert.ok(body.files[0].report.findings.some((finding) => finding.severity === "error"));
});

test("review is stricter and still passes the clean fixture", () => {
  const body = json(run(["review", path.join(fixtures, "clean.tsx"), "--json"]));
  assert.equal(body.summary.errors, 0);
  assert.equal(body.summary.warnings, 0);
});

test("audit with no target reports the 8,157-record catalogue", () => {
  const body = json(run(["audit", "--json"]));
  assert.equal(body.catalogue.total, 8157);
  assert.ok(body.catalogue.canonical > 0);
  assert.ok(body.catalogue.trust.reference > 0);
});

test("publish --dry-run validates and prints a checksum without uploading", () => {
  const body = json(run(["publish", path.join(fixtures, "clean.tsx"), "--dry-run", "--json"]));
  assert.equal(body.dryRun, true);
  assert.equal(body.validation.verdict, "pass");
  assert.match(body.checksum, /^[a-f0-9]{64}$/);
  assert.equal(body.bytes > 0, true);
});

test("publish without an API exits 2 with an actionable message", () => {
  const result = run(["publish", path.join(fixtures, "clean.tsx"), "--json"], {
    env: {
      MYUI_CONFIG: path.join(os.tmpdir(), `myui-missing-${process.pid}.json`),
      MYUI_API_URL: "",
      MYUI_TOKEN: "",
    },
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /No hosted API configured/);
  assert.match(result.stderr, /--dry-run/);
});

test("publish --local writes a registry payload under the cwd", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "myui-publish-"));
  const body = json(
    run(["publish", path.join(fixtures, "clean.tsx"), "--local", "--slug", "newsletter", "--json"], {
      cwd: directory,
    }),
  );
  assert.equal(body.local, true);
  // macOS resolves /var to /private/var in the child's process.cwd().
  const target = path.join(fs.realpathSync(directory), ".myui", "registry", "newsletter.json");
  assert.equal(body.path, target);
  assert.ok(fs.existsSync(target));
  const payload = JSON.parse(fs.readFileSync(target, "utf8"));
  assert.equal(payload.slug, "newsletter");
  assert.match(payload.checksum, /^[a-f0-9]{64}$/);
});

test("login --local writes a 0600 config and logout removes it", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "myui-login-"));
  const config = path.join(directory, "config.json");
  const login = json(
    run(
      ["login", "--local", "--token", "test-token-123456", "--email", "dev@example.com", "--json"],
      { env: { MYUI_CONFIG: config } },
    ),
  );
  assert.equal(login.saved, true);
  assert.equal(login.local, true);
  assert.ok(fs.existsSync(config));
  if (process.platform !== "win32") {
    assert.equal(fs.statSync(config).mode & 0o777, 0o600);
  }
  const status = json(run(["status", "--json"], { env: { MYUI_CONFIG: config } }));
  assert.equal(status.config.local, true);
  assert.equal(status.config.email, "dev@example.com");
  assert.match(status.config.token, /…/);
  const logout = json(run(["logout", "--json"], { env: { MYUI_CONFIG: config } }));
  assert.equal(logout.removed, true);
  assert.equal(fs.existsSync(config), false);
});

test("tokens returns the parsed colour tokens", () => {
  const body = json(run(["tokens", "--type", "colors", "--format", "json"]));
  assert.equal(body.type, "colors");
  assert.ok(body.tokens.colors.tokens.length > 30);
  assert.ok(body.tokens.colors.tokens.some((token) => token.name === "background"));
});

test("map-tokens maps known names and reports unmapped variables", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "myui-tokens-"));
  const file = path.join(directory, "tokens.css");
  fs.writeFileSync(
    file,
    ":root {\n  --background: #ffffff;\n  --primary: #7c3aed;\n  --unknown-thing: #000;\n}\n",
  );
  const body = json(run(["map-tokens", file, "--json"]));
  assert.ok(body.mappings.length >= 3);
  assert.ok(body.mappings.some((mapping) => mapping.user === "--background" && mapping.myui === "--background"));
  assert.ok(body.unmapped.some((mapping) => mapping.user === "--unknown-thing"));
});
