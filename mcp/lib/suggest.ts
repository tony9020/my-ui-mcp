import type {
  CombinationPlan,
  ComponentIndex,
  ComponentInfo,
  DesignDirection,
  SuggestedComponent,
  SuggestedSection,
} from "./types";
import { componentHandoff } from "./component-index";
import { ANTI_PATTERNS, DESIGN_CHECKLIST } from "./design-principles";
import {
  INDUSTRIES,
  type IndustryKey,
} from "./suggest-industries";
import {
  SURFACE_RECIPES,
  SURFACE_TYPES,
  type SurfaceType,
} from "./suggest-recipes";

export type { SurfaceType } from "./suggest-recipes";
export { SURFACE_TYPES } from "./suggest-recipes";

export interface SuggestInput {
  use_case: string;
  surface_type?: SurfaceType;
  constraints?: string;
}

const SURFACE_JOBS: Record<SurfaceType, string> = {
  landing: "explain the offer and earn one qualified action",
  dashboard: "turn dense operational data into a decision",
  auth: "get the right user through the door with minimal friction",
  pricing: "make plan differences legible and reduce purchase anxiety",
  settings: "change account behaviour without losing context",
  docs: "find and apply the right answer quickly",
  onboarding: "get to first value without a manual",
  mobile: "complete the core task in short, interrupted sessions",
  editor: "manipulate a canvas while keeping state legible",
  marketplace: "compare discrete options and move to a detail view",
  profile: "establish credibility and browse work",
  generic: "help the user complete the primary job with confidence",
};

const DIRECTION_NAMES: Record<IndustryKey, string> = {
  fintech: "The ledger",
  health: "The care record",
  education: "The annotated workbook",
  developer: "The runbook",
  commerce: "The catalogue index",
  creative: "The gallery wall",
  productivity: "The workbench",
  travel: "The postcard",
  ai: "The instrument panel",
  realestate: "The plan drawing",
  default: "Editorial utility",
};

function inferSurface(useCase: string): SurfaceType {
  const value = useCase.toLowerCase();
  if (/dashboard|admin|analytics|console|operations|report/.test(value)) return "dashboard";
  if (/sign.?in|log.?in|auth|password|sign.?up|register/.test(value)) return "auth";
  if (/pricing|plans|billing|subscription/.test(value)) return "pricing";
  if (/settings|preferences|account|profile settings/.test(value)) return "settings";
  if (/docs|documentation|guide|reference|api docs/.test(value)) return "docs";
  if (/onboarding|setup|wizard|first.?run/.test(value)) return "onboarding";
  if (/mobile|ios|android|phone|app screen/.test(value)) return "mobile";
  if (/editor|studio|canvas|builder|design tool/.test(value)) return "editor";
  if (/marketplace|catalog|catalogue|gallery|library|components/.test(value)) return "marketplace";
  if (/profile|portfolio|creator|author/.test(value)) return "profile";
  if (/landing|marketing|homepage|launch|hero|website/.test(value)) return "landing";
  return "generic";
}

function inferIndustry(useCase: string): IndustryKey {
  const value = useCase.toLowerCase();
  if (/fintech|finance|bank|payment|treasury|invoice|accounting|loan|invest|trading|payroll|reconcil|ledger|billing/.test(value)) return "fintech";
  if (/health|medical|clinic|patient|therap|wellness|hospital|dental|mental|care/.test(value)) return "health";
  if (/education|learning|course|student|teacher|school|campus|lesson|tutor|curriculum/.test(value)) return "education";
  if (/developer|devtool|\bapi\b|sdk|terminal|code|git|deploy|infrastructure|observab|database|engineering/.test(value)) return "developer";
  if (/shop|store|commerce|retail|checkout|cart|product|merchandis|ecommerce/.test(value)) return "commerce";
  if (/creative|studio|agency|portfolio|photograph|film|design|art|gallery|maker/.test(value)) return "creative";
  if (/productivity|project|task|workspace|team|\bops\b|collaborat|calendar|workflow/.test(value)) return "productivity";
  if (/travel|trip|hotel|flight|restaurant|food|booking|hospitality|destination/.test(value)) return "travel";
  if (/\bai\b|agent|model|\bllm\b|machine learning|intelligence|prompt|inference/.test(value)) return "ai";
  if (/real estate|property|architecture|home|listing|broker|rent|apartment/.test(value)) return "realestate";
  return "default";
}

