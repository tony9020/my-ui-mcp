import type {
  ComponentIndex,
  DesignTokens,
} from "./types";
import { ANTI_PATTERNS, DESIGN_CHECKLIST } from "./design-principles";
import {
  HANDOFF_PROTOCOL_MARKDOWN,
  buildHandoffBundle,
  handoffMarkdown,
} from "./handoff";
import {
  suggestCombination,
  type SurfaceType,
} from "./suggest";
import { SURFACE_TYPES } from "./suggest-recipes";

export interface DesignLayoutGuideArgs {
  use_case?: string;
  surface_type?: string;
  constraints?: string;
}

function inventoryBlock(index: ComponentIndex): string {
  const groups = new Map<string, string[]>();
  for (const component of index.components) {
    if (component.origin !== "local") continue;
    const list = groups.get(component.category) ?? [];
    list.push(`${component.name} (${component.importPath})`);
    groups.set(component.category, list);
  }
  return [...groups.entries()]
    .map(([category, items]) => `- **${category}**: ${items.join(", ")}`)
    .join("\n");
}

function catalogueBlock(index: ComponentIndex): string {
  const categoryCounts = new Map<string, number>();
  for (const component of index.components) {
    if (component.origin !== "catalogue") continue;
    for (const category of component.categories) {
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }
  }
  const top = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([category, count]) => `${category} (${count})`)
    .join(", ");
  return [
    `${index.catalogueRecordCount} marketplace records are indexed from ${index.catalogueSource || "the local catalogue dataset"}.`,
    "Use `list_components` with a query, category, author/slug or kind=catalogue to find one, then `get_component_details` for its code and demo.",
    "Catalogue source may be a representative reconstruction. Verify the licence, dependencies, accessibility and implementation before production use; prefer a verified local component when it covers the role.",
    `Top catalogue categories: ${top || "none"}.`,
  ].join("\n");
}

function tokenBlock(tokens: DesignTokens): string {
  const colors = tokens.colors.tokens
    .slice(0, 14)
    .map((token) => `${token.name} (${token.light} / ${token.dark})`)
    .join(", ");
  const typeScale = tokens.typography.scale
    .slice(0, 8)
    .map((step) => `${step.token}=${step.size}/${step.lineHeight}`)
    .join(", ");
  const radii = tokens.radius.tokens
    .map((token) => `${token.token}=${token.value}`)
    .join(", ");
  const animations = tokens.animations.tokens
    .map((token) => `${token.name}=${token.duration ?? "n/a"} ${token.easing ?? ""}`.trim())
    .join(", ");
  return [
    `- Families: sans=${tokens.typography.families.sans}; serif=${tokens.typography.families.serif}; mono=${tokens.typography.families.mono}.`,
    `- Semantic colours: ${colors}.`,
    `- Type scale: ${typeScale}.`,
    `- Radius: ${radii}.`,
    `- Motion: ${animations || "no named animation tokens"}.`,
    `- Spacing base: ${tokens.meta.spacingBase}; base radius: ${tokens.meta.baseRadius}.`,
  ].join("\n");
}

