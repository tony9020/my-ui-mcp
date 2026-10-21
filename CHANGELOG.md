# Changelog

## [Unreleased] — Phase 2 Agent Skill

### Added
- `skills/my-ui/SKILL.md`: canonical Agent Skill with YAML `name` and
  `description`, explicit trigger conditions, exact CLI commands per workflow,
  a 14-tool MCP map and the design guardrails.
- `skills/my-ui/references/cli.md`, `handoff.md` and `guardrails.md`.
- `scripts/install-skill.mjs` + `npm run skill`: installs the skill into
  OpenCode, Claude Code, Cursor and generic Agent Skills directories. Supports
  project/global scope, copy/symlink, `--dry-run`, and `--force` with
  timestamped backups.
- `myui-skill` bin for `npx myui-skill`.
- 12 skill and installer tests (48 tests total).

### Changed
- README documents the skill and installer.
- Package metadata adds the `myui-skill` bin, `skill` scripts and discovery
  keywords.

### Notes
- No changes to the CLI commands, the 14 MCP tools, prompts, resources or URIs.

## [Unreleased] — Phase 1 CLI

### Added
- `myui` CLI (`bin/myui.mjs`, `cli/`, `core/`) with `login`, `logout`,
  `search`, `publish`, `audit`, `review`, `status`, `tokens` and `map-tokens`.
- Offline search over the existing index with the same licence gate, trust
  tiers and duplicate policy as the MCP server.
- Catalogue and source audit, including recursive directory scanning and
  `--fail-on none|error|warning`.
- `publish --dry-run` and `--local`; remote publish is a client contract until
  `/api/v1/publish` ships in Phase 4.
- `core/audit.ts` and `core/map-tokens.ts`, shared by the CLI and the future
  HTTP API.
- 14 CLI tests under `test/cli.test.mjs` (36 tests total).
- `bin` / `exports` / `files` package metadata and a `prepack` build for `npx`.
- `docs/CLI.md`.

### Changed
- `tsx` moved to `devDependencies`; `dist/` is the published runtime path.
- `mcp/run.mjs` and `bin/myui.mjs` prefer `dist/` when `tsx` is unavailable,
  so a published install does not depend on tar extraction order.
- README updated for 14 tools and the CLI.

### Notes
- No breaking changes to the 14 MCP tools, prompts, resources or URIs.

## [Unreleased] — upgrade

### Added
- `scripts/derive-catalogue.mjs` + `npm run derive`: offline derivation pipeline
  writing `src/data/catalogue-derived.json` (trust tiers, licence classes,
  deduplication, code-quality signals, compliance/popularity scores, resolved
  preview URLs, heavy deps, framework lock).
- `scripts/audit.mjs` + `npm run audit`: data-quality report re-measuring
  every finding.
- 8 new tools: `get_component_preview`, `find_similar`, `compare_components`,
  `plan_install`, `list_facets`, `map_tokens`, `audit_catalogue`, `server_status`.
- `list_components` filters: `tags`, `categories`, `license_policy`,
  `min_trust`, `framework`, `has_preview`, `max_deps`, `sort`, `cursor`,
  `include_duplicates`, `explain`.
- `get_component_bundle` budget controls: `include_source`, `format`, `max_chars`.
- `license_policy` and `include_duplicates` on `get_component_bundle` and
  `suggest_combination`.
- Trust tiers (`verified`/`linked`/`reference`) and `licenseClass` on every
  record; `copyInstruction` is now tier-aware.
- Catalogue copy targets moved to `src/components/catalogue/<author>-<slug>.tsx`
  (no more collisions with local components or with each other).
- Deduplication: canonical records by default, `alternates` count, `include_duplicates`.
- Real-import-based dependency extraction; declared-but-unused deps reported.
- Relevance-ranked `related` with score and reasons.
- Absolute preview URLs.
- MiniSearch full-text index (fuzzy + prefix), LRU search cache.
- Lazy AST parsing for catalogue records; memoised.
- Compiled path (`npm run build` → `dist/server.mjs`) preferred by `run.mjs`.
- `node:test` suite under `test/` (22 unit tests + smoke).
- `docs/SCORING.md`, `docs/PERFORMANCE.md`, `docs/DECISIONS.md`.

### Changed
- `list_components` default licence policy is now `permissive-only`.
- `findComponents` accepts an options object (backward compatible).
- `npm run typecheck` still covers `mcp/**/*.ts`.

### Fixed
- Contradictory "copy exactly" wording on `reference` records.
- `npm install` lines no longer include `framer-motion` for code that doesn't
  use it.
- Catalogue `related` is no longer the first 6 records of the primary category.
- Preview URLs are now absolute.

### Security
- Redacted three `sk_live_...` keys inherited from upstream marketplace demo
  code; added `redactSecrets()` to the harvest pipeline.
