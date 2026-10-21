import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { pathToFileURL } from "node:url";

import {
  buildComponentIndex,
  componentDetailPayload,
  componentHandoff,
  findComponents,
  indexSummaryOf,
  summaryOf,
} from "./lib/component-index";
import {
  buildDesignTokens,
  cssForType,
  tokenFileLabel,
  tokensForType,
} from "./lib/css-tokens";
import {
  DESIGN_PRINCIPLES_MARKDOWN,
} from "./lib/design-principles";
import {
  HANDOFF_PROTOCOL_MARKDOWN,
  buildHandoffBundle,
  handoffMarkdown,
} from "./lib/handoff";
import { packageVersion } from "./lib/paths";
import { buildComponentHandoffGuide, buildDesignLayoutGuide } from "./lib/prompt";
import { suggestCombination, suggestionMarkdown, SURFACE_TYPES } from "./lib/suggest";
import type { SurfaceType } from "./lib/suggest";
import type {
  ComponentInfo,
  DesignTokens,
  TokenType,
  ValidationReport,
} from "./lib/types";
import { validateComposition, validationMarkdown } from "./lib/validate";

const TOKEN_TYPES: TokenType[] = [
  "colors",
  "typography",
  "spacing",
  "radius",
  "shadows",
  "animations",
  "all",
];

function mdCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ").slice(0, 500);
}

function text(value: string): { type: "text"; text: string } {
  return { type: "text", text: value };
}

function success(value: string, structured?: Record<string, unknown>) {
  return {
    content: [text(value)],
    ...(structured ? { structuredContent: structured } : {}),
  };
}

function toolError(message: string) {
  return {
    isError: true,
    content: [text(message)],
  };
}

function componentsMarkdown(
  components: ComponentInfo[],
  total: number,
  filters: { category?: string; query?: string; kind?: string; limit: number },
): string {
  const lines = [
    `# My Ui components (${components.length} of ${total})`,
    "",
    `Filters: category=${filters.category ?? "any"}; query=${filters.query ?? "any"}; kind=${filters.kind ?? "any"}; limit=${filters.limit}.`,
    "",
  ];
  if (components.length === 0) {
    lines.push("No component matched. Try a broader query or call this tool without filters to see the full registry.");
    return lines.join("\n");
  }
  for (const component of components) {
    const provenance = component.catalogue
      ? `catalogue by @${component.catalogue.author.username}`
      : "local source";
    lines.push(
      `- **${component.name}** (\`${component.importPath}\`) — ${component.description}`,
      `  ${component.category} · ${component.kind} · ${provenance} · ${component.usedIn} usage reference(s) · ${component.props.length} prop(s) · variants: ${
        Object.keys(component.variants).join(", ") || "none"
      }`,
    );
  }
  return lines.join("\n");
}

