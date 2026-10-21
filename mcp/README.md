# My Ui design-system MCP server

A local stdio MCP server that turns the My Ui component library into an assistant you can use from Claude Desktop, Claude Code, Cursor, VS Code or any other MCP client.

> **Setup lives in the [root README](../README.md).** It covers the quick start, the IDE installer (`npm run setup -- --ide all`), the 7-stage handoff process, the full tool/prompt/resource reference and troubleshooting. This file is the deep-dive: what gets indexed, how the AST parsing works and how to develop the server.

It indexes two layers:

1. **Verified local components** — the typed source in `src/components/**/*.tsx`, parsed with the TypeScript AST. These are the components the assistant should reach for first.
2. **The full marketplace catalogue** — all 8,157 records in `src/data/components.json`, including their `componentCode` and `demoCode`, author, licence, stats, tags and categories. These are exposed with `origin: "catalogue"` and clear caveats because the implementation source is often a representative reconstruction rather than the original upstream file.

The semantic tokens in `src/app/globals.css` remain the single design-token source. Tool results mark every component with its origin so a client can tell verified local source from catalogue source.

## What it exposes

### Tools

| Tool | Arguments | What it does |
| --- | --- | --- |
| `list_components` | `category?`, `query?`, `kind?`, `limit?` | Lists verified local components and catalogue records with import paths, category, origin, author, props count, variants and usage references. Results are summaries only; call `get_component_bundle` for copy-ready source. |
| `get_component_bundle` | `components?`, `requirements?`, `project_context?` | Returns the exact source for one or more components, a suggested copy path, npm/internal dependencies, install steps, adaptation rules, replacement guidance and feedback questions. Use it before writing or editing code. |
| `get_component_details` | `component_name` | Returns metadata, parsed props, CVA variants, dependencies, real usage examples, guidelines, related components, exact source, a copy target and install instructions. Accepts a local name, a catalogue `author/slug` pair or a catalogue record id. |
| `suggest_combination` | `use_case`, `surface_type?`, `constraints?` | Produces a subject-driven palette, type pairing, alignment concept, ASCII wireframe, component selection (local first, catalogue fallback), review notes, gaps, a TSX scaffold and the exact source of every selected component. |
| `get_design_tokens` | `token_type?` | Returns colours, typography, spacing, radius, shadows or animations, with CSS variables, guidance and contrast pairs. |
| `validate_ui_composition` | `code_snippet`, `file_name?` | Checks accessibility, tokens, specificity, typography, motion, copy, generic defaults and proof patterns. |

### Prompts

`design_layout_guide` — a Plan → Review → Build → Critique guide that uses the verified local inventory, the catalogue summary and the tokens. It accepts `use_case?`, `surface_type?` and `constraints?`, and returns a tailored starter direction when a use case is supplied.

`component_handoff` — the source-first workflow. It asks for requirements and component names, returns the exact local source and install steps, then collects feedback and adapts the component to the user's design system or replaces an existing one. It accepts `requirements?`, `components?` and `project_context?`.

### Resources

| URI | Contents |
| --- | --- |
| `myui://components` | Compact index of all 8,214 components: id, name, slug, origin, author, category, import path and prop count. |
| `myui://design-tokens` | Full parsed token model as JSON. |
| `myui://design-principles` | Design philosophy, anti-patterns and checklist as Markdown. |
| `myui://handoff` | The ask → select → copy → install → feedback → adapt protocol, including replacement and style-decision rules. |
| `myui://inventory` | Human-readable verified local inventory plus a catalogue category summary. |
| `myui://components/{slug}` | One verified local component with props, variants, examples, guidelines and source code. |
| `myui://catalogue/{author}/{slug}` | One marketplace catalogue record with author, licence, stats, demo example and local component source. |

The local component template lists all 57 verified component resources, so clients that only surface `resources/list` can still discover them. The catalogue template is unlisted and uses completion for `author` and `slug`; because the index resource is intentionally compact, it stays under the SDK's 10 MB stdio frame limit. Use `get_component_bundle` for copy-ready source and `get_component_details` for one record's full metadata.

## Source-first handoff workflow

The server is designed for a copy-then-adapt loop, not for describing components from memory:

