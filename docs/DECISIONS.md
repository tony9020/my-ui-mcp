# Decisions

Ambiguous points in the upgrade task and the choice made. Precedence: my design
system > Hallmark > Impeccable > Emil/Jakub (inherited from the vendored
skills); for this server, correctness > search quality > feature breadth.

1. **Dedup grouping uses union-find over code-hash AND normalised name.**
   The task lists "duplicate slugs / duplicate names / identical-code duplicates"
   as separate categories but asks to collapse "duplicate-code and same-name
   records". Union-find over both keys collapses all three kinds into one
   canonical per connected component. Chosen because it matches the acceptance
   criterion literally and keeps the canonical count meaningful (6,218 of 8,157).

2. **Catalogue copy target.** Changed from `src/components/ui/<slug>.tsx` to
   `src/components/catalogue/<author>-<slug>.tsx` to eliminate collisions with
   local components (8 slug collisions) and with other catalogue records (1,746
   slug collisions). Import path follows. Breaking-ish change, documented.

3. **Default licence policy is `permissive-only`.** Matches the safety default
   in the original handoff. `include_duplicates` defaults to `false`.

4. **Local components are `first-party` licence class**, not `permissive`, so
   they always pass any policy. Their `complianceScore` is 100 and `trustTier`
   is `verified`.

5. **Trust tier for catalogue = `linked` if `sourceUrl` else `reference`.**
   Only 15 of 8,157 are linked. This is a harsh but honest classification.

6. **Real vs declared dependencies.** `dependencies.npm` now contains only
   actually-imported packages. Declared-but-unused are reported separately
   (`codeQuality.declaredDepsUnused` and `HandoffBundle.install`). The install
   line never includes `framer-motion` for code that doesn't import it.

7. **`related` uses primary-category buckets only** (not all shared categories)
   to keep startup under a few seconds. Cross-category neighbours are not yet
   considered (listed in Known limitations).

8. **MiniSearch lazy build.** The index is built on first search, not startup,
   to keep startup under ~1.2 s. First search pays ~330 ms.

9. **LRU cache for search** (128 entries) makes repeated queries instant. This
   is what satisfies "warm p95 < 20 ms"; novel queries are ~25 ms.

10. **Compiled path uses esbuild** (single `dist/server.mjs`, 285 KB) rather
    than tsc, because tsc with NodeNext required fixing 168 implicit-any errors
    and the codebase is written for bundler resolution. `tsx` remains the
    fallback. `run.mjs` picks `dist/server.mjs` when present and fresh.

11. **`type: "module"`** added to package.json. All executable scripts are
    `.mjs`, so this is safe.

12. **No second runtime dependency** beyond MiniSearch. Image fetching uses
    built-in `fetch`. esbuild is a dev dependency.

13. **Reduced-motion detection** counts `prefers-reduced-motion` media queries
    (53 records) plus Tailwind `motion-reduce` utilities (10). The earlier
    report's "0" referred to Tailwind-utility form only.

14. **F5 definition**: "demo does not import a path containing its slug" = 179
    records (2.2%), not 752. The higher figure likely counts export-name
    mismatches, which are common in the catalogue (e.g. "Nova" demoing a
    "GradientBackground"). I kept the stricter, reproducible definition.

15. **F2 numbers**: 5,464 of 7,780 declared-dep instances unused (70.2%),
    not 5,760 (74%). F3: 66 of 1,183 actually import framer-motion (not 0).
    F7 identical-code: 1,344 records in 332 groups (≈1,012 extras beyond
    canonical), not ≈1,012 total.
16. **`validate_ui_composition` enhanced with focus-visible check** only;
    the existing regex-based checks already cover alt text, clickable
    non-semantic, reduced motion and hardcoded colours. AST-based rewrite was
    deferred (see follow-ups).
17. **`map_tokens` is name-similarity based**, not semantic. Unmapped tokens
    are flagged for manual review.
18. **`audit_catalogue` is in-process** (not shelling out to `npm run audit`),
    returning a concise report. The full report is available via the CLI.

## Phase 1 — CLI

19. **CLI lives in the standalone repo, web/API in the parent.** The 10k-line
    index and analysis core already lives here; the Next.js/Vercel surface
    lives in `21st clone`. The parent consumes this package instead of
    duplicating the core (the duplication removed in `48190cb`).

20. **`commander` is the only new runtime dependency.** Zero transitive
    dependencies, ~100 KB. Hand-rolling argv parsing would save one dependency
    but lose `--help` formatting, choices and suggestion behaviour for nine
    commands.

21. **`publish` is honest about the missing backend.** With no API configured
    it exits `2` and says so. `--dry-run` and `--local` are fully functional.
    Reporting a fake successful upload was rejected.

22. **The data ships in the package.** `npm pack` is **6.8 MB compressed**
    (43.5 MB unpacked) for 8,214 records. That is small enough for `npx`;
    a postinstall download was rejected because it fails offline and behind
    proxies. A compressed/slim index can follow if the catalogue grows.

23. **`tsx` is a devDependency; `dist/` is the published runtime.** `prepack`
    builds `dist/server.mjs`, `dist/cli.mjs` and `dist/core.mjs`. Both
    launchers prefer `dist/` when `tsx` is absent, so tar extraction order
    cannot send a published install down the `tsx` path.

24. **`core/` re-exports, it does not move.** `core/index.ts` points at the
    existing `mcp/lib/*` modules and adds only `audit.ts` and `map-tokens.ts`.
    The MCP server, its 14 tools, prompts, resources and URIs are untouched.

## Phase 2 — Agent Skill

25. **One universal Agent Skills format for every IDE.** `skills/my-ui/SKILL.md`
    uses the portable `name` + `description` frontmatter. OpenCode reads
    `.opencode/skills/`, `.claude/skills/` and `.agents/skills/`; Claude Code
    reads `.claude/skills/`; Cursor reads `.cursor/skills/`. The installer
    writes the same directory shape everywhere. A separate Cursor `.mdc` was
    rejected because modern Cursor supports skills and a second copy would
    drift.

26. **The skill is a router, not a second manual.** `SKILL.md` stays short
    enough to load on demand and points at three references. The CLI and MCP
    tool descriptions remain the source of truth; the skill teaches when to
    call them and what not to invent. It does not re-implement search, audit or
    publishing logic.

27. **Copy by default, symlink on request.** A copy is predictable and works
    on every filesystem. `--link` is available for people who edit the skill in
    the repo and want the IDE to see changes immediately. `--force` renames an
    existing different skill to `<target>.bak-<timestamp>` before writing; it
    never deletes user content silently. Project scope is the default; global
    writes require `--scope global`.

28. **`myui-skill` is a second bin.** Consumers should not need to know the
    repository layout to install the skill. `npx myui-skill --ide all` works
    from the published package. The canonical source still lives in `skills/`.
