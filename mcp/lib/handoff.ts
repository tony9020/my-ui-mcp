import { componentHandoff, findComponents } from "./component-index";
import { suggestCombination } from "./suggest";
import type { ComponentIndex, ComponentInfo, HandoffBundle } from "./types";

function hasAnimation(code: string): boolean {
  return /\banimate-\S+|\btransition-\S+|\bduration-\d+|@keyframes\b/.test(code);
}
function hasReducedMotion(code: string): boolean {
  return /motion-reduce:|prefers-reduced-motion|useReducedMotion/i.test(code);
}

export interface HandoffInput {
  components?: string[];
  requirements?: string;
  project_context?: string;
  license_policy?: "permissive-only" | "allow-weak-copyleft" | "any";
  include_duplicates?: boolean;
}

export const HANDOFF_REQUIREMENTS_QUESTIONS = [
  "What are you building, for whom, and what is the one job the surface must complete?",
  "Which components or roles do you need? Name them if you know them, or describe the slots: navigation, form, table, dialog, empty state, editor toolbar, and so on.",
  "What is the target stack, framework, import alias and component folder?",
  "What design system, tokens, typography and strategy already exist in the project?",
  "Are you replacing an existing component? If so, share its public props, variants, states, behaviour and the file or code you are replacing.",
  "What must stay identical: API, analytics, form integration, keyboard behaviour, copy or tests?",
  "What constraints apply: licence, dependencies, accessibility, responsive breakpoints, bundle size or browser support?",
  "What feedback can you provide after copying the component: typecheck errors, build errors, a screenshot, rendered DOM, token diff or a short review?",
];

const WORKFLOW = [
  "Ask for requirements and component names before selecting anything. If the user supplied them, restate the brief in one short block and continue.",
  "Select only components that exist in the local My Ui index. Use explicit names when supplied; otherwise derive a shortlist from the requirements. Never invent a component, prop, variant or token.",
  "Share the exact source for every selected component. Do not paraphrase, regenerate, truncate or replace it with a summary. The source block is the handoff artefact.",
  "Tell the user where to copy each file, which npm and internal dependencies it needs, and to run typecheck/build after copying.",
  "Wait for the user's installation result, then collect feedback: errors, screenshots, rendered states, token changes and the component being replaced.",
  "Adapt in this order: props and variants, then wrapper classes, then token aliases, then the component source. Preserve behaviour and accessibility before changing appearance.",
  "For a replacement, inventory the old component's API, states and behaviour first. Write a migration map before editing, then verify default, hover, focus, active, disabled, loading, error and empty states.",
  "Run validate_ui_composition on the final usage and report what changed, what stayed the same and what still needs a decision.",
];

const STYLE_DECISIONS = [
  "Use semantic tokens by role, not raw hex: background, foreground, muted-foreground, border, brand and primary-foreground. Map an existing palette by role before changing any value.",
  "Keep the component's public API stable unless the user explicitly asks for an API change. Prefer an existing variant or prop before editing internals.",
  "Make style changes in this order: component prop or variant > composition wrapper className > token alias > component source edit.",
  "Preserve focus-visible styles, disabled and error states, reduced motion, labels, keyboard order and contrast. A visual change must not remove a state.",
  "Do not add raw hex, inline colour or spacing overrides, `!important` or conflicting utilities. Extend the token layer when a real new role is needed.",
  "Keep one primary action per view and action-specific copy. Do not add invented logos, testimonials, metrics or prices while restyling.",
  "If the target design system disagrees with My Ui, keep the target's tokens and map My Ui roles into them. Do not import a second visual language.",
  "For editor and canvas surfaces, preserve selection state, drag handles, keyboard shortcuts, undo/redo affordances, focus rings and compact toolbar density. Do not restyle a control until it disappears into the canvas.",
  "Use mono only for coordinates, code, IDs and dense metadata. Keep editor labels, tooltips and destructive actions legible and separate from high-frequency controls.",
  "Document every departure from the source: changed tokens, changed props, changed states and the reason.",
];

const REPLACEMENT = [
  "Read the existing component and record its public props, variants, defaults, DOM semantics, analytics hooks, form integration and tests.",
  "List every visual and behavioural state the old component supports: default, hover, focus, active, disabled, loading, error, empty, selected and dark mode.",
  "Write an old-to-new API map before editing. Mark props that disappear, props that change meaning and behaviour that must be preserved.",
  "Keep behaviour, accessibility and analytics stable in the first pass. Change only the appearance and composition boundary.",
  "If the new component cannot express an old state, compose primitives or add a documented variant. Do not silently drop the state.",
  "For editor replacements, test pointer and keyboard interaction, selection and multi-select, drag handles, undo/redo, shortcuts and disabled states.",
  "Run keyboard and visual checks on every state. Report the migration notes, removed props and any follow-up decision.",
];