1. **Ask** for the requirements, the components or roles, the target stack, the existing tokens/design system, and whether the user is replacing a component.
2. **Select** from the verified local index first; use the catalogue only when a local component does not cover the role.
3. **Hand off the exact source** with `get_component_bundle` or `suggest_combination`. Every selected component includes its code, a suggested copy path, dependencies and installation steps. The server never treats a summary as the handoff artefact.
4. **Install** by copying the source into the user's project, resolving imports and running typecheck/build.
5. **Collect feedback**: errors, screenshots or rendered DOM, token changes and the component being replaced.
6. **Adapt** in this order: props/variants, wrapper classes, token aliases, then the component source. Preserve behaviour and accessibility first. For editor or canvas replacements, check selection, drag handles, shortcuts and undo/redo before restyling.
7. **Validate** the final usage with `validate_ui_composition` and report what changed.

`myui://handoff` contains the same protocol for clients that expose resources but not prompts.

## Quick start

```bash
npm install
npm run smoke   # spawn the server, call every tool/prompt/resource, assert the results
npm run mcp     # run the stdio server directly (it waits for JSON-RPC on stdin)
```

`npm run mcp` should appear to hang; that is correct. stdout is reserved for JSON-RPC, and all diagnostics go to stderr.

To register the server with an IDE, use the installer from the repository root:

```bash
npm run setup -- --ide opencode
npm run setup -- --ide all
```

## Client configuration

Every IDE launches the same entry point:

```bash
node /absolute/path/to/my-ui-mcp/mcp/run.mjs
```

`mcp/run.mjs` resolves the repository from its own file location, spawns the local `tsx` and sets the child working directory itself. It therefore works no matter what working directory the client uses, and it prints a clear `npm install` hint when dependencies are missing.

The [`examples/`](../examples) directory holds ready-to-paste snippets for each client below.

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows, or `~/.config/Claude/claude_desktop_config.json` on Linux:

```json
{
  "mcpServers": {
    "myui-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/my-ui-mcp/mcp/run.mjs"]
    }
  }
}
```

Restart Claude Desktop. The tools, prompts and resources should appear in the MCP connector.

### Claude Code

```bash
claude mcp add myui-mcp --scope user -- node /absolute/path/to/my-ui-mcp/mcp/run.mjs
```

For a project-scoped config, add the same `command` and `args` to `.mcp.json`. This repository ships one that uses a relative path, so it only applies when the working project is this repository; in your own projects use the absolute path above.

### OpenCode

This repository includes a project-scoped [`opencode.json`](../opencode.json). For availability in every OpenCode project, register it once in the global config:

```bash
opencode mcp add myui-mcp --global -- node /absolute/path/to/my-ui-mcp/mcp/run.mjs
```

That writes `mcp.servers.myui-mcp` to `~/.config/opencode/opencode.json`. The server resolves the repository from its own file path, so the global entry needs no `cwd`. Verify it from another project with `opencode mcp list`, then `opencode reload`. If it reports no servers outside this repository, confirm the command was added with `--global` and that the current directory is an OpenCode project.

OpenCode exposes the tools as `myui_list_components`, `myui_get_component_bundle`, `myui_get_component_details`, `myui_suggest_combination`, `myui_get_design_tokens` and `myui_validate_ui_composition`, or under `tools.myui.*` in Code Mode. The prompts become `/myui:design_layout_guide` and `/myui:component_handoff`; resources are available through OpenCode's `list_mcp_resources` and `read_mcp_resource` tools.

### Cursor

Global `~/.cursor/mcp.json` or project `.cursor/mcp.json` — see [`examples/cursor.mcp.json`](../examples/cursor.mcp.json).

### VS Code

Project `<project>/.vscode/mcp.json`, or the user-level `mcp.json` — see [`examples/vscode.mcp.json`](../examples/vscode.mcp.json).

### Windsurf and Zed

Windsurf uses `~/.codeium/windsurf/mcp_config.json` under `mcpServers`. Zed uses `~/.config/zed/settings.json` under `context_servers` — see [`examples/zed-settings.json`](../examples/zed-settings.json).

### Generic stdio client

```json
{
  "command": "node",
  "args": ["/absolute/path/to/my-ui-mcp/mcp/run.mjs"]
}
```

## What gets indexed

- `src/components/**/*.tsx` — **57 exports from 35 source files** at the time of writing.
- Component folders: `ui`, `landing`, `marketplace`, `layout`, `detail`, `auth`, `profile`, `themes`, `pricing`, `authors`, `icons` and root providers.
- The TypeScript AST extracts exports, props, defaults, CVA variants, npm/internal dependencies, tags and real JSX usage examples from app code.
- `src/data/components.json` — **all 8,157 marketplace records** with `componentCode`, `demoCode`, author, licence, stats, previews, tags, categories and dependencies.
- Every catalogue record is parsed with the same TypeScript AST to recover its exported component, props, defaults and CVA variants. The record is marked `origin: "catalogue"` and keeps its `author/slug` identity, registry route, install command and source caveat.
- `src/app/globals.css` supplies semantic colours, font families, radius and animation tokens. Typography, spacing and shadow scales are curated alongside the parsed CSS.