function normalizeSurface(value: string | undefined, useCase: string): SurfaceType {
  if (!value) return inferSurface(useCase);
  const normalized = value.toLowerCase().trim().replace(/[\s_]+/g, "-");
  return SURFACE_TYPES.find((surface) => surface === normalized) ?? inferSurface(useCase);
}

function preferredFor(need: string, surface: SurfaceType): string[] {
  switch (need) {
    case "hero":
    case "headline":
      return surface === "landing" ? ["LandingHero"] : [];
    case "trusted":
      return ["TrustedBy"];
    case "proof":
      return ["TrustedBy", "AuthorsBand"];
    case "authors":
      return ["AuthorsBand"];
    case "feature":
      return ["FeatureGrid"];
    case "grid":
      if (surface === "landing") return ["FeatureGrid"];
      if (surface === "dashboard" || surface === "marketplace" || surface === "mobile") {
        return ["ResultsGrid"];
      }
      return [];
    case "showcase":
      return ["MarketShowcase"];
    case "component":
      return ["ComponentCard"];
    case "card":
      if (surface === "mobile") return ["ComponentListRow", "ComponentCard"];
      if (surface === "marketplace") return ["ComponentCard", "ComponentListRow"];
      return [];
    case "cta":
      return ["FinalCTA"];
    case "action":
    case "button":
      return ["Button"];
    case "footer":
      return ["LandingFooter"];
    case "app-header":
      return surface === "landing" ? ["SiteHeader"] : ["AppHeader", "SiteHeader"];
    case "shell":
      return surface === "marketplace" ? ["MarketplaceShell"] : ["AppHeader"];
    case "navigation":
      if (surface === "landing") return ["SiteHeader"];
      if (surface === "marketplace") return ["CategorySidebar", "AppHeader"];
      return [];
    case "badge":
      return ["Badge"];
    case "results":
      return ["ResultsGrid"];
    case "list":
      return ["ComponentListRow"];
    case "sort":
    case "filter":
      return ["SortBar"];
    case "select":
      return ["Select"];
    case "dialog":
      return ["Dialog"];
    case "toast":
      return ["Toaster"];
    case "auth":
    case "sign-in":
      return ["SignInForm"];
    case "form":
      if (surface === "auth") return ["SignInForm"];
      return ["Input"];
    case "logo":
    case "brand":
      return ["Logo"];
    case "pricing":
      return ["PricingView"];
    case "tabs":
      return ["Tabs"];
    case "menu":
      return ["Dropdown"];
    case "sidebar":
      return ["CategorySidebar"];
    case "input":
      return ["Input"];
    case "switch":
      return ["Switch"];
    case "search":
      return ["SearchDialog"];
    case "code":
      return ["CodeViewer"];
    case "rail":
      return ["SectionRail"];
    case "preview":
      return ["PreviewFrame"];
    case "install":
      return ["InstallPanel"];
    case "detail":
      return ["ComponentDetail"];
    case "avatar":
      return ["Avatar"];
    case "profile":
      return ["CreatorProfileView"];
    case "dropdown":
      return ["Dropdown"];
    default:
      return [];
  }
}

function pickForNeed(
  index: ComponentIndex,
  need: string,
  used: Set<string>,
  surface: SurfaceType,
): ComponentInfo | null {
  for (const name of preferredFor(need, surface)) {
    const component =
      index.components.find(
        (item) => item.origin === "local" && item.name === name && !used.has(item.id),
      ) ??
      index.components.find(
        (item) => item.origin === "catalogue" && item.name === name && !used.has(item.id),
      );
    if (component) return component;
  }
  return null;
}

