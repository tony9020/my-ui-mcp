# My Ui MCP

A local **stdio MCP server** that turns the My Ui design system into an assistant
you can drive from any MCP-capable IDE — OpenCode, Claude Code, Claude Desktop,
Cursor, VS Code, Windsurf or Zed.

It ships **three layers** and one **copy-first workflow**:

| Layer | What it is |
| --- | --- |
| **Verified local components** | 57 exports across 35 `.tsx` files, parsed with the TypeScript AST. Always ranked first. |
| **Marketplace catalogue** | All 8,157 records in `src/data/components.json`, including `componentCode`, `demoCode`, author, licence, stats and tags. Marked `origin: "catalogue"` with a source caveat. |
| **Design tokens** | Parsed live from `src/app/globals.css` — colour, typography, spacing, radius, shadow and motion with WCAG contrast pairs. |

**8,214 components total, 6 tools, 2 prompts, 5 static resources + 2 resource
templates.**

---

## Table of contents

- [Quick start](#quick-start)
- [IDE setup](#ide-setup)
- [The process: 7 stages](#the-process-7-stages)
- [Design guide: Plan → Review → Build → Critique](#design-guide-plan--review--build--critique)
- [Tools](#tools)
- [Prompts](#prompts)
- [Resources](#resources)
- [Design guardrails](#design-guardrails)
- [Catalogue caveats](#catalogue-caveats)
- [Repository layout](#repository-layout)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Quick start

```bash
git clone https://github.com/tony9020/my-ui-mcp.git
cd my-ui-mcp
npm install
npm run smoke        # spawns the real server and verifies everything
npm run setup -- --ide all
```

Expected smoke output:

```
PASS tools=6 components=8214 catalogue=8157 suggestions=5sections sources=8 bundle=2 prompt=15713chars handoff=18879chars resources=62
```

Then reload your IDE and ask the agent something like:

> Use the myui MCP. I need a settings form for a small team — ask me for the
> brief first, then hand me the source.

The agent should **ask you questions before it writes anything**, then return
exact source blocks for you to copy into your project.

---

## IDE setup

### Option A — the installer (recommended)

```bash
npm run setup -- --ide opencode          # one IDE
npm run setup -- --ide all               # every IDE detected on this machine
npm run setup -- --ide cursor --project --dir ~/code/my-app
npm run setup -- --ide vscode --dry-run  # preview, change nothing
npm run setup -- --list                  # supported IDEs + scopes
```

| Flag | Effect |
| --- | --- |
| `--ide <ids>` | Comma-separated list, or `all`. |
| `--scope global` | Write to the IDE's user config (default — makes it work in **every** project). |
| `--scope project` | Write to a specific project. Use `--dir` to choose it. |
| `--name <name>` | Server name to register (default `myui-mcp`). |
| `--dry-run` | Print the merged config, write nothing. |

The installer is Node built-ins only, so it runs before anything else is
installed. It is deliberately conservative:

- **Backs up** any file it overwrites (`<file>.bak.<timestamp>`).
- **Merges** into existing config — it never drops keys you already have.
- **Refuses to rewrite** a file it cannot parse (JSONC comments, trailing
  commas, corruption) and prints the block for you to paste instead.
- `--ide all` only touches IDEs that are **actually detected**, so it will not
  litter your home directory with config files nobody reads.

### Option B — manual

Every IDE launches the same entry point:

```bash
node /ABSOLUTE/PATH/TO/my-ui-mcp/mcp/run.mjs
```

`mcp/run.mjs` resolves the repository from **its own file location** and sets the
child working directory itself, so the IDE's working directory never matters.
It also prints a clear `npm install` hint if dependencies are missing, and keeps
stdout reserved for JSON-RPC (all diagnostics go to stderr).

Copy the matching file from [`examples/`](./examples) and replace
`/ABSOLUTE/PATH/TO/my-ui-mcp`:

| IDE | File to edit | Key | Example |
| --- | --- | --- | --- |
| OpenCode | `~/.config/opencode/opencode.json` | `mcp.servers` | [`examples/opencode.json`](./examples/opencode.json) |
| Claude Code | `~/.claude.json` or `<project>/.mcp.json` | `mcpServers` | [`examples/claude-code.mcp.json`](./examples/claude-code.mcp.json) |
| Claude Desktop | `claude_desktop_config.json` | `mcpServers` | [`examples/claude-desktop.json`](./examples/claude-desktop.json) |
| Cursor | `~/.cursor/mcp.json` or `<project>/.cursor/mcp.json` | `mcpServers` | [`examples/cursor.mcp.json`](./examples/cursor.mcp.json) |
| VS Code | `<project>/.vscode/mcp.json` or user `mcp.json` | `servers` | [`examples/vscode.mcp.json`](./examples/vscode.mcp.json) |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` | `mcpServers` | — |
| Zed | `~/.config/zed/settings.json` | `context_servers` | [`examples/zed-settings.json`](./examples/zed-settings.json) |

### OpenCode specifics

- Tools appear as `myui_list_components`, `myui_get_component_bundle`, … or
  under `tools.myui.*` in Code Mode.
- Prompts appear as `/myui:design_layout_guide` and `/myui:component_handoff`.
- The server appears as `myui` in `opencode mcp list` when it connects cleanly.
- **A project config with the same name overrides the global one.** Both start
  this same server.
- This repository ships its own [`opencode.json`](./opencode.json) and
  [`.mcp.json`](./.mcp.json) for working *inside* this repo. For your own
  projects, use `--scope global`.

---

## The process: 7 stages

The server is not a search box. It enforces a **copy-then-adapt loop** so the
agent never describes a component from memory and never hands you a paraphrase.

> Full text: `myui://handoff` resource, or `/myui:component_handoff`.

### Stage 1 — Ask for the brief

No component selection, no code. The assistant asks, in one compact block:

1. What are you building, for whom, and what is the one job the surface must do?
2. Which components or roles do you need? (name them, or describe slots like
   navigation, form, table, dialog, empty state, editor toolbar)
3. What is the target stack, framework, import alias and component folder?
4. What design system, tokens, typography and strategy already exist?
5. Are you replacing an existing component? If so, share its props, variants,
   states, behaviour and source.
6. What must stay identical: API, analytics, form integration, keyboard
   behaviour, copy or tests?
7. What constraints apply: licence, dependencies, accessibility, responsive
   breakpoints, bundle size, browser support?
8. What feedback can you return after copying: typecheck errors, build errors,
   screenshot, rendered DOM, token diff, review?

### Stage 2 — Select from the local index

`list_components` searches **verified local components first** and falls back to
the marketplace catalogue only when a local component does not cover the role.
Never invents a component, prop, variant or token.

Use `author/slug` (e.g. `kanchanasw/sketch-button`) to target a specific
catalogue record.

### Stage 3 — Share the exact source

`get_component_bundle` (or `suggest_combination`) returns, for every selected
component:

- the **exact source** — never paraphrased, regenerated or truncated
- a **suggested copy target** (e.g. `src/components/ui/button.tsx`)
- **import path**, npm and internal dependencies
- **licence** and registry install command for catalogue records
- parsed **props** with types, defaults and required flags
- **tokens used**, plus usage, accessibility and anti-pattern notes

Components that share one source file are de-duplicated — the file is printed
once and referenced by the rest.

### Stage 4 — Install in the user's project

You copy each block into the suggested path, install the listed dependencies,
resolve internal imports (`@/lib/utils` etc.), then run typecheck/build.

Install steps are generated per bundle, e.g. `npm install lucide-react zustand`.
React itself is assumed to exist in the target.

### Stage 5 — Collect feedback and adapt

Return the exact errors, a screenshot or rendered DOM, the token changes you
made, and what felt wrong. Then adapt **in this order**:

1. Keep behaviour, accessibility and analytics stable.
2. Map existing colours, type, spacing and radius to semantic roles.
3. Use component props or variants before adding wrapper classes.
4. Edit component source only when the API cannot express the need.
5. Validate the final composition and report the diff.

### Stage 6 — Replace an existing component

For a replacement, inventory **before** editing:

- old public props, variants, defaults, DOM semantics, analytics hooks, form
  integration and tests
- every visual and behavioural state: default, hover, focus, active, disabled,
  loading, error, empty, selected, dark mode
- an old-to-new API map marking vanished props, changed meanings and behaviour
  that must be preserved

Keep behaviour and accessibility stable in pass one; change appearance in pass
two. If a state has no equivalent, compose primitives or add a documented
variant — never silently drop it.

**Editor and canvas surfaces** additionally get: preserve selection state, drag
handles, keyboard shortcuts, undo/redo affordances, focus rings and compact
toolbar density. Test pointer *and* keyboard interaction, selection and
multi-select.

### Stage 7 — Validate

Run `validate_ui_composition` on the final usage and report what changed, what
stayed the same and what still needs a decision.

---

## Design guide: Plan → Review → Build → Critique

The `design_layout_guide` prompt is the separate, page-level reasoning scaffold:

### 1. Plan

Establish the subject, audience and primary job; reject default visual clichés;
choose a surface type and a component combination; produce a 4–6 hex palette
with role and use per token, a typography pairing, an alignment concept and an
ASCII wireframe.

### 2. Review the plan before building

Check the inventory: which verified local components are used, which gaps must
be solved with primitives or a new component, and any catalogue record's author
and licence. Then call `get_component_bundle` for the selected names — the
handoff is a copy step, not a description step.

### 3. Build

Write accessible TypeScript/React using the local components, semantic tokens
and the established import paths. Copy each component's exact source before
adapting it.

### 4. Critique the result

Run the review checklist and anti-pattern list against the built output.
Replace every placeholder with a real value or a visibly labelled placeholder;
never invent proof.

Output contract: `use_case?`, `surface_type?` (landing, dashboard, auth,
pricing, settings, docs, …) and `constraints?`.

---

## Tools

| Tool | Arguments | What it does |
| --- | --- | --- |
| `list_components` | `category?`, `query?`, `kind?`, `limit?` | Pages through verified local components and catalogue records with import path, category, origin, author, prop count, variants and usage references. `kind: "catalogue"` returns the 8,157 marketplace records. **Summaries only** — call `get_component_bundle` for copy-ready source. |
| `get_component_bundle` | `components?`, `requirements?`, `project_context?` | The workhorse. Accepts component names **or** a requirements brief (it derives a shortlist from the brief when no names are given). Returns exact source, copy target, dependencies, install steps, adaptation rules, replacement guidance and feedback questions. |
| `get_component_details` | `component_name` | Full detail for one record: metadata, parsed props, CVA variants, dependencies, real usage examples, guidelines, related components, exact source, copy target and install instructions. Accepts a local name, a catalogue `author/slug`, or a catalogue record id. |
| `suggest_combination` | `use_case`, `surface_type?`, `constraints?` | Subject-driven design direction: palette, type pairing, alignment, ASCII wireframe, component selection (local first), review notes, gaps, TSX scaffold **and the exact source of every selected component**. |
| `get_design_tokens` | `token_type?` | Colours, typography, spacing, radius, shadows or animations with CSS variables, guidance and contrast pairs. |
| `validate_ui_composition` | `code_snippet`, `file_name?` | Accessibility, tokens, specificity, typography, motion, copy, generic defaults and proof patterns. |

---

## Prompts

| Prompt | Arguments | Purpose |
| --- | --- | --- |
| `/myui:component_handoff` | `requirements?`, `components?`, `project_context?` | The copy-first workflow: ask for the brief, hand off exact source with install steps, then collect feedback and adapt or replace. With no arguments it returns the protocol + the eight questions + the local inventory. |
| `/myui:design_layout_guide` | `use_case?`, `surface_type?`, `constraints?` | Plan → Review → Build → Critique for a whole page. |

---

## Resources

| URI | Contents |
| --- | --- |
| `myui://components` | Compact index of all 8,214 components: id, name, slug, origin, author, category, import path, prop count. |
| `myui://design-tokens` | Full parsed token model as JSON. |
| `myui://design-principles` | Design philosophy, anti-patterns and checklist as Markdown. |
| `myui://handoff` | The 7-stage protocol, including replacement and style-decision rules. |
| `myui://inventory` | Human-readable verified local inventory + catalogue category summary. |
| `myui://components/{slug}` | One verified local component: props, variants, examples, guidelines, source. |
| `myui://catalogue/{author}/{slug}` | One marketplace record: author, licence, stats, demo example, component source. |

The local template lists all 57 components, so clients that only surface
`resources/list` can still discover them. The catalogue template is unlisted
and uses completion for `author` and `slug`.

> **Why `myui://components` is compact:** the MCP stdio frame limit is 10 MB.
> The index carries one summary row per record; use `get_component_bundle`,
> `get_component_details` or `myui://catalogue/{author}/{slug}` for full source.

---

## Design guardrails

Always-on rules the server states in its instructions and enforces in every
tool result:

- **Subject-driven design.** Ground choices in the industry, audience and job.
  A treasury tool should feel like a ledger, not a generic SaaS dashboard.
- **No generic SaaS defaults** unless explicitly requested: warm cream + dark
  acid accent, near-black + neon green, glassmorphism, centred three-card
  feature grids.
- **Typography.** At most two display/body families plus one mono. Never
  italicise or colour a single word inside a headline. No indiscriminate
  all-caps labels, no floating decorative eyebrows.
- **One primary CTA per page**, action-specific copy.
- **Sparse motion** — every animation needs a reduced-motion alternative.
- **WCAG AA contrast** in every palette and validation report.
- **No fabricated proof** — no invented logos, testimonials, metrics, prices or
  integrations. Use a real number, a visibly labelled placeholder, or change the
  structure.
- **Never invent** components, props, token names or variant values.
- **Accessibility and behaviour before appearance** when adapting.
- **Never copy pixels, text or layouts 1:1 from a reference** — take the feel
  (density, hierarchy, contrast), take creative liberties.

---

## Catalogue caveats

The 8,157 marketplace records are indexed from `src/data/components.json`. Their
`componentCode` and `demoCode` are **often a representative reconstruction
rather than the original upstream file**.

Every catalogue result therefore carries:

- `origin: "catalogue"` alongside the local results
- author, licence, registry, preview URL and stats
- a `sourceNote` caveat and the registry install command
- the instruction to **verify the licence and the real implementation before
  production use**

Local components are always ranked first in search and suggestion planning.
Catalogue source is a fallback with an explicit warning attached.

---

## Repository layout

```
my-ui-mcp/
├── mcp/
│   ├── run.mjs              # portable entry point every IDE points at
│   ├── server.ts            # tool / prompt / resource registration + stdio
│   ├── smoke-test.mjs       # end-to-end client test against the real server
│   ├── README.md            # deep-dive: internals, catalogue, tokens, dev
│   └── lib/
│       ├── component-index.ts   # AST parsing, 8,214-record index, ranking
│       ├── handoff.ts           # 7-stage workflow + copy-ready bundles
│       ├── prompt.ts            # both prompts
│       ├── suggest.ts           # combination planner
│       ├── suggest-recipes.ts   # per-surface section recipes
│       ├── suggest-industries.ts
│       ├── validate.ts          # composition review
│       ├── css-tokens.ts        # globals.css parser + contrast
│       ├── design-principles.ts # the guardrails
│       ├── paths.ts             # repo-relative path resolution
│       └── types.ts
├── scripts/setup.mjs        # IDE installer
├── examples/                # copy-paste config per IDE
├── src/
│   ├── components/**/*.tsx  # 57 verified local exports across 35 files
│   ├── data/components.json # 8,157 catalogue records (~27 MB, diff-suppressed)
│   ├── data/taxonomy.ts     # category tree
│   ├── hooks/, lib/         # internal utilities the components import
│   └── app/globals.css      # semantic token source
├── .mcp.json                # Claude Code, this repo
├── opencode.json            # OpenCode, this repo
└── .github/workflows/ci.yml # typecheck + smoke + installer dry-run
```

---

## Development

```bash
npm run typecheck     # tsc --noEmit over mcp/**
npm run smoke         # spawns the real server, exercises all 6 tools
npm run mcp           # run the server on stdio by hand (stderr for logs)
npm run setup -- --help
```

The smoke test is the contract. It asserts:

- exactly 6 tools registered
- 8,214 components indexed, 8,157 of them catalogue records
- `list_components` paging + free-text search
- `get_component_bundle` returning source for explicit names **and** deriving
  a shortlist from a bare requirements brief
- `suggest_combination` including full source blocks
- both prompts, all static resources, both resource templates
- a real catalogue record's licence and source

### Adding a component

1. Add or edit a `.tsx` file under `src/components/`.
2. Keep props typed; use CVA for variants where it helps.
3. Use semantic token utilities from `src/app/globals.css`.
4. Restart the MCP server — the index is built in memory at startup. There is no
   generated cache to refresh.

### Adding a token

1. Add the CSS variable and Tailwind mapping in `src/app/globals.css`.
2. Restart the server.
3. Verify with `get_design_tokens`.

### Updating the catalogue

Replace `src/data/components.json`, then restart the server and re-run
`npm run smoke` — the smoke test pins the record count, so update that
assertion alongside the data.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| No tools in the client | Use an absolute path to `mcp/run.mjs`. Clients often have a different working directory. Re-run `npm run setup -- --ide <your-ide>` to regenerate it. |
| Server exits immediately | Run `npm run mcp` in a terminal and read stderr. Never add `console.log` to server code — stdout must remain valid JSON-RPC. |
| `Missing dependency` from `run.mjs` | `npm install` in this repo, then restart the client. |
| Stale components | Restart the client/server. The index is built at startup. |
| Prompt or tool not visible after an update | `opencode reload`, or restart the IDE. MCP servers are spawned at session start. |
| `myui://components` looks compact | Deliberate — see [Resources](#resources). |
| Toggle not visible in another project | OpenCode loads global MCP config inside projects but not in bare directories. Run from inside a git project, or add a project config. |
| Catalogue record missing a prop the demo shows | The record's source is a reconstruction. Verify against the upstream author before relying on it. |

---

## License

MIT — see [LICENSE](./LICENSE).
