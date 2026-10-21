import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { completable } from "@modelcontextprotocol/sdk/server/completable.js";
import { pathToFileURL } from "node:url";

import {
  buildComponentIndex,
  componentDetailPayload,
  componentHandoff,
  findComponents,
  searchComponents,
  suggestNames,
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
  compactHandoffMarkdown,
  handoffMarkdown,
} from "./lib/handoff";
import { packageVersion } from "./lib/paths";
import { isDerivedFresh, derivedMap } from "./lib/derived";
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
        "List verified local components plus all 8,157 marketplace catalogue records, with category, origin, author, import path, description, prop count, variants and usage references. Filter by category, query, kind, tags, categories, licence policy, trust tier, framework, preview availability, dependency count. Results are summaries only; call get_component_bundle or get_component_details for copy-ready source. Non-canonical duplicates and licence-excluded records are dropped by default and reported in the structured output.",
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
        tags: z
          .array(z.string().min(1))
          .optional()
          .describe("Only components carrying all of these tags."),
        categories: z
          .array(z.string().min(1))
          .optional()
          .describe("Only components in any of these categories."),
        license_policy: z
          .enum(["permissive-only", "allow-weak-copyleft", "any"])
          .optional()
          .describe("Licence gate. Default 'permissive-only' excludes NO-LICENSE, AGPL and restricted records."),
        min_trust: z
          .enum(["verified", "linked", "reference"])
          .optional()
          .describe("Minimum trust tier. Default 'reference' (everything)."),
        framework: z
          .enum(["react", "next"])
          .optional()
          .describe("Filter by framework lock. 'next' keeps Next.js components only."),
        has_preview: z
          .boolean()
          .optional()
          .describe("Only components with a preview image."),
        max_deps: z
          .number()
          .int()
          .min(0)
          .max(50)
          .optional()
          .describe("Maximum number of npm dependencies."),
        sort: z
          .enum(["relevance", "popularity", "recent", "compliance"])
          .optional()
          .describe("Sort order. Default relevance for queries, otherwise popularity."),
        include_duplicates: z
          .boolean()
          .optional()
          .describe("Include non-canonical duplicate records. Default false."),
        cursor: z
          .string()
          .optional()
          .describe("Pagination cursor from a previous response."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(200)
          .optional()
          .describe("Maximum number of components to return. Defaults to 50."),
        explain: z
          .boolean()
          .optional()
          .describe("Include ranking reasons in the structured output."),
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
      const license_policy = args.license_policy ?? "permissive-only";
      const min_trust = args.min_trust ?? "reference";
      const include_duplicates = args.include_duplicates ?? false;

      const findOpts = {
        include_duplicates,
        license_policy,
        min_trust,
        tags: args.tags,
        categories: args.categories,
        framework: args.framework,
        has_preview: args.has_preview,
        max_deps: args.max_deps,
        sort: args.sort,
        explain: args.explain,
      };

      const result = searchComponents(index, query ?? "", findOpts);
      let components = result.components;

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

      if (args.kind) {
        components = components.filter((component) => component.kind === args.kind);
      }

      // cursor
      let offset = 0;
      if (args.cursor) {
        try { offset = Number(JSON.parse(Buffer.from(args.cursor, "base64").toString("utf8")).o) || 0; } catch { offset = 0; }
      }
      const total = components.length;
      const page = components.slice(offset, offset + limit);
      const nextCursor = offset + page.length < components.length
        ? Buffer.from(JSON.stringify({ o: offset + page.length })).toString("base64")
        : undefined;

      const structured: Record<string, unknown> = {
        total,
        returned: page.length,
        categories: index.categories,
        excludedForLicence: result.excludedForLicence,
        excludedDuplicates: result.excludedDuplicates,
        nextCursor,
        nextStep:
          "Choose the components, then call get_component_bundle with their names to receive the exact source, copy target, dependencies and adaptation notes.",
        components: page.map(summaryOf),
      };
      if (result.explanations && args.explain) {
        structured.explanations = result.explanations.filter((e) => page.some((c) => c.id === e.id));
      }
      if (result.excludedForLicence > 0) {
        structured.licenceNote = `${result.excludedForLicence} record(s) were excluded by the licence policy. Use license_policy='any' to include them, and check licenseClass before copying.`;
      }

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
        const suggestions = suggestNames(index, args.component_name, 8);
        return toolError(
          `Component "${args.component_name}" was not found in the local index. ${
            suggestions.length ? `Did you mean: ${suggestions.join(", ")}?` : "Call list_components to browse the registry."
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
        license_policy: z
          .enum(["permissive-only", "allow-weak-copyleft", "any"])
          .optional()
          .describe("Licence gate for derived catalogue components. Default 'permissive-only'."),
        include_duplicates: z
          .boolean()
          .optional()
          .describe("Include non-canonical duplicate records. Default false."),
        include_source: z
          .boolean()
          .optional()
          .describe("Include full source code in the response. Default true. Set false for a metadata-only bundle."),
        format: z
          .enum(["full", "compact"])
          .optional()
          .describe("Response shape. 'compact' omits source blocks and prop tables. Default 'full'."),
        max_chars: z
          .number()
          .int()
          .min(500)
          .max(200000)
          .optional()
          .describe("Soft cap on the markdown size. Drops lowest-priority sections (never cuts source mid-block) and reports what was omitted."),
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
        license_policy: args.license_policy,
        include_duplicates: args.include_duplicates,
      });

      const includeSource = args.include_source !== false;
      const format = args.format ?? "full";
      let markdown = format === "compact"
        ? compactHandoffMarkdown(bundle)
        : handoffMarkdown(bundle);
      let structured = bundle as unknown as Record<string, unknown>;

      if (!includeSource) {
        markdown = markdown.replace(/```tsx\n[\s\S]*?```/g, "_source omitted (include_source=false)_");
        const comps = (structured.components as any[]) || [];
        for (const c of comps) c.code = undefined;
      }

      // max_chars: drop lowest-priority sections, never cut a source block.
      if (args.max_chars && markdown.length > args.max_chars) {
        const omitted: string[] = [];
        // Drop usage examples first
        if (markdown.includes("**Usage example:**")) {
          markdown = markdown.replace(/\*\*Usage example:\*\*\n\n```tsx[\s\S]*?```\n\n/g, "");
          omitted.push("usage examples");
        }
        if (markdown.length > args.max_chars && markdown.includes("**Adaptation notes:**")) {
          markdown = markdown.replace(/\*\*Adaptation notes:\*\*\n\n[\s\S]*?(?=\n## |$)/g, "");
          omitted.push("adaptation notes");
        }
        if (markdown.length > args.max_chars) {
          markdown = markdown.slice(0, args.max_chars) + "\n\n…(truncated to max_chars; fetch individual components with get_component_details)…";
          omitted.push("remaining content");
        }
        if (omitted.length) markdown += `\n\n_Omitted to fit max_chars: ${omitted.join(", ")}._`;
      }

      if (!bundle.components.length) {
        const missing = bundle.brief.missingComponents.length
          ? `Not found: ${bundle.brief.missingComponents.join(", ")}.`
          : "No local component matched the requirements.";
        const suggestions = bundle.brief.missingComponents
          .flatMap((name) => suggestNames(index, name, 3))
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(0, 8);
        return toolError(
          `${missing} ${
            suggestions.length ? `Did you mean: ${suggestions.join(", ")}? ` : ""
          }Call list_components to find the correct component names, or compose primitives if there is a genuine gap.`,
        );
      }

      return success(markdown, structured);
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
        license_policy: z
          .enum(["permissive-only", "allow-weak-copyleft", "any"])
          .optional()
          .describe("Licence gate. Default 'permissive-only'."),
        include_duplicates: z
          .boolean()
          .optional()
          .describe("Include non-canonical duplicate records. Default false."),
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
        license_policy: args.license_policy,
        include_duplicates: args.include_duplicates,
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

  const previewCache = new Map<string, { data: string; mimeType: string }>();

  server.registerTool(
    "get_component_preview",
    {
      title: "Get a component preview image",
      description:
        "Return the marketplace preview image for a catalogue component as an MCP image content block. For local components or when the network is disabled, returns the (absolute) preview URL instead. Network access is gated by MYUI_ALLOW_NETWORK (default true).",
      inputSchema: {
        component_name: z
          .string()
          .min(1)
          .describe("Component name, slug, import path, or catalogue author/slug."),
        max_bytes: z
          .number()
          .int()
          .min(1024)
          .max(5 * 1024 * 1024)
          .optional()
          .describe("Maximum image size to fetch. Default 1 MB."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args) => {
      const component = findComponents(index, args.component_name)[0];
      if (!component) {
        const suggestions = suggestNames(index, args.component_name, 5);
        return toolError(
          `Component "${args.component_name}" was not found. ${suggestions.length ? `Did you mean: ${suggestions.join(", ")}?` : "Call list_components to browse."}`,
        );
      }
      const url = component.resolvedPreviewUrl ?? component.catalogue?.previewUrl ?? null;
      if (!url) {
        return success(
          `${component.name} has no preview image. ${component.catalogue ? "Try the demo code in get_component_details." : "Local components have no preview asset."}`,
          { component: component.name, previewUrl: null },
        );
      }
      const allowNetwork = process.env.MYUI_ALLOW_NETWORK !== "false";
      if (!allowNetwork) {
        return success(`Network access disabled (MYUI_ALLOW_NETWORK=false). Preview URL: ${url}`, {
          component: component.name,
          previewUrl: url,
        });
      }
      const maxBytes = args.max_bytes ?? 1024 * 1024;
      const cached = previewCache.get(url);
      if (cached) {
        return {
          content: [
            { type: "text", text: `Preview for ${component.name}: ${url}` },
            { type: "image", data: cached.data, mimeType: cached.mimeType },
          ],
        };
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          return toolError(`Preview fetch failed: ${response.status} ${response.statusText}. URL: ${url}`);
        }
        const buf = Buffer.from(await response.arrayBuffer());
        if (buf.byteLength > maxBytes) {
          return toolError(`Preview is ${buf.byteLength} bytes, above the ${maxBytes} cap. Pass max_bytes or use the URL: ${url}`);
        }
        const mimeType = response.headers.get("content-type")?.split(";")[0]?.trim() || "image/webp";
        const data = buf.toString("base64");
        previewCache.set(url, { data, mimeType });
        return {
          content: [
            { type: "text", text: `Preview for ${component.name}: ${url}` },
            { type: "image", data, mimeType },
          ],
        };
      } catch (error) {
        return toolError(`Preview fetch failed: ${error instanceof Error ? error.message : String(error)}. URL: ${url}`);
      } finally {
        clearTimeout(timer);
      }
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
        surface_type: completable(
          z.string().optional(),
          (value) => SURFACE_TYPES.filter((s) => s.startsWith(value ?? "")),
        ).describe(`One of: ${SURFACE_TYPES.join(", ")}.`),
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
        components: completable(
          z.string().optional(),
          (value) => {
            const needle = (value ?? "").toLowerCase();
            const names = index.components.map((c) => c.name);
            const unique = [...new Set(names)];
            return unique.filter((n) => n.toLowerCase().includes(needle)).slice(0, 20);
          },
        ).describe("Component names, slugs or catalogue author/slug values, separated by commas."),
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

  server.registerTool(
    "server_status",
    {
      title: "Server status",
      description: "Version, index counts, derived-data freshness, configuration and timings. Use to diagnose the server or check data health.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      const t0 = Date.now();
      const derivedFresh = isDerivedFresh();
      const derivedLoaded = !!derivedMap();
      const status = {
        version: packageVersion(),
        node: process.version,
        index: {
          localComponents: index.localComponentCount,
          catalogueRecords: index.catalogueRecordCount,
          totalComponents: index.components.length,
          canonicalComponents: index.components.filter((c) => c.isCanonical !== false).length,
          categories: index.categories.length,
        },
        derived: {
          file: "src/data/catalogue-derived.json",
          present: derivedFresh || !!derivedMap(),
          fresh: derivedFresh,
          loaded: derivedLoaded,
        },
        config: {
          siteUrl: process.env.MYUI_SITE_URL || "https://my-ui-dun.vercel.app",
          allowNetwork: process.env.MYUI_ALLOW_NETWORK !== "false",
          licensePolicyDefault: "permissive-only",
        },
        timings: { statusCallMs: Date.now() - t0 },
      };
      return success(
        [
          "# My Ui MCP server status",
          "",
          `- Version: ${status.version}`,
          `- Node: ${status.node}`,
          `- Local components: ${status.index.localComponents}`,
          `- Catalogue records: ${status.index.catalogueRecords}`,
          `- Total indexed: ${status.index.totalComponents} (${status.index.canonicalComponents} canonical)`,
          `- Categories: ${status.index.categories}`,
          `- Derived file: ${status.derived.present ? "present" : "missing"} (fresh: ${status.derived.fresh}, loaded: ${status.derived.loaded})`,
          `- Site URL: ${status.config.siteUrl}`,
          `- Network allowed: ${status.config.allowNetwork}`,
          `- Default licence policy: ${status.config.licensePolicyDefault}`,
        ].join("\n"),
        status as unknown as Record<string, unknown>,
      );
    },
  );

  server.registerTool(
    "list_facets",
    {
      title: "List catalogue facets",
      description: "Counts of categories, tags, licence classes, trust tiers and frameworks, optionally scoped by a query. Use to discover what exists before searching.",
      inputSchema: {
        query: z.string().optional().describe("Optional free-text scope."),
        license_policy: z.enum(["permissive-only", "allow-weak-copyleft", "any"]).optional(),
        include_duplicates: z.boolean().optional(),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (args) => {
      const result = searchComponents(index, args.query ?? "", {
        license_policy: args.license_policy ?? "permissive-only",
        include_duplicates: args.include_duplicates ?? false,
      });
      const pool = result.components;
      const categories: Record<string, number> = {};
      const tags: Record<string, number> = {};
      const licenses: Record<string, number> = {};
      const trust: Record<string, number> = {};
      const frameworks: Record<string, number> = {};
      for (const c of pool) {
        categories[c.category] = (categories[c.category] || 0) + 1;
        for (const t of c.tags) tags[t] = (tags[t] || 0) + 1;
        const lc = c.licenseClass ?? "unknown";
        licenses[lc] = (licenses[lc] || 0) + 1;
        const tt = c.trustTier ?? "reference";
        trust[tt] = (trust[tt] || 0) + 1;
        const fw = c.frameworkLock ?? "none";
        frameworks[fw] = (frameworks[fw] || 0) + 1;
      }
      const topTags = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 25);
      const facets = {
        total: pool.length,
        excludedForLicence: result.excludedForLicence,
        categories: Object.entries(categories).sort((a, b) => b[1] - a[1]),
        tags: topTags,
        licenseClasses: Object.entries(licenses).sort((a, b) => b[1] - a[1]),
        trustTiers: Object.entries(trust).sort((a, b) => b[1] - a[1]),
        frameworks: Object.entries(frameworks).sort((a, b) => b[1] - a[1]),
      };
      const md = [
        "# Facets",
        "",
        `Total (after filters): ${facets.total}`,
        "",
        "## Categories",
        ...facets.categories.map(([k, v]) => `- ${k}: ${v}`),
        "",
        "## Top tags",
        ...facets.tags.map(([k, v]) => `- ${k}: ${v}`),
        "",
        "## Licence classes",
        ...facets.licenseClasses.map(([k, v]) => `- ${k}: ${v}`),
        "",
        "## Trust tiers",
        ...facets.trustTiers.map(([k, v]) => `- ${k}: ${v}`),
        "",
        "## Frameworks",
        ...facets.frameworks.map(([k, v]) => `- ${k}: ${v}`),
      ].join("\n");
      return success(md, facets as unknown as Record<string, unknown>);
    },
  );

  server.registerTool(
    "find_similar",
    {
      title: "Find similar components",
      description: "Nearest neighbours of a component by tags, categories, props and description. Useful for finding alternatives or a replacement.",
      inputSchema: {
        component_name: z.string().min(1).describe("Component name, slug, or catalogue author/slug."),
        limit: z.number().int().min(1).max(20).optional().describe("How many neighbours. Default 8."),
        license_policy: z.enum(["permissive-only", "allow-weak-copyleft", "any"]).optional(),
        include_duplicates: z.boolean().optional(),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (args) => {
      const component = findComponents(index, args.component_name, { license_policy: args.license_policy ?? "permissive-only", include_duplicates: args.include_duplicates ?? false })[0];
      if (!component) {
        const suggestions = suggestNames(index, args.component_name, 5);
        return toolError(`Component "${args.component_name}" was not found. ${suggestions.length ? `Did you mean: ${suggestions.join(", ")}?` : "Call list_components to browse."}`);
      }
      const limit = args.limit ?? 8;
      const tagSet = new Set(component.tags);
      const catSet = new Set(component.categories);
      const propNames = new Set(component.props.map((p) => p.name));
      const pool = (args.include_duplicates ? index.components : index.components.filter((c) => c.isCanonical !== false))
        .filter((c) => c.id !== component.id)
        .filter((c) => {
          const cls = c.licenseClass ?? "unknown";
          const policy = args.license_policy ?? "permissive-only";
          if (policy === "any") return true;
          if (policy === "allow-weak-copyleft") return cls === "first-party" || cls === "permissive" || cls === "weak-copyleft";
          return cls === "first-party" || cls === "permissive";
        });
      const scored = pool.map((other) => {
        let sharedTags = 0;
        for (const t of other.tags) if (tagSet.has(t)) sharedTags++;
        let sharedCategories = 0;
        for (const c of other.categories) if (catSet.has(c)) sharedCategories++;
        let sharedProps = 0;
        for (const p of other.props) if (propNames.has(p.name)) sharedProps++;
        const nameOverlap = component.name.toLowerCase().split(/\s+/).some((w) => other.name.toLowerCase().includes(w)) ? 1 : 0;
        const score = sharedTags * 2 + sharedCategories * 3 + sharedProps * 1.5 + nameOverlap;
        const reasons: string[] = [];
        if (sharedCategories) reasons.push(`${sharedCategories} shared categor${sharedCategories === 1 ? "y" : "ies"}`);
        if (sharedTags) reasons.push(`${sharedTags} shared tag${sharedTags === 1 ? "" : "s"}`);
        if (sharedProps) reasons.push(`${sharedProps} shared prop${sharedProps === 1 ? "" : "s"}`);
        if (nameOverlap) reasons.push("name overlap");
        return { other, score, reasons };
      }).filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score || a.other.name.localeCompare(b.other.name))
        .slice(0, limit);
      const md = [
        `# Similar to ${component.name}`,
        "",
        ...scored.map((s) => `- **${s.other.name}** (${s.other.origin}, ${s.other.category}) — score ${s.score}: ${s.reasons.join(", ")}`),
      ].join("\n");
      return success(md, { source: component.name, similar: scored.map((s) => ({ ...summaryOf(s.other), score: s.score, reasons: s.reasons })) } as unknown as Record<string, unknown>);
    },
  );

  server.registerTool(
    "compare_components",
    {
      title: "Compare components",
      description: "Side-by-side props, variants, dependencies, weight, licence, compliance and trust for 2-4 components, with a recommendation for a stated constraint.",
      inputSchema: {
        components: z.array(z.string().min(1)).min(2).max(4).describe("2-4 component names, slugs or catalogue author/slug values."),
        constraint: z.string().optional().describe("What matters most, e.g. 'lowest dependency weight', 'permissive licence only', 'no framer-motion'."),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (args) => {
      const resolved = args.components.map((name) => findComponents(index, name)[0]).filter(Boolean);
      if (resolved.length < 2) {
        return toolError("Need at least 2 resolvable components. Call list_components to find correct names.");
      }
      const rows = resolved.map((c) => ({
        name: c.name,
        origin: c.origin,
        trustTier: c.trustTier ?? "unknown",
        license: c.catalogue?.license ?? (c.origin === "local" ? "first-party" : "unknown"),
        licenseClass: c.licenseClass ?? "unknown",
        compliance: c.complianceScore ?? 0,
        popularity: c.popularityScore ?? 0,
        npmDeps: c.dependencies.npm.length,
        internalDeps: c.dependencies.internal.length,
        declaredUnused: c.codeQuality?.declaredDepsUnused?.length ?? 0,
        props: c.props.length,
        variants: Object.keys(c.variants).length,
        heavyDeps: c.heavyDeps ?? [],
        frameworkLock: c.frameworkLock ?? "none",
        hasReducedMotion: c.codeQuality?.hasReducedMotion ?? false,
        usesTokens: c.codeQuality?.usesTokens ?? false,
      }));
      const recommendation = (() => {
        const constraint = (args.constraint ?? "").toLowerCase();
        if (constraint.includes("depend") || constraint.includes("weight") || constraint.includes("bundle")) {
          return rows.reduce((a, b) => (a.npmDeps + a.internalDeps < b.npmDeps + b.internalDeps ? a : b)).name;
        }
        if (constraint.includes("licence") || constraint.includes("license") || constraint.includes("permissive")) {
          const permissive = rows.filter((r) => r.licenseClass === "permissive" || r.licenseClass === "first-party");
          return (permissive.length ? permissive : rows).reduce((a, b) => (a.compliance > b.compliance ? a : b)).name;
        }
        if (constraint.includes("compliance") || constraint.includes("quality")) {
          return rows.reduce((a, b) => (a.compliance > b.compliance ? a : b)).name;
        }
        // default: highest compliance, then lowest deps
        return rows.reduce((a, b) => (a.compliance !== b.compliance ? (a.compliance > b.compliance ? a : b) : (a.npmDeps < b.npmDeps ? a : b))).name;
      })();
      const md = [
        "# Component comparison",
        "",
        `Recommendation for "${args.constraint ?? "general use"}": **${recommendation}**`,
        "",
        "| Field | " + rows.map((r) => r.name).join(" | ") + " |",
        "| --- | " + rows.map(() => "---").join(" | ") + " |",
        ...[
          ["Origin", (r: any) => r.origin],
          ["Trust", (r: any) => r.trustTier],
          ["Licence", (r: any) => `${r.license} (${r.licenseClass})`],
          ["Compliance", (r: any) => `${r.compliance}/100`],
          ["Popularity", (r: any) => r.popularity.toFixed(3)],
          ["npm deps", (r: any) => r.npmDeps],
          ["internal deps", (r: any) => r.internalDeps],
          ["unused declared", (r: any) => r.declaredUnused],
          ["props", (r: any) => r.props],
          ["variants", (r: any) => r.variants],
          ["heavy deps", (r: any) => r.heavyDeps.join(", ") || "none"],
          ["framework lock", (r: any) => r.frameworkLock],
          ["reduced motion", (r: any) => r.hasReducedMotion ? "yes" : "no"],
          ["uses tokens", (r: any) => r.usesTokens ? "yes" : "no"],
        ].map(([label, fn]) => `| ${label} | ${rows.map(fn as any).join(" | ")} |`),
      ].join("\n");
      return success(md, { components: rows, recommendation, constraint: args.constraint ?? null } as unknown as Record<string, unknown>);
    },
  );

  server.registerTool(
    "plan_install",
    {
      title: "Plan an install",
      description: "Given component names or a requirements brief, return a deduplicated install plan: merged npm dependencies (real imports only), internal files to copy in dependency order, import-alias fixes, collision warnings and one copy-paste shell block.",
      inputSchema: {
        components: z.union([z.string(), z.array(z.string())]).optional(),
        requirements: z.string().optional(),
        project_context: z.string().optional(),
        license_policy: z.enum(["permissive-only", "allow-weak-copyleft", "any"]).optional(),
        include_duplicates: z.boolean().optional(),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (args) => {
      const requested = typeof args.components === "string" ? [args.components] : args.components ?? [];
      if (!requested.length && !args.requirements?.trim()) {
        return toolError("Provide component names or a requirements brief.");
      }
      const bundle = buildHandoffBundle(index, {
        components: requested,
        requirements: args.requirements,
        project_context: args.project_context,
        license_policy: args.license_policy,
        include_duplicates: args.include_duplicates,
      });
      if (!bundle.components.length) {
        return toolError("No components resolved. Call list_components to find correct names.");
      }
      const npm = [...new Set(bundle.components.flatMap((c) => c.dependencies.npm))].sort();
      const internal = [...new Set(bundle.components.flatMap((c) => c.dependencies.internal))].sort();
      const declaredUnused = [...new Set(bundle.components.flatMap((c) => c.codeQuality?.declaredDepsUnused ?? []))].sort();
      const collisions: string[] = [];
      const seenPaths = new Set<string>();
      for (const c of bundle.components) {
        if (seenPaths.has(c.suggestedPath)) collisions.push(`Multiple components target ${c.suggestedPath}`);
        seenPaths.add(c.suggestedPath);
      }
      // internal files in dependency order: sort by path depth then name
      const internalFiles = [...new Set(bundle.components.map((c) => c.sourceFile))].sort();
      const shell = [
        "# Install npm dependencies",
        npm.length ? `npm install ${npm.join(" ")}` : "# (no npm dependencies detected)",
        "",
        "# Copy these source files (in order):",
        ...internalFiles.map((f) => `#   ${f}`),
        ...bundle.components.map((c) => `#   ${c.suggestedPath}  <- ${c.name}`),
      ].join("\n");
      const md = [
        "# Install plan",
        "",
        `Components: ${bundle.components.map((c) => c.name).join(", ")}`,
        "",
        "## npm dependencies (real imports only)",
        npm.length ? npm.map((d) => `- ${d}`).join("\n") : "- none",
        "",
        ...(declaredUnused.length ? ["## Declared but unused (do not install for these)", ...declaredUnused.map((d) => `- ${d}`), ""] : []),
        "## Internal files to copy",
        ...internalFiles.map((f) => `- ${f}`),
        "",
        "## Copy targets",
        ...bundle.components.map((c) => `- ${c.name}: \`${c.suggestedPath}\` (from \`${c.sourceFile}\`)`),
        "",
        ...(collisions.length ? ["## Collisions", ...collisions.map((c) => `- ${c}`), ""] : []),
        "## Shell",
        "",
        "```sh",
        shell,
        "```",
      ].join("\n");
      const plan = {
        components: bundle.components.map((c) => c.name),
        npm,
        internal,
        declaredUnused,
        internalFiles,
        copyTargets: bundle.components.map((c) => ({ component: c.name, source: c.sourceFile, target: c.suggestedPath })),
        collisions,
        shell,
      };
      return success(md, plan as unknown as Record<string, unknown>);
    },
  );

  server.registerTool(
    "audit_catalogue",
    {
      title: "Audit the catalogue",
      description: "Read-only data-quality report for the marketplace catalogue: counts, trust tiers, licence classes, code-quality signals and top issues. Use to assess data health from inside the IDE.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      const comps = index.components.filter((c) => c.origin === "catalogue");
      const trust: Record<string, number> = {};
      const lic: Record<string, number> = {};
      let unusedDeps = 0, undefKf = 0, demoMismatch = 0, reducedMotion = 0, hardcoded = 0, unresolvable = 0;
      const heavy: Record<string, number> = {};
      for (const c of comps) {
        const tt = c.trustTier ?? "reference";
        trust[tt] = (trust[tt] || 0) + 1;
        const lc = c.licenseClass ?? "unknown";
        lic[lc] = (lic[lc] || 0) + 1;
        const cq = c.codeQuality;
        if (cq) {
          if (cq.declaredDepsUnused.length) unusedDeps++;
          if (cq.usesUndefinedKeyframes) undefKf++;
          if (!cq.demoMatchesComponent) demoMismatch++;
          if (cq.hasReducedMotion) reducedMotion++;
          if (cq.usesHardcodedColor) hardcoded++;
          if (!cq.importsResolvable) unresolvable++;
        }
        for (const h of c.heavyDeps ?? []) heavy[h] = (heavy[h] || 0) + 1;
      }
      const topHeavy = Object.entries(heavy).sort((a, b) => b[1] - a[1]).slice(0, 10);
      const md = [
        "# Catalogue audit",
        "",
        `- Total records: ${comps.length}`,
        `- Canonical: ${comps.filter((c) => c.isCanonical !== false).length}`,
        `- Non-canonical (collapsed by default): ${comps.filter((c) => c.isCanonical === false).length}`,
        `- Linked (has sourceUrl): ${comps.filter((c) => c.trustTier === "linked").length}`,
        `- Reference (no sourceUrl): ${comps.filter((c) => c.trustTier === "reference").length}`,
        "",
        "## Licence classes",
        ...Object.entries(lic).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`),
        "",
        "## Trust tiers",
        ...Object.entries(trust).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`),
        "",
        "## Code-quality signals",
        `- Records with unused declared deps: ${unusedDeps}`,
        `- Records with undefined keyframes: ${undefKf}`,
        `- Records whose demo does not import its component: ${demoMismatch}`,
        `- Records with reduced-motion handling: ${reducedMotion} (of ${comps.length})`,
        `- Records with hardcoded colours: ${hardcoded}`,
        `- Records with unresolvable imports: ${unresolvable}`,
        "",
        "## Top heavy dependencies",
        ...topHeavy.map(([k, v]) => `- ${k}: ${v}`),
        "",
        "Run `npm run audit` for the full data-quality report including popularity medians and duplicate counts.",
      ].join("\n");
      const report = { total: comps.length, trust, licenses: lic, codeQuality: { unusedDeps, undefKf, demoMismatch, reducedMotion, hardcoded, unresolvable }, heavyDeps: topHeavy };
      return success(md, report as unknown as Record<string, unknown>);
    },
  );

  server.registerTool(
    "map_tokens",
    {
      title: "Map user tokens to My Ui tokens",
      description: "Given the user's existing CSS variables or Tailwind theme (pasted), map them onto My Ui's semantic tokens and flag unmapped ones.",
      inputSchema: {
        user_tokens: z.string().min(1).describe("Pasted CSS variables, Tailwind theme or token list."),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (args) => {
      const tokens = buildDesignTokens();
      const colorNames = tokens.colors.tokens.map((t) => t.name);
      // extract user variable names
      const userVars = [...args.user_tokens.matchAll(/--([\w-]+)\s*:/g)].map((m) => m[1]);
      const userHex = [...args.user_tokens.matchAll(/#([0-9a-fA-F]{3,8})\b/g)].map((m) => m[1]);
      // map by name similarity
      const mapped: { user: string; myui: string | null; note: string }[] = [];
      for (const v of userVars) {
        const lower = v.toLowerCase();
        // direct name match
        let match = colorNames.find((n) => n === lower || n.replace(/-/g, "") === lower.replace(/-/g, ""));
        if (!match) {
          // fuzzy: contains
          match = colorNames.find((n) => lower.includes(n) || n.includes(lower));
        }
        mapped.push({ user: `--${v}`, myui: match ? `--${match}` : null, note: match ? "name match" : "no direct match — review manually" });
      }
      const unmapped = mapped.filter((m) => !m.myui);
      const md = [
        "# Token mapping",
        "",
        `User variables found: ${userVars.length}`,
        `Mapped: ${mapped.length - unmapped.length}`,
        `Unmapped: ${unmapped.length}`,
        "",
        "## Mapping",
        ...mapped.map((m) => `- ${m.user} → ${m.myui ?? "(unmapped)"} — ${m.note}`),
        "",
        ...(unmapped.length ? ["## Unmapped (review manually)", ...unmapped.map((m) => `- ${m.user}`), ""] : []),
        "## My Ui semantic token set",
        colorNames.map((n) => `- --${n}`).join("\n"),
      ].join("\n");
      return success(md, { mapped, unmapped: unmapped.map((m) => m.user), availableTokens: colorNames } as unknown as Record<string, unknown>);
    },
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