function componentHint(component: ComponentInfo, role: string): SuggestedComponent {
  const required = component.props.filter((prop) => prop.required).map((prop) => prop.name);
  const variants = Object.entries(component.variants)
    .map(([name, value]) => `${name}: ${value.values.join(" | ")}`)
    .join("; ");
  const provenance = component.catalogue
    ? `Catalogue record by @${component.catalogue.author.username}; verify its licence and implementation before use.`
    : "Verified local source.";
  return {
    id: component.id,
    name: component.name,
    slug: component.slug,
    importPath: component.importPath,
    role,
    why: `${component.description} ${provenance} It fills the ${role.toLowerCase()} role.`,
    propsHint: [
      required.length ? `Required: ${required.join(", ")}.` : "No required props.",
      variants ? `Variants: ${variants}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
    requiredProps: required,
  };
}

function buildSections(
  index: ComponentIndex,
  surface: SurfaceType,
  direction: DesignDirection,
): { sections: SuggestedSection[]; gaps: string[] } {
  const recipe = SURFACE_RECIPES[surface];
  const used = new Set<string>();
  const gaps = new Set<string>(recipe.gaps);
  const sections: SuggestedSection[] = [];

  for (const slot of recipe.slots) {
    const components: SuggestedComponent[] = [];
    for (const need of slot.needs) {
      if (components.length >= 2) break;
      const component = pickForNeed(index, need, used, surface);
      if (!component) continue;
      used.add(component.id);
      components.push(componentHint(component, slot.slot));
    }

    sections.push({
      slot: slot.slot,
      intent: slot.intent,
      layout: slot.layout,
      components,
      copyDirection: `${slot.copyDirection} ${direction.copy}`,
      notes: [...slot.notes],
    });
  }

  return { sections, gaps: [...gaps] };
}

function buildScaffold(
  index: ComponentIndex,
  surface: SurfaceType,
  sections: SuggestedSection[],
): string {
  const selected = sections.flatMap((section) => section.components);
  const selectedNames = new Set(selected.map((component) => component.name));
  const hasSignIn = selectedNames.has("SignInForm");
  const hasPricing = selectedNames.has("PricingView");
  const hasHero = selectedNames.has("LandingHero");

  let baseNames: string[];
  if (surface === "auth" && hasSignIn) baseNames = ["Logo"];
  else if (surface === "pricing" && hasPricing) baseNames = [];
  else if (surface === "landing") baseNames = hasHero ? [] : ["Button"];
  else baseNames = ["Logo", "Badge", "Button", "Input"];

  const renderNames = new Set(baseNames);
  if (surface === "auth" && hasSignIn) renderNames.add("SignInForm");
  if (surface === "pricing" && hasPricing) renderNames.add("PricingView");
  if (surface === "landing") {
    for (const name of ["LandingHero", "FeatureGrid", "FinalCTA", "LandingFooter"]) {
      if (selectedNames.has(name)) renderNames.add(name);
    }
  }

  const importNames = new Set([
    ...baseNames,
    ...selected
      .map((component) => component.name)
      .filter((name) => renderNames.has(name)),
  ]);
  const imports = [...importNames]
    .map((name) => index.components.find((component) => component.name === name))
    .filter((component): component is ComponentInfo => Boolean(component))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((component) => `import { ${component.name} } from "${component.importPath}";`);
  const complex = selected.filter((component) => !renderNames.has(component.name));
  const has = (name: string) => renderNames.has(name);

  const lines: string[] = [
    "// Composition scaffold — replace placeholder copy and wire real data.",
    "// Components not directly rendered by this scaffold are listed as comments.",
    '"use client";',
    "",
    ...imports,
  ];

  if (has("LandingHero")) {
    lines.push('import type { ComponentRecord } from "@/lib/types";');
  }

  lines.push("");
  for (const component of complex) {
    const reason = component.why.length > 150 ? `${component.why.slice(0, 147)}...` : component.why;
    lines.push(`// - ${component.name}: ${reason}`);
  }
  if (complex.length) lines.push("");

  lines.push("export default function Page() {");
  if (has("LandingHero")) {
    lines.push("  const previews: ComponentRecord[] = [];");
  }
  lines.push("  return (");

  if (surface === "auth" && has("SignInForm")) {
    lines.push(
      '    <main className="grid min-h-screen place-items-center bg-background px-4 py-12 text-foreground">',
      '      <section aria-labelledby="auth-title" className="w-full max-w-md">',
      '        <Logo />',
      '        <h1 id="auth-title" className="mt-8 text-2xl font-medium tracking-tight">Sign in to your workspace</h1>',
      '        <p className="mt-2 text-sm text-muted-foreground">Use the account your team already shares.</p>',
      '        <div className="mt-8">',
      "          <SignInForm />",
      "        </div>",
      "      </section>",
      "    </main>",
    );
  } else if (surface === "pricing" && has("PricingView")) {
    lines.push(
      '    <main className="min-h-screen bg-background text-foreground">',
      "      <PricingView />",
      "    </main>",
    );
  } else if (surface === "landing") {
    lines.push('    <main className="min-h-screen bg-background text-foreground">');
    if (has("LandingHero")) {
      lines.push("      <LandingHero previews={previews} />");
    } else {
      lines.push(
        '      <section aria-labelledby="hero-title" className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">',
        '        <h1 id="hero-title" className="max-w-3xl text-[clamp(32px,4.4vw,44px)] font-medium leading-[1.12] tracking-tight">',
        "          State the product's job in one line.",
        "        </h1>",
        '        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted-foreground">Add one specific mechanism or outcome.</p>',
        '        <div className="mt-6">',
        '          <Button variant="brand">Create workspace</Button>',
        "        </div>",
        "      </section>",
      );
    }
    if (has("FeatureGrid")) {
      lines.push(
        '      <section aria-labelledby="capabilities-title" className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">',
        '        <h2 id="capabilities-title" className="text-[clamp(28px,3.8vw,40px)] font-medium tracking-tight">',
        "          What the product actually changes",
        "        </h2>",
        "        <FeatureGrid />",
        "      </section>",
      );
    }
    if (has("FinalCTA")) lines.push("      <FinalCTA />");
    if (has("LandingFooter")) lines.push("      <LandingFooter />");
    lines.push("    </main>");
  } else {
    lines.push(
      '    <div className="min-h-screen bg-background text-foreground">',
      '      <header className="border-b border-border">',
      '        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-4 sm:px-6">',
      "          <Logo />",
      '          <Badge variant="outline">Context</Badge>',
      "        </div>",
      "      </header>",
      '      <main className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr]">',
      '        <section aria-labelledby="page-title">',
      '          <h1 id="page-title" className="max-w-2xl text-[clamp(30px,4vw,44px)] font-medium leading-[1.12] tracking-tight">',
      "            Name the job of this surface.",
      "          </h1>",
      '          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted-foreground">',
      "            Add the one specific outcome the user came for.",
      "          </p>",
      '          <div className="mt-6 flex flex-wrap gap-3">',
      '            <Button variant="brand">Continue</Button>',
      '            <Button variant="outline">Review details</Button>',
      "          </div>",
    );

    if (has("Input")) {
      lines.push(
        '          <div className="mt-10 max-w-md">',
        '            <label htmlFor="primary-input" className="text-sm font-medium">Label</label>',
        '            <Input id="primary-input" className="mt-2" placeholder="Example value" />',
        '            <p className="mt-2 text-xs text-muted-foreground">Explain the format or consequence.</p>',
        "          </div>",
      );
    }

    lines.push(
      "        </section>",
      '        <aside className="border-l border-border pl-6">',
      '          <p className="text-sm font-medium">Supporting context</p>',
      '          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">',
      "            Use this rail for the one detail that changes the decision.",
      "          </p>",
      "        </aside>",
      "      </main>",
      "    </div>",
    );
  }

  lines.push("  );", "}");
  return lines.join("\n");
}

export function suggestCombination(index: ComponentIndex, input: SuggestInput): CombinationPlan {
  const useCase = input.use_case.trim();
  const surfaceType = normalizeSurface(input.surface_type, useCase);
  const industryKey = inferIndustry(useCase);
  const seed = INDUSTRIES[industryKey];
  const subject = useCase.replace(/\s+/g, " ").replace(/[.!?]+$/, "").trim();
  const constraints = (input.constraints ?? "")
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);

  const accentHex = seed.palette[2]?.hex ?? "#6D28D9";
  const direction: DesignDirection = {
    name: DIRECTION_NAMES[industryKey],
    thesis: seed.thesis(subject),
    palette: seed.palette,
    typography: seed.typography,
    alignment: seed.alignment,
    motion: seed.motion,
    copy: seed.copy,
    rejectedDefaults: [
      ...seed.rejected,
      "A centered hero with a gradient and three equal feature cards.",
      "Italic or coloured word accents inside headlines.",
      "All-caps eyebrow labels above every section.",
      "Glassmorphism and translucent panels without a legibility reason.",
      "Fabricated logos, testimonials, metrics or prices.",
    ],
  };

  const { sections, gaps } = buildSections(index, surfaceType, direction);
  const recipe = SURFACE_RECIPES[surfaceType];
  const scaffold = buildScaffold(index, surfaceType, sections);
  const componentNames = [...new Set(
    sections.flatMap((section) => section.components.map((component) => component.name)),
  )];
  const componentSources = [...new Set(
    sections.flatMap((section) => section.components.map((component) => component.id)),
  )]
    .map((id) => index.byId.get(id))
    .filter((component): component is ComponentInfo => Boolean(component))
    .map(componentHandoff);

  return {
    brief: {
      useCase,
      surfaceType,
      inferredJob: SURFACE_JOBS[surfaceType],
      audience: seed.audience,
      constraints,
    },
    direction,
    alternates: seed.alternates,
    plan: {
      tokens: seed.palette,
      typography: {
        display: seed.typography.display,
        body: seed.typography.body,
        mono: seed.typography.mono,
      },
      alignment: seed.alignment,
      wireframe: recipe.wireframe,
      motion: seed.motion,
      copyRules: [...recipe.copyRules, seed.copy],
    },
    sections,
    componentSources,
    review: {
      checks: [
        {
          rule: "Subject-driven composition",
          status: "pass",
          note: direction.thesis,
        },
        {
          rule: "One accent, derived from the subject",
          status: "pass",
          note: `The plan uses ${accentHex} for the single primary action; all other colour is structure or state.`,
        },
        {
          rule: "No italic or coloured word inside a headline",
          status: "pass",
          note: "Keep the headline as one sentence. If you reuse LandingHero's rotating accent, replace it with subject-specific copy and keep it the single exception.",
        },
        {
          rule: "No all-caps or eyebrow noise",
          status: "pass",
          note: "Use sentence case. Only keep an eyebrow if it carries information the heading does not.",
        },
        {
          rule: "Structure carries meaning",
          status: "pass",
          note: "Rules separate periods or groups; step numbers encode sequence; no decorative dividers.",
        },
        {
          rule: "Sparse motion with a reduced-motion path",
          status: "pass",
          note: direction.motion,
        },
        {
          rule: "Plain, action-specific copy",
          status: "pass",
          note: seed.copy,
        },
        {
          rule: "No fabricated proof",
          status: "pass",
          note: "Use a real value, a labelled placeholder, or omit the proof band.",
        },
        {
          rule: "Local inventory fit",
          status: gaps.length ? "risk" : "pass",
          note: gaps.length
            ? `${gaps.length} gap(s) require a primitive composition or a new component.`
            : "Every slot has a local component.",
        },
        {
          rule: "CSS specificity",
          status: "pass",
          note: "Use semantic tokens and Tailwind utilities; no !important or inline colour/spacing overrides.",
        },
      ],
      risks: [...recipe.risks, ...direction.rejectedDefaults.slice(0, 3)],
      accessibility: [
        "One h1 per page; section headings follow in order.",
        "Visible labels for every field; errors linked with aria-describedby.",
        "Focus-visible on every interactive element; no focus traps outside dialogs.",
        "Contrast at least 4.5:1 for body text and 3:1 for large text.",
        "Motion-reduce path for the one orchestrated sequence.",
        ...recipe.accessibility,
      ],
      specificity: [
        "Use semantic tokens: bg-background, text-foreground, border-border, text-muted-foreground, bg-brand.",
        "No raw hex in composition code; extend the token layer if the palette requires it.",
        "No !important, inline colour/spacing, or conflicting utilities.",
        ...recipe.specificity,
      ],
    },
    gaps,
    scaffold,
    nextSteps: [
      componentNames.length
        ? `Copy the exact source blocks above into your project before editing: ${componentNames.join(", ")}. Do not rewrite them from the summary.`
        : "No exact component matched; compose primitives and add the missing component to the local library.",
      "Install the listed npm dependencies and resolve the internal imports in the target project.",
      "After copying, run validate_ui_composition on the adapted usage and report typecheck/build errors, screenshots and token changes.",
      "Replace every placeholder with a real value or a visibly labelled placeholder; do not invent proof.",
      "Use design_layout_guide for the full Plan -> Review -> Build workflow if you need the reasoning scaffold.",
    ],
  };
}