function componentMarkdown(component: ComponentInfo, tokens: DesignTokens): string {
  const handoff = componentHandoff(component);
  const props = component.props.length
    ? [
        "| Prop | Type | Required | Default | Values |",
        "| --- | --- | --- | --- | --- |",
        ...component.props.map(
          (prop) =>
            `| ${mdCell(prop.name)} | \`${mdCell(prop.type)}\` | ${prop.required ? "yes" : "no"} | ${
              prop.defaultValue ? `\`${mdCell(prop.defaultValue)}\`` : "—"
            } | ${prop.values?.length ? prop.values.map((value) => `\`${mdCell(value)}\``).join(", ") : "—"} |`,
        ),
      ].join("\n")
    : "No parsed props. Check the source file and inherited types.";

  const variants = Object.entries(component.variants).length
    ? [
        "| Variant | Values | Default |",
        "| --- | --- | --- |",
        ...Object.entries(component.variants).map(
          ([name, variant]) =>
            `| ${mdCell(name)} | ${variant.values.map((value) => `\`${mdCell(value)}\``).join(", ")} | ${
              variant.default ? `\`${mdCell(variant.default)}\`` : "—"
            } |`,
        ),
      ].join("\n")
    : "No CVA variants parsed.";

  const catalogue = component.catalogue;
  const provenance = catalogue
    ? [
        `- Origin: marketplace catalogue record \`${catalogue.id}\` by ${catalogue.author.name} (@${catalogue.author.username})`,
        `- Licence: ${catalogue.license} · registry: ${catalogue.registry}`,
        `- Stats: ${catalogue.stats.downloads} downloads · ${catalogue.stats.likes} likes · ${catalogue.stats.bookmarks} bookmarks · ${catalogue.stats.views} views`,
        `- Install: \`${catalogue.installCommand}\``,
        `- Registry route: \`${catalogue.registryRoute}\` · source page: \`${catalogue.sourcePage}\``,
        `- Original source: ${catalogue.sourceUrl ? catalogue.sourceUrl : "not recorded"}`,
        `- Caveat: ${catalogue.sourceNote}`,
      ]
    : ["- Origin: local component source"];

  return [
    `# ${component.name}`,
    "",
    component.description,
    "",
    `- Import: \`${component.importPath}\``,
    `- Source: \`${component.file}\``,
    `- Category: ${component.category} (${component.kind})`,
    ...provenance,
    `- Props type: \`${component.propsType ?? "none parsed"}\``,
    `- Usage references in this repo: ${component.usedIn}`,
    `- Tokens used: ${component.tokensUsed.length ? component.tokensUsed.join(", ") : "none detected"}`,
    "",
    "## Props",
    "",
    props,
    "",
    "## Variants",
    "",
    variants,
    "",
    "## Dependencies",
    "",
    `- npm: ${component.dependencies.npm.length ? component.dependencies.npm.join(", ") : "none detected"}`,
    `- internal: ${component.dependencies.internal.length ? component.dependencies.internal.join(", ") : "none detected"}`,
    "",
    "## Guidelines",
    "",
    ...component.guidelines.usage.map((item) => `- ${item}`),
    ...component.guidelines.accessibility.map((item) => `- Accessibility: ${item}`),
    ...component.guidelines.avoid.map((item) => `- Avoid: ${item}`),
    "",
    "## Real usage examples",
    "",
    ...(component.usageExamples.length
      ? component.usageExamples.slice(0, 4).flatMap((example) => ["```tsx", example, "```", ""])
      : ["No real usage example was found in this repository.", ""]),
    "## Copy and install",
    "",
    handoff.copyInstruction,
    "",
    `- Copy target: \`${handoff.suggestedPath}\``,
    `- Import path: \`${handoff.importPath}\``,
    `- Source available: ${handoff.sourceAvailable ? "yes" : "no — the catalogue record has no component source"}`,
    ...(handoff.license ? [`- Licence: ${handoff.license}`] : []),
    ...(handoff.installCommand ? [`- Registry install (optional): \`${handoff.installCommand}\``] : []),
    ...(handoff.sourceNote ? [`- Caveat: ${handoff.sourceNote}`] : []),
    `- npm dependencies: ${handoff.dependencies.npm.length ? handoff.dependencies.npm.join(", ") : "none detected"}`,
    `- internal dependencies: ${handoff.dependencies.internal.length ? handoff.dependencies.internal.join(", ") : "none detected"}`,
    "",
    "After copying, install missing dependencies and run typecheck/build. Return the exact errors, a screenshot or the rendered states, and the token changes you made before asking for an adaptation.",
    "",
    "## Source (copy this)",
    "",
    "```tsx",
    component.code,
    "```",
    "",
    "## Design-system note",
    "",
    `Use the semantic tokens in \`${tokenFileLabel()}\` (${tokens.meta.sourceFile}) rather than raw values. If this component needs a visual change, prefer a variant or token extension over a local override.`,
  ].join("\n");
}

