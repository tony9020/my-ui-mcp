# `myui` CLI reference

The CLI exposes the same index and analysis pipeline as the MCP server without
requiring an MCP client. It is additive: the 14 MCP tools, their arguments and
the resource URIs are unchanged.

## Run it

```bash
# from a clone
npm install
npm run build
node bin/myui.mjs --help

# after `npm publish`
npx myui --help
```

The launcher prefers `dist/cli.mjs` when it exists and is fresh, and falls back
to `tsx cli/main.ts` in a fresh checkout. It runs with **your** working
directory, so relative paths resolve the way you typed them.

Global flags: `--json`, `--no-color`, `--verbose`.

## `myui search [query]`

Ranked local-first search over 57 verified exports and the 8,157-record
catalogue. Defaults: `--license permissive-only`, `--trust reference`,
`--limit 10`, duplicates collapsed.

| Flag | Meaning |
| --- | --- |
| `--category <category>` | Category name or slug (`Primitives`, `ui`, …). |
| `--tag <tag...>` | Require every tag. |
| `--kind <kind>` | `primitive`, `pattern`, `section`, `provider`, `catalogue`. |
| `--license <policy>` | `permissive-only`, `allow-weak-copyleft`, `any`. |
| `--trust <tier>` | `verified`, `linked`, `reference`. |
| `--limit <n>` | Maximum results (default 10). |
| `--include-duplicates` | Keep non-canonical catalogue duplicates. |
| `--sort <order>` | `relevance`, `popularity`, `recent`, `compliance`. |
| `--remote` | Query the hosted `/api/v1/search` instead of the local index. |
| `--api-url <url>` / `--token <token>` | Override the stored API settings. |

The footer reports licence exclusions and non-canonical records collapsed.
`--json` returns `query`, `count`, `total`, `excludedForLicence`,
`excludedDuplicates`, `elapsedMs` and `results`.

Each result includes `id`, `name`, `slug`, `origin`, `category`, `kind`,
`description`, `file`, `importPath`, `tags`, `props`, `trustTier`,
`licenseClass`, `isCanonical`, `complianceScore`, `popularityScore` and
`resolvedPreviewUrl`.

## `myui audit [target]`

- No target: catalogue health report (trust tiers, licence classes,
  code-quality signals, heavy dependencies).
- File: static analysis of that file.
- Directory: recursive analysis, skipping `node_modules`, `.git`, `.next`,
  `dist`, `build`, `out`, `coverage`.

Flags: `--fail-on none|error|warning` (default `error`), `--limit <n>` (max
files, default 500).

`--json` returns `{ target, summary, catalogue? , files? }`. Each source file
includes `imports`, `bytes` and the full `ValidationReport`.

## `myui review [target]`

`audit` with a stricter default: warnings fail the run. Intended for CI.
`--strict` is accepted for readability; `--fail-on` still wins.

## `myui status`

Version, Node version, index counts, derived-data freshness and the current
configuration. `--json` is stable and safe to parse.

## `myui tokens`

Flags: `--type colors|typography|spacing|radius|shadows|animations|all`
(default `all`), `--format md|json|css` (default `md`). `--json` also forces
JSON output.

## `myui map-tokens [file]`

Reads CSS variables (or a token list) and maps them onto My Ui semantic token
names. Omit the file or pass `--stdin` to read stdin. Unmapped variables are
reported, never guessed. `--json` returns `mappings`, `unmapped` and
`hexValues`.

## `myui login` / `myui logout`

`login` stores a bearer token at `$MYUI_CONFIG` or
`~/.config/myui/config.json` with mode `0600`.

| Flag | Meaning |
| --- | --- |
| `--token <token>` | Token; omit to be prompted. |
| `--api-url <url>` | Hosted API base URL. |
| `--email <email>` | Display-only account email. |
| `--local` | Store without contacting a host. |
| `--offline` | Skip token verification. |

When an API URL is configured and `--offline` is not passed, the CLI calls
`GET /api/v1/me`. A `401` aborts without saving. A missing endpoint or network
error saves the token **unverified** and says so.

Environment overrides: `MYUI_API_URL`, `MYUI_TOKEN`, `MYUI_CONFIG`.

## `myui publish <file>`

1. Rejects files larger than 1 MiB.
2. Runs the composition validator. Errors abort unless `--force`.
3. Computes a SHA-256 checksum and the imported npm packages.
4. Sends `{ name, slug, fileName, category, license, description, content,
   imports, checksum, bytes, validation, client, publishedAt }` to
   `POST /api/v1/publish`.

| Flag | Meaning |
| --- | --- |
| `--dry-run` | Print the payload summary, upload nothing. |
| `--local` | Write `.myui/registry/<slug>.json` under the current directory. |
| `--force` | Publish despite validation errors. |
| `--include-content` | Include source in `--dry-run --json`. |
| `--name`, `--slug`, `--category`, `--license`, `--description` | Override derived metadata. |
| `--api-url`, `--token` | Override the stored API settings. |

**Current limitation:** there is no hosted `/api/v1/publish` yet. Without
`--dry-run` or `--local`, `publish` exits `2` with
*"No hosted API configured"*. It never fakes a successful upload.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success. |
| `1` | Validation failure, audit failure, or a failed remote request. |
| `2` | Missing configuration (no API URL/token, missing input, non-interactive login). |

Commander uses `1` for unknown commands and invalid options.

## Examples

```bash
myui search "pricing table" --limit 5
myui search button --json --license any --include-duplicates
myui search "" --category Primitives --kind primitive
myui audit src/components/ui/button.tsx
myui review src/components --fail-on warning
myui tokens --type colors --format css
myui map-tokens tokens.css --json
myui publish ./Button.tsx --dry-run
myui publish ./Button.tsx --local        # writes .myui/registry/button.json
```