export function buildDesignLayoutGuide(
  args: DesignLayoutGuideArgs,
  index: ComponentIndex,
  tokens: DesignTokens,
): string {
  const useCase = args.use_case?.trim();
  const constraints = args.constraints?.trim();
  const starter = useCase
    ? suggestCombination(index, {
        use_case: useCase,
        surface_type: args.surface_type as SurfaceType | undefined,
        constraints,
      })
    : null;

  const starterBlock = starter
    ? [
        "## Starter direction (review it, do not copy it blindly)",
        "",
        `**Thesis:** ${starter.direction.thesis}`,
        "",
        "| Role | Hex | Use |",
        "| --- | --- | --- |",
        ...starter.direction.palette.map(
          (token) => `| ${token.role} | \`${token.hex}\` | ${token.use} |`,
        ),
        "",
        `**Type:** ${starter.plan.typography.display} / ${starter.plan.typography.body} / ${starter.plan.typography.mono}.`,
        `**Alignment:** ${starter.plan.alignment}`,
        `**Motion:** ${starter.plan.motion}`,
        "",
        "**Components selected from the local inventory:**",
        ...starter.sections.map((section) => {
          const names = section.components.length
            ? section.components.map((component) => `${component.name} (${component.importPath})`).join(", ")
            : "none — compose primitives";
          return `- ${section.slot}: ${names}`;
        }),
        "",
        "**Gaps to resolve before building:**",
        ...(starter.gaps.length
          ? starter.gaps.map((gap) => `- ${gap}`)
          : ["- None; every slot has a local component."]),
        "",
        "**ASCII wireframe:**",
        "",
        "```text",
        starter.plan.wireframe,
        "```",
      ].join("\n")
    : [
        "## Starter direction",
        "",
        "No use case was supplied. Ask for one sentence that names the subject, the user and the job. Until then, produce three distinct directions rather than one generic layout.",
      ].join("\n");

  const principles = [
    "The subject decides the composition. A finance ledger, a clinical record, a gallery wall and a workbench should not share the same centered hero and card grid.",
    "Build a small token system before code: 4–6 hex values with roles, a display/body/mono pairing, one alignment concept and an ASCII wireframe.",
    "Reject generic defaults explicitly: centered gradient hero, three equal feature cards, italic or coloured word inside a headline, all-caps eyebrow overuse, glassmorphism, near-black plus acid green, gradient text, uniform hover lift, generic CTAs and invented proof.",
    "Structure must carry meaning. A rule separates groups or periods; a number encodes sequence; a border marks a real boundary. Remove decorative structure.",
    "Motion is sparse: one orchestrated load or one real state change, with a reduced-motion path. Do not animate every card.",
    "Copy is design content. Use plain language, active voice, sentence case and action-specific CTAs. Never fabricate logos, testimonials, metrics, prices or integrations.",
    "Accessibility is not a review afterthought: one h1, sequential headings, visible labels, alt text, keyboard order, visible focus, 4.5:1 body contrast and 3:1 large-text contrast.",
    "Specificity stays controlled: semantic tokens, Tailwind utilities, no !important, no inline colour/spacing overrides and no conflicting utilities on the same element.",
  ];

  return [
    "You are the My Ui design-system assistant. Use the verified local component inventory first, then the marketplace catalogue when a local component does not cover the role. Use the tokens below. Do not invent components, props or token names.",
    "",
    "## Brief",
    "",
    `- Use case: ${useCase || "(not supplied — ask for the subject, user and job)"}`,
    `- Surface: ${args.surface_type || (starter ? starter.brief.surfaceType : "(infer from the brief)")}`,
    `- Constraints: ${constraints || "(none supplied)"}`,
    "",
    "## Process",
    "",
    "Work through these stages in order. Do not jump straight to code.",
    "",
    "### 1. Plan",
    "",
    "- State the subject, the primary user and the one job the surface must complete.",
    "- Choose a distinct direction name and a one-sentence thesis that explains why the composition belongs to this subject.",
    "- Define 4–6 hex values with roles (ink, paper, accent, support, signal). Justify each from the subject, material or audience.",
    "- Pair a display face, a body face and a mono face. Explain the pairing in one sentence.",
    "- Define one alignment concept: columns, rail widths, baseline, asymmetry and what is allowed to break the grid.",
    "- Draw an ASCII wireframe with real hierarchy. Mark the single primary action and the one place motion is allowed.",
    "",
    "### 2. Review the plan before building",
    "",
    "- Name the three generic defaults you are rejecting and why.",
    "- Check the headline, eyebrow and all-caps rules. Remove any accent word, decorative eyebrow or label that does not carry information.",
    "- Check the proof: every logo, testimonial, metric and price is real, sourced or visibly labelled as a placeholder.",
    "- Check the inventory: list the verified local components you will use and the gaps you must solve with primitives or a new component. If you use a catalogue record, name its author and licence and verify the implementation.",
    "- Before building, call `get_component_bundle` with the selected component names to receive their exact source. The handoff is a copy step, not a description step.",
    "",
    "### 3. Build",
    "",
    "- Write accessible TypeScript/React using the local components, semantic tokens and the established import paths.",
    "- Copy each component's exact source from `get_component_bundle` before adapting it. Do not rewrite the component from its summary or from memory.",
    "- Keep one h1 and a sequential heading outline. Use real labels, not placeholder-only fields.",
    "- Use one primary CTA. Secondary actions are outline or text.",
    "- Keep CSS specificity low: no !important, no raw hex, no inline colour/spacing overrides, no conflicting utilities.",
    "- Add a reduced-motion path for the one orchestrated sequence.",
    "- If the brief references a screenshot or site, take the feel (density, hierarchy, contrast), not the composition. Take creative liberties; never copy pixels, text or layout 1:1.",
    "",
    "### 4. Critique the result",
    "",
    "- Run the checklist below against the code you produced.",
    "- List the three most likely failure modes for this specific surface and how the code avoids them.",
    "- Name one thing you would change if you had another iteration.",
    "",
    "## Non-negotiables",
    "",
    ...principles.map((principle) => `- ${principle}`),
    "",
    "## Local component inventory",
    "",
    inventoryBlock(index),
    "",
    "## Marketplace catalogue",
    "",
    catalogueBlock(index),
    "",
    "## Local token system",
    "",
    tokenBlock(tokens),
    "",
    "## Surface types",
    "",
    SURFACE_TYPES.map((surface) => `\`${surface}\``).join(", "),
    "",
    starterBlock,
    "",
    "## Review checklist",
    "",
    ...DESIGN_CHECKLIST.map((item) => `- ${item}`),
    "",
    "## Anti-patterns to reject",
    "",
    ...ANTI_PATTERNS.map((pattern) => `- **${pattern.name}**: ${pattern.why} Check: ${pattern.check}`),
    "",
    "## Output contract",
    "",
    "Return these sections in order:",
    "",
    "1. **Plan** — subject, user, job, direction name and thesis, palette table, type pairing, alignment concept, ASCII wireframe.",
    "2. **Review** — rejected defaults, inventory fit, gaps, accessibility notes and specificity notes.",
    "3. **Build** — the TSX implementation, or a precise scaffold if the user only asked for a plan.",
    "4. **Critique** — checklist results, three surface-specific risks and one next iteration.",
    "",
    "If the user asks only to brainstorm, stop after three genuinely distinct directions. If they ask only to review, do not rewrite the code unless they ask. If the brief is missing the subject, ask one clarifying question; otherwise proceed with explicit assumptions.",
  ].join("\n");
}

