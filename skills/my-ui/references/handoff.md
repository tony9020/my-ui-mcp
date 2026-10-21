# My Ui component handoff protocol

Use this protocol whenever a user asks for a My Ui component, a page built from
My Ui components, or a replacement for an existing component. The goal is a
**copy-then-adapt loop**: the user receives exact source, copies it, and reports
back. The agent never describes a component from memory and never hands over a
paraphrase.

## 1. Ask for the brief

Do not select components or write code until you have the requirements. Ask
these questions in one compact block:

1. What are you building, for whom, and what is the one job the surface must complete?
2. Which components or roles do you need? Name them if you know them, or describe the slots: navigation, form, table, dialog, empty state, editor toolbar, and so on.
3. What is the target stack, framework, import alias and component folder?
4. What design system, tokens, typography and strategy already exist in the project?
5. Are you replacing an existing component? If so, share its public props, variants, states, behaviour and the file or code you are replacing.
6. What must stay identical: API, analytics, form integration, keyboard behaviour, copy or tests?
7. What constraints apply: licence, dependencies, accessibility, responsive breakpoints, bundle size or browser support?
8. What feedback can you provide after copying the component: typecheck errors, build errors, a screenshot, rendered DOM, token diff or a short review?

If the user already supplied the answers, restate the brief in one short block
and continue. Do not re-ask what is already known.

## 2. Select from the local index

Use `list_components` (MCP) or `myui search` (CLI). Prefer verified local
components. Use `author/slug` to target a specific catalogue record.

Never invent a component, prop, variant or token. If nothing covers the role,
say so and propose the closest primitive plus a composition, not a fictional
component.

## 3. Share the exact source

Use `get_component_bundle` (MCP) with the chosen component names, or
`suggest_combination` for a planned page. The CLI can locate the file and
import path with `myui search <name> --json`, but the MCP bundle is the
preferred source handoff.

For every selected component, the handoff must include:

- the **exact source** — never paraphrased, regenerated or truncated;
- a **suggested copy target** (for example `src/components/ui/button.tsx`);
- the **import path**;
- **npm and internal dependencies**;
- **licence** and trust tier, and the registry install command for catalogue
  records;
- parsed **props** with types, defaults and required flags;
- **tokens used**, plus usage, accessibility and anti-pattern notes.

Components that share one source file are de-duplicated: print the file once
and reference it from the rest.

## 4. Install in the user's project

Tell the user to copy each source block into the suggested path, install the
listed dependencies, resolve internal imports (`@/lib/utils` etc.), and run
typecheck/build. Ask them to report the exact errors.

Install steps are generated per bundle, for example
`npm install lucide-react zustand`. React itself is assumed to exist in the
target.

## 5. Collect feedback and adapt

Ask for typecheck/build output, screenshots or rendered DOM, token changes and
the component being replaced. Map colours, type, spacing and radius by semantic
role. Keep behaviour, accessibility and analytics stable.

Adapt in this order:

1. component prop or variant;
2. composition wrapper `className`;
3. token alias;
4. component source edit.

## 6. Replace an existing component

Inventory the old component's API, states and behaviour first. Write an
old-to-new API map before editing. Preserve behaviour first, then restyle.

Verify default, hover, focus, active, disabled, loading, error and empty states.
If the new component cannot express an old state, compose primitives or add a
documented variant. Do not silently drop the state.

## 7. Validate

Run `validate_ui_composition` (MCP) or `myui audit <file>` (CLI) on the final
usage. Report:

- what changed;
- what stayed the same;
- what still needs a decision.

Do not claim the result is accessible because the validator passed. The
validator is static analysis; keyboard, screen-reader and runtime behaviour
still need a real test.
