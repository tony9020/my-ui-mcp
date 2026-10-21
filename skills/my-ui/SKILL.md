---
name: my-ui
description: Find, audit, install and publish My Ui components with the myui CLI or the my-ui MCP server. Use when the user asks to find a component, add a UI block, audit accessibility or design tokens, map their CSS variables, plan an install, compare alternatives, replace a component, or publish to the component library.
license: MIT
metadata:
  audience: designers-and-engineers
  workflow: design-system
  opencode/slash: "true"
---
# My Ui

My Ui is a design system with **57 verified local exports across 35 files** and
an **8,157-record marketplace catalogue**. This skill tells you when to use it,
which command or tool to call, and what not to invent.

## When to use this skill

Use it when the user asks to:

- Find a component or a UI block ("pricing table", "settings form", "empty state").
- Add or install a My Ui component into a project.
- Audit or review a TSX, JSX, HTML or CSS snippet.
- Use, inspect or map design tokens, or theme an existing app.
- Compare alternatives, find a replacement, or plan an install.
- Publish a component to the library.

Do not use it for backend, data, or non-UI work.

## Choose your interface

1. **MCP server connected (`myui`)?** Prefer the MCP tools. They return parsed
   props, exact source, dependencies and licence/trust metadata in one call.
2. **`myui` CLI installed?** Use the CLI.
3. **Neither?** Run `npx myui ...`, or from a clone `npm run cli -- ...`.

Never fabricate a tool result. If the interface is unavailable, say so and give
the exact install command.

## Core workflow

**Plan → Review → Build → Critique.**

1. **Plan** — ask for the brief before selecting anything. The eight questions
   are in `references/handoff.md`.
2. **Review** — search local first, fall back to the catalogue. Report origin,
   trust tier, licence class and exclusions. Never treat a `reference` record
   as verified source.
3. **Build** — hand the exact source and copy target. Do not paraphrase,
   reformat or regenerate it. Adapt only after the user copies it.
4. **Critique** — validate the final usage and report what changed, what stayed
   the same, and what still needs a decision.

## CLI quick reference

| Goal | Command |
| --- | --- |
| Search | `myui search "<intent>" --limit 8` |
| Search, machine-readable | `myui search "<intent>" --json` |
| Browse a category | `myui search "" --category Primitives --limit 20` |
| Include weak-copyleft | `myui search "<q>" --license allow-weak-copyleft` |
| Include duplicates | `myui search "<q>" --include-duplicates` |
| Audit one file | `myui audit path/to/Component.tsx` |
| Audit a directory (CI) | `myui review src/components --fail-on warning` |
| Catalogue health | `myui audit` |
| Tokens | `myui tokens --type colors --format json` |
| Map tokens | `myui map-tokens tokens.css --json` |
| Index and config status | `myui status --json` |
| Publish dry run | `myui publish Component.tsx --dry-run` |
| Publish locally | `myui publish Component.tsx --local` |
| Publish remotely | `myui login --api-url <url>` then `myui publish Component.tsx` |
| Remove the stored token | `myui logout` |

Always pass `--json` when another tool or script will parse the output. Full
flags, exit codes and JSON shapes are in `references/cli.md`.

## MCP tool map

| Goal | Tool |
| --- | --- |
| Search or browse | `list_components` |
| One component's metadata and source | `get_component_details` |
| Exact copy-ready source | `get_component_bundle` |
| Plan a page | `suggest_combination` |
| Validate a snippet | `validate_ui_composition` |
| Tokens | `get_design_tokens`, `map_tokens` |
| Preview image | `get_component_preview` |
| Alternatives | `find_similar`, `compare_components` |
| Install plan | `plan_install` |
| Discover facets | `list_facets` |
| Catalogue and server health | `audit_catalogue`, `server_status` |

Prompts: `design_layout_guide` and `component_handoff` (OpenCode exposes them
as `/myui:design_layout_guide` and `/myui:component_handoff`). Resources:
`myui://handoff`, `myui://design-principles`, `myui://design-tokens`,
`myui://components`, `myui://inventory`, `myui://catalogue/`.

## Search rules

- The default licence policy is `permissive-only`. Weak-copyleft and unknown
  licences are excluded unless the user opts in with
  `--license allow-weak-copyleft` or `--license any`.
- The default is one canonical record per duplicate group.
  `--include-duplicates` reveals the alternates.
- Local components are `first-party`, `verified`. Catalogue records are
  `linked` only when they have a `sourceUrl`; otherwise they are `reference`.
- A `reference` record is illustrative. Check the licence and the source URL
  before production use; never present it as verified.
- When records are excluded, say how many and why.

## Tokens and theming

- Read tokens with `myui tokens --type <family> --format json` or the
  `get_design_tokens` tool. Families: `colors`, `typography`, `spacing`,
  `radius`, `shadows`, `animations`, `all`.
- Map an existing theme with `myui map-tokens <file> --json` before editing.
- Use semantic roles (`background`, `foreground`, `primary`, `muted`,
  `border`, `ring`, `destructive`) rather than raw hex or palette classes.
- If a needed token does not exist, say so. Do not invent a token name.

## Audit and review

- `myui audit <file>` returns severity counts and fixes.
- `myui review <dir> --fail-on warning` is the CI gate.
- Report errors first, then warnings. Do not suppress findings.
- The audit is static analysis, not a runtime accessibility test. Say so.

## Publishing

1. Run `myui publish <file> --dry-run --json`.
2. Show the validation verdict, checksum and imports.
3. Ask for explicit confirmation before a real publish.
4. Use `--local` to write `.myui/registry/<slug>.json` when no API is
   configured; use `myui login` for a hosted API.
5. Never claim a publish succeeded without a response or a written file.

## Guardrails

- Do not invent components, props, variants, token names, licences, authors,
  metrics, prices, testimonials or logos.
- Do not copy a catalogue record's code as verified source. Check `sourceUrl`,
  `licenseClass` and `trustTier` first.
- Do not rewrite the exact source before the user copies it.
- Preserve behaviour and accessibility before appearance.
- Every animation needs a reduced-motion alternative.
- WCAG AA contrast is the floor.
- One primary CTA per page.
- When replacing a component, inventory its API and states first.
- If the request is ambiguous, ask the eight handoff questions.
- Take the feel from a reference, not the pixels. Never copy a reference 1:1.

## References

- `references/cli.md` — full command and exit-code reference.
- `references/handoff.md` — the 7-stage copy-then-adapt protocol.
- `references/guardrails.md` — design review checklist and anti-patterns.