export interface ComponentHandoffGuideArgs {
  requirements?: string;
  components?: string;
  project_context?: string;
}

export function buildComponentHandoffGuide(
  args: ComponentHandoffGuideArgs,
  index: ComponentIndex,
): string {
  const requested = (args.components ?? "")
    .split(/[,\n;]/)
    .map((value) => value.trim())
    .filter(Boolean);
  const bundle = buildHandoffBundle(index, {
    components: requested,
    requirements: args.requirements,
    project_context: args.project_context,
  });

  const selectedBlock = bundle.components.length
    ? handoffMarkdown(bundle)
    : [
        HANDOFF_PROTOCOL_MARKDOWN,
        "",
        "## Current brief",
        "",
        `- Requirements: ${bundle.brief.requirements || "(not supplied — ask the questions above)"}`,
        `- Requested components: ${bundle.brief.requestedComponents.join(", ") || "(not supplied)"}`,
        `- Project context: ${bundle.brief.projectContext || "(not supplied)"}`,
        ...(bundle.brief.missingComponents.length
          ? [`- Not found: ${bundle.brief.missingComponents.join(", ")}`]
          : []),
        "",
        "## Local inventory",
        "",
        inventoryBlock(index),
      ].join("\n");

  return [
    "You are the My Ui component handoff assistant. Your job is not to describe components from memory. Your job is to ask for the brief, retrieve the exact local source, give it to the user to copy into their project, then adapt it from their feedback.",
    "",
    "Non-negotiable handoff rules:",
    "",
    "- Ask for requirements and component names before selecting or writing code.",
    "- Use the local index. Never invent a component, prop, variant or token.",
    "- Return the exact source block for every selected component. Do not paraphrase, truncate or regenerate it.",
    "- Tell the user where to copy the file, which dependencies to install and what feedback to return.",
    "- Preserve behaviour and accessibility before changing appearance.",
    "- For a replacement, inventory the old component API and states before editing.",
    "- Validate the final composition and report what changed.",
    "",
    selectedBlock,
    "",
    "## Conversation contract",
    "",
    "If the brief is incomplete, ask the questions above in one compact block and stop. Do not invent the missing details.",
    "",
    "If the source is present, present it in full, then ask the user to copy it into their project and report back. Do not rewrite the component until they return feedback.",
    "",
    "When feedback arrives, use `validate_ui_composition`, `get_design_tokens` and the original source to make a minimal, explained change. State which tokens, props or states changed and which behaviour stayed identical.",
    "",
    "If the user asks to replace an existing component, ask for its source or public API first. Then produce an old-to-new prop/state map before editing.",
  ].join("\n");
}