function tokensMarkdown(tokens: DesignTokens, type: TokenType): string {
  const lines = [
    `# My Ui design tokens: ${type}`,
    "",
    `Source: \`${tokens.meta.sourceFile}\` · theme: ${tokens.meta.theme} · generated: ${tokens.meta.generatedAt}`,
    `Base radius: ${tokens.meta.baseRadius} · spacing base: ${tokens.meta.spacingBase}`,
    "",
  ];

  if (type === "all" || type === "colors") {
    lines.push(
      "## Colors",
      "",
      "| Token | CSS var | Light | Dark | Utilities |",
      "| --- | --- | --- | --- | --- |",
      ...tokens.colors.tokens.map(
        (token) =>
          `| ${mdCell(token.name)} | \`${mdCell(token.cssVar)}\` | \`${mdCell(token.light)}\` | \`${mdCell(token.dark)}\` | ${token.utilities.map((utility) => `\`${mdCell(utility)}\``).join(", ") || "—"} |`,
      ),
      "",
      "### Contrast pairs",
      "",
      "| Foreground | Background | Light ratio | Dark ratio |",
      "| --- | --- | --- | --- |",
      ...tokens.colors.contrastPairs.map(
        (pair) =>
          `| ${mdCell(pair.foreground)} | ${mdCell(pair.background)} | ${pair.light.toFixed(2)} (${pair.lightAA ? "AA" : "fail"}) | ${pair.dark.toFixed(2)} (${pair.darkAA ? "AA" : "fail"}) |`,
      ),
      "",
      ...tokens.colors.guidance.map((item) => `- ${item}`),
      "",
    );
  }

  if (type === "all" || type === "typography") {
    lines.push(
      "## Typography",
      "",
      `Families: sans=${tokens.typography.families.sans}; serif=${tokens.typography.families.serif}; mono=${tokens.typography.families.mono}.`,
      "",
      "| Step | Size | Line height | Tracking | Weight | Use |",
      "| --- | --- | --- | --- | --- | --- |",
      ...tokens.typography.scale.map(
        (step) =>
          `| ${mdCell(step.token)} | ${mdCell(step.size)} | ${mdCell(step.lineHeight)} | ${mdCell(step.tracking)} | ${mdCell(step.weight)} | ${mdCell(step.use)} |`,
      ),
      "",
      ...tokens.typography.guidance.map((item) => `- ${item}`),
      "",
    );
  }

  if (type === "all" || type === "spacing") {
    lines.push(
      "## Spacing",
      "",
      "| Token | rem | px |",
      "| --- | --- | --- |",
      ...tokens.spacing.scale.map(
        (step) => `| ${mdCell(step.token)} | ${mdCell(step.rem)} | ${step.px} |`,
      ),
      "",
      ...tokens.spacing.layout.map(
        (item) => `- ${item.token}: ${item.value} — ${item.use}`,
      ),
      ...tokens.spacing.guidance.map((item) => `- ${item}`),
      "",
    );
  }

  if (type === "all" || type === "radius") {
    lines.push(
      "## Radius",
      "",
      "| Token | Value | CSS var | Tailwind |",
      "| --- | --- | --- | --- |",
      ...tokens.radius.tokens.map(
        (token) =>
          `| ${mdCell(token.token)} | ${mdCell(token.value)} | \`${mdCell(token.cssVar)}\` | \`${mdCell(token.tailwind)}\` |`,
      ),
      "",
      ...tokens.radius.guidance.map((item) => `- ${item}`),
      "",
    );
  }

  if (type === "all" || type === "shadows") {
    lines.push(
      "## Shadows",
      "",
      "| Token | Value | Use |",
      "| --- | --- | --- |",
      ...tokens.shadows.tokens.map(
        (token) => `| ${mdCell(token.token)} | \`${mdCell(token.value)}\` | ${mdCell(token.use)} |`,
      ),
      "",
      ...tokens.shadows.guidance.map((item) => `- ${item}`),
      "",
    );
  }

  if (type === "all" || type === "animations") {
    lines.push(
      "## Animations",
      "",
      "| Name | Value | Duration | Easing | Reduced motion |",
      "| --- | --- | --- | --- | --- |",
      ...tokens.animations.tokens.map(
        (token) =>
          `| ${mdCell(token.name)} | \`${mdCell(token.value)}\` | ${mdCell(token.duration ?? "—")} | ${mdCell(token.easing ?? "—")} | ${mdCell(token.reducedMotion)} |`,
      ),
      "",
      ...tokens.animations.guidance.map((item) => `- ${item}`),
      "",
    );
  }

  lines.push(
    "## CSS reference",
    "",
    "```css",
    cssForType(tokens, type),
    "```",
  );
  return lines.join("\n");
}