export function suggestionMarkdown(plan: CombinationPlan): string {
  const palette = plan.direction.palette
    .map((token) => `| ${token.role} | \`${token.hex}\` | ${token.use} |`)
    .join("\n");
  const sections = plan.sections
    .map((section) => {
      const components = section.components.length
        ? section.components
            .map((component) => `\`${component.name}\` (${component.role})`)
            .join(", ")
        : "_No local component; compose primitives._";
      return [
        `### ${section.slot}`,
        section.intent,
        "",
        `- Components: ${components}`,
        `- Layout: ${section.layout}`,
        `- Copy: ${section.copyDirection}`,
      ].join("\n");
    })
    .join("\n\n");
  const seenSources = new Set<string>();
  const componentSourceBlocks = plan.componentSources.length
    ? plan.componentSources.flatMap((component) => {
        const sourceAlreadyIncluded = seenSources.has(component.sourceFile);
        seenSources.add(component.sourceFile);
        return [
          `### ${component.name}`,
          "",
          `- Origin: ${component.origin === "local" ? "verified local source" : `catalogue by @${component.author?.username ?? "unknown"}`}`,
          `- Copy to: \`${component.suggestedPath}\``,
          `- Source file: \`${component.sourceFile}\``,
          `- Import: \`${component.importPath}\``,
          ...(component.license ? [`- Licence: ${component.license}`] : []),
          `- npm: ${component.dependencies.npm.length ? component.dependencies.npm.join(", ") : "none detected"}`,
          `- internal: ${component.dependencies.internal.length ? component.dependencies.internal.join(", ") : "none detected"}`,
          "",
          ...(sourceAlreadyIncluded
            ? [
                `The exact source for this component is already included under \`${component.sourceFile}\` above. Copy that file once; it exports every component that shares it.`,
                "",
              ]
            : ["```tsx", component.code, "```", ""]),
        ];
      })
    : ["No component source was selected. Compose primitives or add the missing component.", ""];

  return [
    `# ${plan.direction.name}`,
    "",
    plan.direction.thesis,
    "",
    `**Surface:** ${plan.brief.surfaceType}  `,
    `**Job:** ${plan.brief.inferredJob}  `,
    `**Audience:** ${plan.brief.audience}`,
    "",
    "## Palette",
    "",
    "| Role | Hex | Use |",
    "| --- | --- | --- |",
    palette,
    "",
    "## Type and alignment",
    "",
    `- Display: ${plan.plan.typography.display}`,
    `- Body: ${plan.plan.typography.body}`,
    `- Mono: ${plan.plan.typography.mono}`,
    `- Alignment: ${plan.plan.alignment}`,
    `- Motion: ${plan.plan.motion}`,
    "",
    "## Wireframe",
    "",
    "```text",
    plan.plan.wireframe,
    "```",
    "",
    "## Composition",
    "",
    sections,
    "",
    "## Review",
    "",
    ...plan.review.risks.map((risk) => `- ${risk}`),
    "",
    "## Gaps",
    "",
    ...(plan.gaps.length
      ? plan.gaps.map((gap) => `- ${gap}`)
      : ["- None; every slot has a local component."]),
    "",
    "## Scaffold",
    "",
    "```tsx",
    plan.scaffold,
    "```",
    "",
    "## Component source to copy",
    "",
    "Copy these blocks verbatim into your project before adapting them. If several components share a source file, copy that file once. If your import aliases differ, change only the import specifiers.",
    "",
    ...componentSourceBlocks,
    "## Rejected defaults",
    "",
    ...plan.direction.rejectedDefaults.map((item) => `- ${item}`),
    "",
    "## Checklist",
    "",
    ...DESIGN_CHECKLIST.map((item) => `- ${item}`),
    "",
    "## Anti-patterns",
    "",
    ...ANTI_PATTERNS.map((pattern) => `- **${pattern.name}**: ${pattern.check}`),
  ].join("\n");
}