Local components are listed first and score higher in free-text search, so a query such as `Button` returns the verified local primitive before the catalogue alternatives. Suggestion planning also prefers local components and falls back to catalogue records only when no local component covers the role. `get_component_details` accepts `author/slug` (for example `kanchanasw/sketch-button`) and catalogue record ids to disambiguate duplicate names.

## Design rules enforced by the server

The tools, prompt and validator all assume the same philosophy:

- The subject decides the composition, not a template.
- No centered gradient hero with three equal feature cards.
- No italic or coloured word inside a headline.
- No all-caps eyebrow on every section.
- Structure must encode grouping, sequence or state.
- Motion is one orchestrated sequence or one real state change, with a reduced-motion path.
- Copy is plain, active and action-specific; no fabricated logos, testimonials, metrics, prices or integrations.
- Semantic tokens, accessible markup and controlled CSS specificity.

`validate_ui_composition` checks for missing alt text, unlabeled inputs, icon-only buttons, clickable divs, heading skips, multiple h1s, raw hex, default palette utilities, inline visual styles, `!important`, conflicting utilities, uppercase label noise, headline accents, eyebrow overuse, repeated card blocks, glassmorphism, gradient text, unreduced motion, uniform hover lift, generic CTAs and unverified proof patterns.

## Known inventory gaps

The suggestion engine reports these local gaps rather than pretending they exist. The marketplace catalogue may contain a matching record; search with `list_components` and verify its licence and implementation before using it:

- No generic chart or data-table primitive. `ResultsGrid` is a component-result grid, not a financial ledger table.
- No dedicated KPI/stat primitive.
- No FAQ/accordion section.
- No progress/stepper primitive.
- No settings-section or sticky save-bar primitive.
- No app, docs or settings rail primitive; `AppHeader` is the closest chrome, so compose a short navigation list.
- No compact mobile header; `AppHeader` is the nearest fit.
- No editor canvas. `PreviewFrame` is a preview surface, not a canvas.
- No editor toolbar rail; compose it from `Button` and `Dropdown`.
- No generic project-card primitive. `ComponentCard` is catalogue-specific.
- No bottom-sheet navigation primitive. `Sheet` can be used carefully.

When a gap matters, compose primitives and add the missing component to `src/components`, then restart the server.

## Development

```bash
npm run typecheck   # tsc --noEmit over mcp/**/*.ts
npm run smoke       # end-to-end MCP client test against the real server
npm run setup -- --help   # the IDE installer
```

The smoke test spawns the actual server, lists tools, calls all six tools, gets both prompts, lists resources and templates, and reads the registry, handoff protocol and both detail resources. It pins the record counts, so update the assertions in the same change as any new component or catalogue data.

### Adding a component

1. Add or edit a `.tsx` file under `src/components/`.
2. Keep props typed and, where useful, use CVA for variants.
3. Use semantic token utilities.
4. Restart the MCP server. The index is built in memory at startup; there is no generated cache to refresh.

### Adding a token

1. Add the CSS variable and Tailwind mapping in `src/app/globals.css`.
2. Restart the server.
3. Verify with `get_design_tokens`.

### Troubleshooting

- **No tools in the client:** use an absolute path to `node_modules/.bin/tsx` and to `mcp/server.ts`; clients often have a different working directory.
- **Server exits immediately:** run `npm run mcp` in a terminal and read stderr. Do not add `console.log` to server code; stdout must remain valid JSON-RPC.
- **Stale components:** restart the client/server. The index is built at startup. `src/data/components.json` is read at startup too, so restart after the catalogue pipeline changes.
- **The registry resource looks compact:** that is deliberate. `myui://components` carries one summary row per record so it stays under the MCP stdio frame limit; use `get_component_bundle`, `get_component_details` or `myui://catalogue/{author}/{slug}` for full source.
- **Install commands point at the deployed registry:** catalogue install commands use `NEXT_PUBLIC_SITE_URL` (falling back to the canonical deployment). Set it in the MCP server environment if you host the registry elsewhere.
- **Validation seems strict:** that is intentional. Every finding includes a line number, evidence and a specific fix. Some checks are warnings because context matters, especially palette utilities, gradients and proof claims.
