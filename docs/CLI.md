# `myui` CLI

The CLI exposes the same index and analysis pipeline as the MCP server without
requiring an MCP client. It is additive: the 14 MCP tools, their arguments and
the resource URIs are unchanged.

## Run it

```bash
# from a clone
npm install
npm run build              # optional; without dist/ it falls back to tsx
node bin/myui.mjs --help

# after `npm publish`
npx myui --help
```

The launcher prefers `dist/cli.mjs` when it exists and is fresh, and falls back
to `tsx cli/main.ts` in a fresh checkout. It runs with **your** working
directory, so relative paths resolve the way you typed them.

## Commands

Global flags: `--json`, `--no-color`, `--verbose`.

### `myui search [query]`

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

The footer reports how many records were excluded by the licence gate and how
many non-canonical records were collapsed. `--json` returns the same data as
`results`, `total`, `excludedForLicence`, `excludedDuplicates` and
`elapsedMs`.

### `myui audit [target]`

- No target: catalogue health report (trust tiers, licence classes,
  code-quality signals, heavy dependencies).
- File: static analysis of that file.
- Directory: recursive analysis, skipping `node_modules`, `.git`, `.next`,
  `dist`, `build`, `out`, `coverage`.

Flags: `--fail-on none|error|warning` (default `error`), `--limit <n>` (max
files, default 500).

`--json` returns `{ target, summary, catalogue? , files? }`. Each source file
includes `imports`, `bytes` and the full `ValidationReport`.

### `myui review [target]`

`audit` with a stricter default: warnings fail the run. Intended for CI.

### `myui status`

Version, Node version, index counts, derived-data freshness and the current
configuration. `--json` is stable and safe to parse.

### `myui tokens`

Flags: `--type colors|typography|spacing|radius|shadows|animations|all`
(default `all`), `--format md|json|css` (default `md`).

### `myui map-tokens [file]`

Reads CSS variables (or a token list) and maps them onto My Ui semantic token
names. Omit the file or pass `--stdin` to read stdin. Unmapped variables are
reported, never guessed.

### `myui login` / `myui logout`

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

The config shape:

```json
{
  "apiUrl": "https://my-ui.example.com",
  "token": "…",
  "email": "dev@example.com",
  "expiresAt": "2026-12-31T00:00:00.000Z",
  "local": false,
  "updatedAt": "2026-10-21T00:00:00.000Z"
}
```

Environment overrides: `MYUI_API_URL`, `MYUI_TOKEN`, `MYUI_CONFIG`.

### `myui publish <file>`

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

**Phase 1 limitation:** there is no hosted `/api/v1/publish` yet. Without
`--dry-run` or `--local`, `publish` exits `2` with
*"No hosted API configured"*. It never fakes a successful upload.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success. |
| `1` | Validation failure, audit failure, or a failed remote request. |
| `2` | Missing configuration (no API URL/token, missing input, non-interactive login). |

Commander uses `1` for unknown commands and invalid options.

## CI recipes

```bash
# Fail on any validation error in a component directory
npx myui audit src/components --fail-on error

# Fail on warnings too
npx myui review src/components --fail-on warning

# Machine-readable search for a dashboard
npx myui search "pricing" --json --limit 50 > search.json

# Validate before publishing
npx myui publish ./NewBlock.tsx --dry-run --json
```

The repository's own suite runs 14 CLI tests through `node bin/myui.mjs`, so
the launcher, argument parsing, JSON contract and exit codes are covered:

```bash
npm test
```

## What Phase 1 does not include

- No hosted API, database, or accounts. `login` and `publish` are client-side
  contracts until Phase 4.
- No `SKILL.md` yet (Phase 2).
- No HTTP/SSE MCP transport yet (Phase 4).
- `search --remote` is reserved for the Phase 4 `/api/v1/search` route. Against
  a host without it, the command fails with a clear error.