function inventoryMarkdown(index: ReturnType<typeof buildComponentIndex>): string {
  const local = index.components.filter((component) => component.origin === "local");
  const groups = new Map<string, ComponentInfo[]>();
  for (const component of local) {
    const list = groups.get(component.category) ?? [];
    list.push(component);
    groups.set(component.category, list);
  }
  const localCategories = [...groups.entries()]
    .map(([name, components]) => ({ name, count: components.length }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const catalogueCategories = new Map<string, number>();
  for (const component of index.components) {
    if (component.origin !== "catalogue") continue;
    for (const category of component.categories) {
      catalogueCategories.set(category, (catalogueCategories.get(category) ?? 0) + 1);
    }
  }
  const topCatalogueCategories = [...catalogueCategories.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  return [
    `# My Ui component inventory`,
    "",
    `${index.localComponentCount} local exports across ${index.sourceFileCount} source files, plus ${index.catalogueRecordCount} marketplace catalogue records${index.catalogueSource ? ` from \`${index.catalogueSource}\`` : ""}. Indexed ${index.indexedAt}.`,
    "",
    "Use `list_components` to page through the full registry, `get_component_bundle` for copy-ready source and install instructions, `get_component_details` for one record, and `myui://components` for all serialisable summaries.",
    "",
    "## Local categories",
    "",
    ...localCategories.map((category) => `- ${category.name}: ${category.count}`),
    "",
    "## Local components",
    "",
    ...[...groups.entries()].flatMap(([category, components]) => [
      `### ${category}`,
      "",
      ...components.map(
        (component) =>
          `- **${component.name}** — \`${component.importPath}\` — ${component.description}`,
      ),
      "",
    ]),
    "## Marketplace catalogue",
    "",
    `${index.catalogueRecordCount} records. Search by name, slug, author/slug, category or tag.`,
    "",
    "Top catalogue categories:",
    "",
    ...topCatalogueCategories.map(([category, count]) => `- ${category}: ${count}`),
  ].join("\n");
}

export function createMyUiServer(index = buildComponentIndex(), tokens = buildDesignTokens()) {
  const server = new McpServer(
    {
      name: "my-ui-design-system",
      version: packageVersion(),
    },
    {
      instructions:
        "My Ui design-system assistant. Follow the component handoff workflow: (1) ask for the user's requirements and the components or roles they need; (2) search the verified local components first and fall back to the marketplace catalogue only when needed; (3) call get_component_bundle or get_component_details and give the user the exact source, copy target and dependencies - never paraphrase or regenerate it; (4) ask the user to copy the source into their project and report typecheck/build errors, screenshots and token changes; (5) adapt from that feedback, preserving behaviour and accessibility before appearance; (6) when replacing a component, inventory the old API and states first. Use semantic tokens and design principles. Plan -> Review -> Build -> Critique. Never invent components, props, token names, logos, testimonials, metrics or prices. Catalogue source may be a representative reconstruction; verify its licence and implementation before production use.",
    },
  );

  /* ---------------------------------------------------------------- tools */

  server.registerTool(
    "list_components",
    {
      title: "List My Ui components",
      description:
        "List verified local components plus all 8,157 marketplace catalogue records, with category, origin, author, import path, description, prop count, variants and usage references. Filter by category, query or kind. Results are summaries only; call get_component_bundle or get_component_details for copy-ready source before writing code.",
      inputSchema: {
        category: z
          .string()
          .optional()
          .describe("Category name or slug, for example 'Primitives' or 'ui'."),
        query: z
          .string()
          .optional()
          .describe("Free-text search over names, tags, props, descriptions and files."),
        kind: z
          .enum(["primitive", "pattern", "section", "provider", "catalogue"])
          .optional()
          .describe("Component kind. Use 'catalogue' for marketplace records."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(200)
          .optional()
          .describe("Maximum number of components to return. Defaults to 50."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const limit = args.limit ?? 50;
      const category = args.category?.trim().toLowerCase();
      const query = args.query?.trim();
      let components = index.components;

      if (category) {
        const normalizedCategory = category.replace(/[\s_]+/g, "-");
        components = components.filter((component) => {
          const categories = component.categories.map((item) => item.toLowerCase());
          return (
            component.category.toLowerCase().includes(category) ||
            component.categorySlug.toLowerCase() === normalizedCategory ||
            categories.includes(normalizedCategory) ||
            categories.some((item) => item.includes(normalizedCategory)) ||
            (normalizedCategory === "ui" && component.categorySlug === "primitives")
          );
        });
      }

      if (query) {
        const matched = new Set(findComponents(index, query).map((component) => component.id));
        components = components.filter((component) => matched.has(component.id));
      }

      if (args.kind) {
        components = components.filter((component) => component.kind === args.kind);
      }

      const total = components.length;
      const page = components.slice(0, limit);
      const structured = {
        total,
        returned: page.length,
        categories: index.categories,
        nextStep:
          "Choose the components, then call get_component_bundle with their names to receive the exact source, copy target, dependencies and adaptation notes.",
        components: page.map(summaryOf),
      };
      return success(
        componentsMarkdown(page, total, { category, query, kind: args.kind, limit }),
        structured,
      );
    },
  );

  server.registerTool(
    "get_component_details",
    {
      title: "Get component details",
      description:
        "Return one component's metadata, parsed props, CVA variants, dependencies, real usage examples, guidelines, related components and exact source code. The markdown includes a copy target and install instructions. Both local components and marketplace catalogue records are supported.",
      inputSchema: {
        component_name: z
          .string()
          .min(1)
          .describe(
            "Component name, slug, export name, file, import path, catalogue author/slug or catalogue record id.",
          ),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const component = findComponents(index, args.component_name)[0];
      if (!component) {
        const suggestions = index.components
          .filter((item) =>
            item.name.toLowerCase().includes(args.component_name.toLowerCase().slice(0, 3)),
          )
          .slice(0, 8)
          .map((item) => item.name);
        return toolError(
          `Component "${args.component_name}" was not found in the local index. ${
            suggestions.length ? `Try: ${suggestions.join(", ")}.` : "Call list_components to browse the registry."
          }`,
        );
      }
      const payload = componentDetailPayload(component, index);
      return success(componentMarkdown(component, tokens), payload);
    },
  );

  server.registerTool(
    "get_component_bundle",
    {
      title: "Get a copy-ready component bundle",
      description:
        "Return the exact source, copy target, dependencies, adaptation notes, replacement guidance and feedback questions for one or more components. Use this after asking for requirements and before writing or editing code. Provide component names or a requirements brief. Never rewrite a component from its summary.",
      inputSchema: {
        components: z
          .union([z.string(), z.array(z.string())])
          .optional()
          .describe(
            "Component names, slugs, import paths or catalogue author/slug values, for example ['Button', 'Input'] or 'Button, Input'. Omit to derive a shortlist from requirements.",
          ),
        requirements: z
          .string()
          .optional()
          .describe(
            "The user's brief: what they are building, for whom, the main job, target stack and constraints. Required when components are omitted.",
          ),
        project_context: z
          .string()
          .optional()
          .describe(
            "Existing design system, tokens, strategy, component being replaced, editor constraints or feedback already received.",
          ),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const requested =
        typeof args.components === "string"
          ? [args.components]
          : args.components ?? [];
      if (!requested.length && !args.requirements?.trim()) {
        return toolError(
          "Provide component names or a requirements brief. Ask the user what they are building, which components or roles they need, their target stack, existing tokens and whether they are replacing a component.",
        );
      }

      const bundle = buildHandoffBundle(index, {
        components: requested,
        requirements: args.requirements,
        project_context: args.project_context,
      });

      if (!bundle.components.length) {
        const missing = bundle.brief.missingComponents.length
          ? `Not found: ${bundle.brief.missingComponents.join(", ")}.`
          : "No local component matched the requirements.";
        return toolError(
          `${missing} Call list_components to find the correct component names, or compose primitives if there is a genuine gap.`,
        );
      }

      return success(
        handoffMarkdown(bundle),
        bundle as unknown as Record<string, unknown>,
      );
    },
  );

  server.registerTool(
    "suggest_combination",
    {
      title: "Suggest a component combination",
      description:
        "Turn a use case into a subject-driven design direction: palette, type pairing, alignment, ASCII wireframe, local component selection, review notes, gaps, a TSX scaffold and the exact source of every selected component. Copy the source blocks before editing; do not regenerate them.",
      inputSchema: {
        use_case: z
          .string()
          .min(3)
          .describe("What the user is building, for whom, and the job it must do."),
        surface_type: z
          .string()
          .optional()
          .describe(`One of: ${SURFACE_TYPES.join(", ")}. Inferred when omitted.`),
        constraints: z
          .string()
          .optional()
          .describe("Optional constraints, one per line or separated by semicolons."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const plan = suggestCombination(index, {
        use_case: args.use_case,
        surface_type: args.surface_type as SurfaceType | undefined,
        constraints: args.constraints,
      });
      return success(
        suggestionMarkdown(plan),
        plan as unknown as Record<string, unknown>,
      );
    },
  );

  server.registerTool(
    "get_design_tokens",
    {
      title: "Get My Ui design tokens",
      description:
        "Expose semantic colours, typography, spacing, radius, shadows and animation tokens, with CSS variables, guidance and contrast pairs.",
      inputSchema: {
        token_type: z
          .enum(["colors", "typography", "spacing", "radius", "shadows", "animations", "all"])
          .optional()
          .describe("Token family to return. Defaults to all."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const type: TokenType = args.token_type ?? "all";
      const structured = {
        token_type: type,
        meta: tokens.meta,
        ...tokensForType(tokens, type),
      };
      return success(tokensMarkdown(tokens, type), structured);
    },
  );

  server.registerTool(
    "validate_ui_composition",
    {
      title: "Validate a UI composition",
      description:
        "Check a TSX, JSX, HTML or CSS snippet for accessibility, token, specificity, typography, motion, copy, generic-default and proof problems.",
      inputSchema: {
        code_snippet: z
          .string()
          .min(1)
          .describe("The composition code to inspect."),
        file_name: z
          .string()
          .optional()
          .describe("Optional file name for the report."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const report: ValidationReport = validateComposition(args.code_snippet, {
        fileName: args.file_name,
      });
      return success(
        validationMarkdown(report),
        report as unknown as Record<string, unknown>,
      );
    },
  );

  /* --------------------------------------------------------------- prompt */

  server.registerPrompt(
    "design_layout_guide",
    {
      title: "Plan, review, build and critique a distinct layout",
      description:
        "Use the local My Ui inventory and tokens to brainstorm, plan, review, build and critique a subject-driven interface.",
      argsSchema: {
        use_case: z
          .string()
          .optional()
          .describe("What you are building, for whom, and the main job."),
        surface_type: z
          .string()
          .optional()
          .describe(`One of: ${SURFACE_TYPES.join(", ")}.`),
        constraints: z
          .string()
          .optional()
          .describe("Optional technical, brand or content constraints."),
      },
    },
    async (args) => ({
      description: "My Ui Plan -> Review -> Build -> Critique guide",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: buildDesignLayoutGuide(args, index, tokens),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "component_handoff",
    {
      title: "Ask for requirements, hand off source, then adapt",
      description:
        "Ask for the brief and component names, return the exact local source and install instructions, then collect feedback and adapt the component to the user's design system or replace an existing one.",
      argsSchema: {
        requirements: z
          .string()
          .optional()
          .describe("What the user is building, for whom, the job and constraints."),
        components: z
          .string()
          .optional()
          .describe("Component names, slugs or catalogue author/slug values, separated by commas."),
        project_context: z
          .string()
          .optional()
          .describe("Target stack, existing tokens/design system, component being replaced or feedback received."),
      },
    },
    async (args) => ({
      description: "My Ui copy-ready component handoff",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: buildComponentHandoffGuide(args, index),
          },
        },
      ],
    }),
  );

  /* ------------------------------------------------------------ resources */

  server.registerResource(
    "component-registry",
    "myui://components",
    {
      title: "My Ui component registry",
      description:
        "All local components and marketplace catalogue records as serialisable summaries, with origin and author metadata.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              meta: {
                root: index.root,
                indexedAt: index.indexedAt,
                sourceFileCount: index.sourceFileCount,
                localComponentCount: index.localComponentCount,
                catalogueRecordCount: index.catalogueRecordCount,
                catalogueSource: index.catalogueSource,
                componentCount: index.components.length,
                categories: index.categories,
              },
              components: index.components.map(indexSummaryOf),
            },
          ),
        },
      ],
    }),
  );

  server.registerResource(
    "design-tokens",
    "myui://design-tokens",
    {
      title: "My Ui design tokens",
      description: "Semantic colours, typography, spacing, radius, shadows and animation tokens.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(tokens, null, 2),
        },
      ],
    }),
  );

  server.registerResource(
    "design-principles",
    "myui://design-principles",
    {
      title: "My Ui design principles",
      description: "The design philosophy, anti-patterns, process and review checklist.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: DESIGN_PRINCIPLES_MARKDOWN,
        },
      ],
    }),
  );

  server.registerResource(
    "handoff-protocol",
    "myui://handoff",
    {
      title: "My Ui component handoff protocol",
      description:
        "The ask -> select -> copy -> install -> feedback -> adapt workflow, including replacement and style-decision rules.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: HANDOFF_PROTOCOL_MARKDOWN,
        },
      ],
    }),
  );

  server.registerResource(
    "component-inventory",
    "myui://inventory",
    {
      title: "My Ui inventory",
      description:
        "Human-readable local inventory plus a marketplace catalogue summary grouped by category.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: inventoryMarkdown(index),
        },
      ],
    }),
  );

  const localComponents = index.components.filter(
    (component) => component.origin === "local",
  );
  const componentTemplate = new ResourceTemplate("myui://components/{slug}", {
    list: async () => ({
      resources: localComponents.map((component) => ({
        uri: `myui://components/${component.slug}`,
        name: component.name,
        description: component.description,
        mimeType: "application/json",
      })),
    }),
    complete: {
      slug: (value) =>
        localComponents
          .map((component) => component.slug)
          .filter((slug) => slug.includes(value.toLowerCase()))
          .slice(0, 50),
    },
  });

  server.registerResource(
    "component-detail",
    componentTemplate,
    {
      title: "Local component detail",
      description:
        "One verified local component with props, variants, examples, guidelines and source code.",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const raw = variables.slug;
      const slug = decodeURIComponent(Array.isArray(raw) ? raw[0] ?? "" : raw ?? "");
      const component = index.bySlug.get(slug);
      if (!component) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: `Local component "${slug}" was not found. Use myui://components or the list_components tool to browse. For marketplace records, use myui://catalogue/{author}/{slug}.`,
            },
          ],
        };
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(componentDetailPayload(component, index), null, 2),
          },
        ],
      };
    },
  );

  const catalogueComponents = index.components.filter(
    (component) => component.origin === "catalogue" && component.catalogue,
  );
  const catalogueAuthors = [
    ...new Set(
      catalogueComponents.map((component) => component.catalogue!.author.username),
    ),
  ].sort();
  const catalogueTemplate = new ResourceTemplate(
    "myui://catalogue/{author}/{slug}",
    {
      list: undefined,
      complete: {
        author: (value) =>
          catalogueAuthors
            .filter((author) => author.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 50),
        slug: (value) =>
          catalogueComponents
            .map((component) => component.slug)
            .filter((slug, index, all) => slug.includes(value.toLowerCase()) && all.indexOf(slug) === index)
            .slice(0, 50),
      },
    },
  );

  server.registerResource(
    "catalogue-component-detail",
    catalogueTemplate,
    {
      title: "Marketplace catalogue component detail",
      description:
        "One marketplace catalogue record with author, licence, stats, props, demo example and local component source.",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const rawAuthor = variables.author;
      const rawSlug = variables.slug;
      const author = decodeURIComponent(
        Array.isArray(rawAuthor) ? rawAuthor[0] ?? "" : rawAuthor ?? "",
      );
      const slug = decodeURIComponent(
        Array.isArray(rawSlug) ? rawSlug[0] ?? "" : rawSlug ?? "",
      );
      const component = index.byCatalogueKey.get(
        `${author}/${slug}`.toLowerCase(),
      );
      if (!component) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: `Catalogue record "${author}/${slug}" was not found. Use myui://components or the list_components tool to find an author/slug pair.`,
            },
          ],
        };
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(componentDetailPayload(component, index), null, 2),
          },
        ],
      };
    },
  );

  return server;
}

async function main(): Promise<void> {
  const index = buildComponentIndex();
  const tokens = buildDesignTokens();
  console.error(
    `[myui-mcp] indexed ${index.localComponentCount} local components from ${index.sourceFileCount} files plus ${index.catalogueRecordCount} catalogue records; ${tokens.colors.tokens.length} colour tokens`,
  );

  const server = createMyUiServer(index, tokens);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[myui-mcp] listening on stdio");

  const shutdown = async () => {
    try {
      await server.close();
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

const direct =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (direct) {
  main().catch((error: unknown) => {
    console.error("[myui-mcp] fatal:", error);
    process.exit(1);
  });
}
