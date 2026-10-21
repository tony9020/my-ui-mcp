# Changelog

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