function splitQueries(values: string[] | undefined): string[] {
  return [
    ...new Set(
      (values ?? [])
        .flatMap((value) => value.split(/[,\n;]/))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}

function dedupeById(components: ComponentInfo[]): ComponentInfo[] {
  const seen = new Set<string>();
  return components.filter((component) => {
    if (seen.has(component.id)) return false;
    seen.add(component.id);
    return true;
  });
}

function derivedComponents(
  index: ComponentIndex,
  requirements: string,
  projectContext: string | undefined,
  licensePolicy?: "permissive-only" | "allow-weak-copyleft" | "any",
  includeDuplicates?: boolean,
): ComponentInfo[] {
  const plan = suggestCombination(index, {
    use_case: requirements,
    constraints: projectContext,
    license_policy: licensePolicy,
    include_duplicates: includeDuplicates,
  });
  return dedupeById(
    plan.componentSources
      .map((source) => index.byId.get(source.id))
      .filter((component): component is ComponentInfo => Boolean(component)),
  );
}

export function buildHandoffBundle(
  index: ComponentIndex,
  input: HandoffInput,
): HandoffBundle {
  const requirements = input.requirements?.trim() || null;
  const projectContext = input.project_context?.trim() || null;
  const requestedComponents = splitQueries(input.components);
  const selected: ComponentInfo[] = [];
  const missingComponents: string[] = [];
  let selectionSource: HandoffBundle["brief"]["selectionSource"] = "empty";

  if (requestedComponents.length) {
    for (const query of requestedComponents) {
      const component = findComponents(index, query, {
        license_policy: input.license_policy ?? "permissive-only",
        include_duplicates: input.include_duplicates ?? false,
      })[0];
      if (component) selected.push(component);
      else missingComponents.push(query);
    }
    if (selected.length) selectionSource = "explicit";
  }

  if (!selected.length && requirements) {
    selected.push(...derivedComponents(index, requirements, projectContext ?? undefined, input.license_policy, input.include_duplicates));
    if (selected.length) selectionSource = "requirements";
  }

  const components = dedupeById(selected).map(componentHandoff);
  const needsReducedMotion = components.some((c) => hasAnimation(c.code) && !hasReducedMotion(c.code));
  const coreDependencies = new Set(["react", "react-dom", "next"]);
  const npmDependencies = [
    ...new Set(
      components
        .flatMap((component) => component.dependencies.npm)
        .filter((dependency) => !coreDependencies.has(dependency)),
    ),
  ].sort();
  const internalDependencies = [
    ...new Set(components.flatMap((component) => component.dependencies.internal)),
  ].sort();
  const commands = [
    ...(npmDependencies.length ? [`npm install ${npmDependencies.join(" ")}`] : []),
    ...new Set(
      components
        .map((component) => component.installCommand)
        .filter((command): command is string => Boolean(command)),
    ),
  ];

  return {
    brief: {
      requirements,
      projectContext,
      requestedComponents,
      resolvedComponents: components.map((component) => component.name),
      missingComponents,
      selectionSource,
    },
    workflow: WORKFLOW,
    components,
    install: {
      npmDependencies,
      internalDependencies,
      commands,
      steps: [
        "Read each exact source block below before copying. Do not regenerate it from memory or from the summaries.",
        ...(needsReducedMotion
          ? ["Reduced-motion gap detected: at least one selected component animates without a prefers-reduced-motion path. Apply the fix in the 'Reduced-motion adaptation' section before shipping."]
          : []),
        "Several selected components may share one source file. Copy each `sourceFile` once; it contains all of the exports listed under it.",
        "Copy each `code` block into `suggestedPath` in the target project. Preserve the export and component body; change only import aliases that do not exist in the target.",
        npmDependencies.length
          ? `Install the npm dependencies that are missing from the target project: ${npmDependencies.join(", ")}. The target must already provide React.`
          : "No extra npm dependencies were detected. Confirm the target already provides React and the component's local utilities.",
        internalDependencies.length
          ? `Resolve these internal imports in the target project, or copy the matching local utilities: ${internalDependencies.join(", ")}.`
          : "No internal imports were detected.",
        "Run the target project's typecheck and build. Report the exact errors instead of guessing a fix.",
        "Return a screenshot or the rendered DOM for default, focus, disabled, loading, error and empty states that apply.",
      ],
    },
    feedback: {
      questions: [
        "Which files did you copy, and what did typecheck/build report?",
        "Which props, variants or tokens did you change, and why?",
        "What does the component look like in default, focus, disabled, error and loading states?",
        "What existing component are you replacing, and what must stay identical?",
        "What still feels wrong in the target design system or strategy?",
      ],
      nextTool: "validate_ui_composition",
      adaptationOrder: [
        "Keep behaviour, accessibility and analytics stable.",
        "Map existing colours, type, spacing and radius to semantic roles.",
        "Use component props or variants before adding wrapper classes.",
        "Edit the component source only when the API cannot express the need.",
        "Validate the final composition and report the diff.",
      ],
    },
    styleDecisions: STYLE_DECISIONS,
    replacement: REPLACEMENT,
  };
}

export function compactHandoffMarkdown(bundle: HandoffBundle): string {
  const brief = bundle.brief;
  const lines: string[] = [
    "# My Ui component bundle (compact)",
    "",
    `- Requirements: ${brief.requirements || "(not supplied)"}`,
    `- Resolved: ${brief.resolvedComponents.join(", ") || "(none)"}`,
    ...(brief.missingComponents.length ? [`- Not found: ${brief.missingComponents.join(", ")}`] : []),
    "",
    "## Components",
    "",
  ];
  for (const c of bundle.components) {
    lines.push(`### ${c.name}`);
    lines.push(`- Origin: ${c.origin}`);
    lines.push(`- Copy to: \`${c.suggestedPath}\``);
    lines.push(`- Import: \`${c.importPath}\``);
    lines.push(`- Trust: ${c.trustTier ?? "unknown"} (${c.licenseClass ?? "unknown"})`);
    lines.push(`- npm: ${c.dependencies.npm.length ? c.dependencies.npm.join(", ") : "none"}`);
    lines.push(`- internal: ${c.dependencies.internal.length ? c.dependencies.internal.join(", ") : "none"}`);
    lines.push(`- Props: ${c.props.length}`);
    lines.push("");
  }
  lines.push("## Install");
  lines.push("");
  for (const step of bundle.install.steps) lines.push(`- ${step}`);
  lines.push("");
  lines.push("Use `include_source=true` (default) or `get_component_details` for full source.");
  return lines.join("\n");
}
export function handoffMarkdown(bundle: HandoffBundle): string {
  const brief = bundle.brief;
  const seenSources = new Set<string>();
  const componentBlocks = bundle.components.length
    ? bundle.components.flatMap((component) => {
        const sourceAlreadyIncluded = seenSources.has(component.sourceFile);
        seenSources.add(component.sourceFile);
        return [
          `### ${component.name}`,
          "",
          `- Origin: ${component.origin === "local" ? "verified local source" : `catalogue by @${component.author?.username ?? "unknown"}`}`,
          `- Copy to: \`${component.suggestedPath}\``,
          `- Source file: \`${component.sourceFile}\``,
          `- Import: \`${component.importPath}\``,
          `- Source available: ${component.sourceAvailable ? "yes" : "no — the catalogue record has no component source"}`,
          ...(component.license ? [`- Licence: ${component.license}`] : []),
          ...(component.installCommand ? [`- Registry install (optional): \`${component.installCommand}\``] : []),
          ...(component.sourceNote ? [`- Caveat: ${component.sourceNote}`] : []),
          `- npm: ${component.dependencies.npm.length ? component.dependencies.npm.join(", ") : "none detected"}`,
          `- internal: ${component.dependencies.internal.length ? component.dependencies.internal.join(", ") : "none detected"}`,
          "",
          sourceAlreadyIncluded
            ? `This component is exported from \`${component.sourceFile}\`, whose exact source is included above. Copy that file once.`
            : component.copyInstruction,
          "",
          ...(sourceAlreadyIncluded
            ? [
                `The exact source for this component is already included under \`${component.sourceFile}\` above. Copy that file once; it exports all of the components that share it.`,
                "",
              ]
            : ["```tsx", component.code, "```", ""]),
          ...(component.usageExamples.length
            ? ["**Usage example:**", "", "```tsx", component.usageExamples[0], "```", ""]
            : []),
          "**Props to preserve or map:**",
          "",
          ...(component.props.length
            ? component.props.map(
                (prop) =>
                  `- \`${prop.name}\`${prop.required ? " (required)" : ""}: \`${prop.type}\`${
                    prop.defaultValue ? `, default \`${prop.defaultValue}\`` : ""
                  }`,
              )
            : ["- No parsed props. Read the source before editing."]),
          "",
          "**Adaptation notes:**",
          "",
          `- Tokens used in the source: ${component.tokensUsed.length ? component.tokensUsed.join(", ") : "none detected"}.`,
          ...component.guidelines.usage.map((item) => `- ${item}`),
          ...component.guidelines.accessibility.map((item) => `- Accessibility: ${item}`),
          ...component.guidelines.avoid.map((item) => `- Avoid: ${item}`),
          "",
        ];
      })
    : [
        "No component source is attached yet. Ask the requirements questions below, then call `get_component_bundle` with the chosen component names.",
        "",
      ];

  return [
    "# Copy-ready My Ui handoff",
    "",
    "This is a source handoff, not a summary. Copy the exact code blocks into the target project, then adapt them. Do not rewrite a component from its description. If several components share a source file, copy that file once.",
    "",
    "## Brief",
    "",
    `- Requirements: ${brief.requirements || "(not supplied — ask the questions below)"}`,
    `- Project context: ${brief.projectContext || "(not supplied — ask about the stack, tokens and target component)"}`,
    `- Requested components: ${brief.requestedComponents.length ? brief.requestedComponents.join(", ") : "(none supplied)"}`,
    `- Resolved components: ${brief.resolvedComponents.length ? brief.resolvedComponents.join(", ") : "(none yet)"}`,
    ...(brief.missingComponents.length
      ? [`- Not found: ${brief.missingComponents.join(", ")}. Use list_components to find the correct name.`]
      : []),
    "",
    "## Workflow",
    "",
    ...bundle.workflow.map((step, index) => `${index + 1}. ${step}`),
    "",
    "## Components to copy",
    "",
    ...componentBlocks,
    "## Install and verify",
    "",
    ...(bundle.install.commands.length
      ? bundle.install.commands.map((command) => `- \`${command}\``)
      : ["- No install command was generated; copy the source and resolve its imports."]),
    "",
    ...bundle.install.steps.map((step) => `- ${step}`),
    "",
    "## Style decisions",
    "",
    ...bundle.styleDecisions.map((item) => `- ${item}`),
    "",
    "## Replacing an existing component",
    "",
    ...bundle.replacement.map((item) => `- ${item}`),
    ...(bundle.components.some((c) => hasAnimation(c.code) && !hasReducedMotion(c.code))
      ? [
          "## Reduced-motion adaptation",
          "",
          "At least one selected component animates without a `prefers-reduced-motion` path. Apply this before shipping:",
          "",
          "```css",
          "@media (prefers-reduced-motion: reduce) {",
          "  *, *::before, *::after {",
          "    animation-duration: 0.01ms !important;",
          "    animation-iteration-count: 1 !important;",
          "    transition-duration: 0.01ms !important;",
          "    scroll-behavior: auto !important;",
          "  }",
          "}",
          "```",
          "",
          "And in Tailwind, add `motion-reduce:transition-none motion-reduce:animate-none` to animated elements. Verify with the OS reduced-motion setting enabled.",
          "",
        ]
      : []),
    "",
    "## Feedback loop",
    "",
    "After copying, ask these questions and wait for the answers before editing:",
    "",
    ...bundle.feedback.questions.map((question) => `- ${question}`),
    "",
    "Then adapt in this order:",
    "",
    ...bundle.feedback.adaptationOrder.map((step, index) => `${index + 1}. ${step}`),
    "",
    `Run \`${bundle.feedback.nextTool}\` on the final composition.`,
  ].join("\n");
}

export const HANDOFF_PROTOCOL_MARKDOWN = `# My Ui component handoff protocol

Use this protocol whenever a user asks for a My Ui component, a page built
from My Ui components, or a replacement for an existing component.

## 1. Ask for the brief

Do not select components or write code until you have the requirements. Ask
these questions in one compact block:

${HANDOFF_REQUIREMENTS_QUESTIONS.map((question) => `- ${question}`).join("\n")}

## 2. Select from the local index

Use \`list_components\` to search the verified local components and the
marketplace catalogue. Prefer verified local components. Never invent a
component, prop, variant or token.

## 3. Share the exact source

Call \`get_component_bundle\` with the chosen component names (or
\`suggest_combination\` for a planned page). The response contains the exact
source, the suggested target path, dependencies and adaptation notes. Give the
user the full source blocks. Do not paraphrase or reconstruct them.

## 4. Install in the user's project

Tell the user to copy each source block into the suggested path, install the
listed npm dependencies, resolve internal imports, and run typecheck/build.
Ask them to report the exact errors.

## 5. Collect feedback and adapt

Ask for typecheck/build output, screenshots or rendered DOM, token changes and
the component being replaced. Map colours, type, spacing and radius by semantic
role. Keep behaviour, accessibility and analytics stable.

## 6. Replace an existing component

Inventory the old component's props, variants, states, DOM semantics, analytics
and tests before editing. Write an API map, preserve behaviour first, then
restyle. Verify default, hover, focus, active, disabled, loading, error and
empty states.

## 7. Validate

Run \`validate_ui_composition\` on the final usage and report what changed, what
stayed the same and what still needs a decision.`;
