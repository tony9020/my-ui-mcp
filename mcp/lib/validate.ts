import type {
  Severity,
  ValidationFinding,
  ValidationMetrics,
  ValidationReport,
} from "./types";

export interface ValidateOptions {
  fileName?: string;
}

type FindingInput = Omit<ValidationFinding, "id" | "line" | "evidence"> & {
  index?: number;
  evidence?: string;
};

const GENERIC_CTA =
  /(?:^|>)\s*(Submit|Learn more|Get started|Click here|Read more|Explore|Shop now|Learn More|Get Started|Click Here|Read More)\s*(?:<|$)/gim;

const UNVERIFIED_METRIC =
  /\b(?:\d{1,3}(?:,\d{3})+|\d+)\s*(?:\+|k|m|million|billion)?\s*(?:users|customers|teams|companies|developers|downloads|stars|businesses|brands)\b|\b(?:99|100)\.\d+%\b|#1\b|\bnumber one\b|\btrusted by\b|\bworld'?s leading\b/gi;

const PALETTE_CLASS =
  /\b(?:bg|text|border|from|via|to|ring|fill|stroke|divide)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|grey|zinc|neutral|stone|black|white)(?:-\d{2,3})?\b/g;

function lineAt(source: string, index: number): number {
  return source.slice(0, Math.max(0, index)).split("\n").length;
}

function lineText(source: string, index: number): string {
  const lines = source.split("\n");
  return (lines[lineAt(source, index) - 1] ?? "").trim().slice(0, 180);
}

function stripJsx(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\{[^{}]*\}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function classNameStrings(source: string): string[] {
  const results: string[] = [];
  const pattern = /className\s*=\s*["'`]([^"'`]*)["'`]/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    results.push(match[1] ?? "");
  }
  return results;
}

export function validateComposition(
  codeSnippet: string,
  options: ValidateOptions = {},
): ValidationReport {
  const source = codeSnippet.replace(/\r\n/g, "\n");
  const findings: ValidationFinding[] = [];
  let findingNumber = 0;

  const metrics: ValidationMetrics = {
    lines: source.split("\n").length,
    images: 0,
    imagesMissingAlt: 0,
    inputs: 0,
    inputsWithoutLabel: 0,
    buttons: 0,
    buttonsWithoutLabel: 0,
    clickableNonSemantic: 0,
    headingSkips: 0,
    multipleH1: 0,
    rawHexColors: 0,
    paletteClasses: 0,
    arbitraryValues: 0,
    inlineStyles: 0,
    importantRules: 0,
    uppercaseLabels: 0,
    headlineAccents: 0,
    eyebrows: 0,
    cardLikeBlocks: 0,
    glassmorphism: 0,
    gradientText: 0,
    animatedElements: 0,
    uniformHoverMotion: 0,
    genericCtas: 0,
    unverifiedMetrics: 0,
  };

  const addFinding = (input: FindingInput): void => {
    findingNumber += 1;
    const index = input.index ?? 0;
    findings.push({
      id: `${input.category}-${findingNumber}`,
      rule: input.rule,
      severity: input.severity,
      category: input.category,
      line: lineAt(source, index),
      message: input.message,
      evidence: input.evidence ?? lineText(source, index),
      fix: input.fix,
    });
  };

  if (!source.trim()) {
    addFinding({
      rule: "Non-empty snippet",
      severity: "error",
      category: "structure",
      message: "The snippet is empty, so there is nothing to validate.",
      evidence: "(empty)",
      fix: "Pass the actual TSX, JSX, HTML or CSS you plan to ship.",
    });
  }

  // Images and alt text.
  const imagePattern = /<(img|Image)\b([^>]*?)(\/?)>/g;
  let imageMatch: RegExpExecArray | null;
  while ((imageMatch = imagePattern.exec(source))) {
    metrics.images += 1;
    if (!/\balt\s*=/.test(imageMatch[2] ?? "")) {
      metrics.imagesMissingAlt += 1;
      addFinding({
        rule: "Images need alt text",
        severity: "error",
        category: "accessibility",
        index: imageMatch.index,
        message: "An image is missing an alt attribute. Decorative images need alt=\"\".",
        fix: "Add alt text that names the content, or alt=\"\" if the image is decorative.",
      });
    }
  }

  // Inputs and visible labels.
  const inputPattern = /<(input|Input|textarea|Textarea)\b([^>]*?)(\/?)>/g;
  let inputMatch: RegExpExecArray | null;
  while ((inputMatch = inputPattern.exec(source))) {
    metrics.inputs += 1;
    const attributes = inputMatch[2] ?? "";
    const id = attributes.match(/\bid\s*=\s*["']([^"']+)["']/)?.[1];
    const hasAria =
      /\baria-label\s*=/.test(attributes) ||
      /\baria-labelledby\s*=/.test(attributes);
    const hasDynamicLabel =
      /\bid\s*=\s*\{/.test(attributes) &&
      /<label\b[^>]*htmlFor\s*=\s*\{/.test(source);
    const hasLabel =
      hasAria ||
      hasDynamicLabel ||
      (id
        ? new RegExp(
            `<label[^>]*htmlFor\\s*=\\s*["']${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
            "i",
          ).test(source)
        : false);
    if (!hasLabel) {
      metrics.inputsWithoutLabel += 1;
      addFinding({
        rule: "Form controls need labels",
        severity: "error",
        category: "accessibility",
        index: inputMatch.index,
        message: "A form control has no visible label or accessible name. A placeholder is not a label.",
        fix: "Add a label connected with htmlFor/id, or an aria-label when a visible label is impossible.",
      });
    }
  }

  // Buttons and accessible names.
  const buttonPattern = /<(button|Button)\b([^>]*)>([\s\S]*?)<\/\1>/g;
  let buttonMatch: RegExpExecArray | null;
  while ((buttonMatch = buttonPattern.exec(source))) {
    metrics.buttons += 1;
    const attributes = buttonMatch[2] ?? "";
    const inner = buttonMatch[3] ?? "";
    const text = stripJsx(inner);
    const expressionOnly = /\{[^{}]+\}/.test(inner);
    const hasName = /\baria-label\s*=/.test(attributes) || text.length > 0 || expressionOnly;
    if (!hasName) {
      metrics.buttonsWithoutLabel += 1;
      addFinding({
        rule: "Buttons need accessible names",
        severity: "error",
        category: "accessibility",
        index: buttonMatch.index,
        message: "A button contains no readable text and no aria-label. Icon-only buttons need a name.",
        fix: "Add visible text or an aria-label that names the action.",
      });
    }
  }

  const selfClosingButton = /<(button|Button)\b([^>]*?)\/>/g;
  let selfButtonMatch: RegExpExecArray | null;
  while ((selfButtonMatch = selfClosingButton.exec(source))) {
    metrics.buttons += 1;
    if (!/\baria-label\s*=/.test(selfButtonMatch[2] ?? "")) {
      metrics.buttonsWithoutLabel += 1;
      addFinding({
        rule: "Buttons need accessible names",
        severity: "error",
        category: "accessibility",
        index: selfButtonMatch.index,
        message: "A self-closing button has no text content or aria-label.",
        fix: "Add visible text or an aria-label that names the action.",
      });
    }
  }

  // Clickable non-semantic elements.
  const clickPattern = /<(div|span)\b([^>]*\bonClick\s*=[^>]*)>/g;
  let clickMatch: RegExpExecArray | null;
  while ((clickMatch = clickPattern.exec(source))) {
    const attributes = clickMatch[2] ?? "";
    if (/\brole\s*=/.test(attributes) && /\btabIndex\s*=/.test(attributes)) continue;
    metrics.clickableNonSemantic += 1;
    addFinding({
      rule: "Use native interactive elements",
      severity: "error",
      category: "accessibility",
      index: clickMatch.index,
      message: "A div or span has an onClick handler without role and tabIndex. It is invisible to keyboard and assistive technology.",
      fix: "Use a button or link. If a wrapper must handle the click, move the handler to the interactive child.",
    });
  }

  // Heading order and h1 count.
  const headingPattern = /<h([1-6])\b([^>]*)>/g;
  let headingMatch: RegExpExecArray | null;
  let previousLevel = 0;
  let h1Count = 0;
  let headingCount = 0;
  while ((headingMatch = headingPattern.exec(source))) {
    headingCount += 1;
    const level = Number(headingMatch[1]);
    if (level === 1) h1Count += 1;
    if (previousLevel > 0 && level > previousLevel + 1) {
      metrics.headingSkips += 1;
      addFinding({
        rule: "Headings should not skip levels",
        severity: "error",
        category: "accessibility",
        index: headingMatch.index,
        message: `Heading level h${level} follows h${previousLevel}, skipping a level.`,
        fix: "Use the next heading level in document order; use styling to adjust visual size.",
      });
    }
    previousLevel = level;
  }
  if (h1Count > 1) {
    metrics.multipleH1 = h1Count;
    addFinding({
      rule: "One h1 per page",
      severity: "error",
      category: "accessibility",
      message: `Found ${h1Count} h1 elements. A page should have one primary heading.`,
      evidence: `${h1Count} h1 elements`,
      fix: "Keep one h1 for the page subject and make section headings h2 or lower.",
    });
  }
  if (headingCount > 0 && h1Count === 0) {
    addFinding({
      rule: "Page needs an h1",
      severity: "warning",
      category: "accessibility",
      message:
        "The snippet has headings but no explicit h1. If a composed section component owns the page heading, verify that it renders one.",
      evidence: `${headingCount} headings, no h1`,
      fix: "Add one h1, or confirm the section component you composed renders the page h1.",
    });
  }

  // Headline accents: italic or coloured single words inside headings.
  const fullHeadingPattern = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/g;
  let fullHeading: RegExpExecArray | null;
  while ((fullHeading = fullHeadingPattern.exec(source))) {
    const attributes = fullHeading[2] ?? "";
    const inner = fullHeading[3] ?? "";
    const accent =
      /\bitalic\b/.test(attributes) ||
      /<(?:em|i)\b/i.test(inner) ||
      /<span\b[^>]*className\s*=\s*["'][^"']*(?:\bitalic\b|text-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|brand|accent|primary|destructive))\b/i.test(
        inner,
      );
    if (accent) {
      metrics.headlineAccents += 1;
      addFinding({
        rule: "No italic or coloured headline accents",
        severity: "error",
        category: "typography",
        index: fullHeading.index,
        message: "A heading contains an italic or differently coloured word. This is a generic AI tell and weakens the line.",
        evidence: stripJsx(inner).slice(0, 140) || lineText(source, fullHeading.index),
        fix: "Write the whole heading in one voice. Use size, weight or position for emphasis, not a coloured or italic word.",
      });
    }
  }

  // All-caps labels and eyebrow overuse.
  for (const classes of classNameStrings(source)) {
    const caps = classes.match(/\buppercase\b/g);
    if (caps) metrics.uppercaseLabels += caps.length;
  }
  if (metrics.uppercaseLabels > 0) {
    addFinding({
      rule: "Reserve uppercase for meaning",
      severity: "warning",
      category: "typography",
      message: `Uppercase styling appears ${metrics.uppercaseLabels} time(s). All-caps micro-labels flatten hierarchy and add noise.`,
      evidence: `${metrics.uppercaseLabels} uppercase utility occurrences`,
      fix: "Use sentence case. Keep uppercase only for acronyms, data or one semantic label.",
    });
  }

  const eyebrowPattern = /<(p|span|div)\b[^>]*className\s*=\s*["'][^"']*\buppercase\b[^"']*["'][^>]*>/g;
  let eyebrowMatch: RegExpExecArray | null;
  while ((eyebrowMatch = eyebrowPattern.exec(source))) {
    metrics.eyebrows += 1;
  }
  if (metrics.eyebrows > 0) {
    addFinding({
      rule: "Eyebrows must carry information",
      severity: metrics.eyebrows > 2 ? "error" : "warning",
      category: "typography",
      message: `Found ${metrics.eyebrows} uppercase eyebrow-like label(s). Do not place a decorative eyebrow above every heading.`,
      evidence: `${metrics.eyebrows} candidate eyebrow labels`,
      fix: "Remove the eyebrow unless it carries information the heading does not. Never use one above every section.",
    });
  }

  // Raw colours and non-token palette utilities.
  const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;
  let hexMatch: RegExpExecArray | null;
  const hexes: string[] = [];
  while ((hexMatch = hexPattern.exec(source))) {
    metrics.rawHexColors += 1;
    if (hexes.length < 4) hexes.push(hexMatch[0]);
  }
  if (metrics.rawHexColors > 0) {
    addFinding({
      rule: "Use semantic colour tokens",
      severity: "error",
      category: "tokens",
      message: `Found ${metrics.rawHexColors} raw hex colour(s): ${hexes.join(", ")}. Composition code should use named tokens.`,
      evidence: hexes.join(", "),
      fix: "Replace raw hex with semantic token utilities (bg-background, text-foreground, bg-brand) or add a named token first.",
    });
  }

  const paletteMatches = [...source.matchAll(PALETTE_CLASS)];
  metrics.paletteClasses = paletteMatches.length;
  if (metrics.paletteClasses > 0) {
    const examples = unique(paletteMatches.map((match) => match[0])).slice(0, 6);
    addFinding({
      rule: "Use design-system palette tokens",
      severity: "warning",
      category: "tokens",
      message: `Found ${metrics.paletteClasses} default palette utility class(es): ${examples.join(", ")}. These bypass the design system.`,
      evidence: examples.join(", "),
      fix: "Use semantic tokens such as bg-brand, text-muted-foreground, border-border or add a named token.",
    });
  }

  // Arbitrary values, inline styles and specificity.
  const classStrings = classNameStrings(source);
  const arbitrary = classStrings.flatMap((classes) => classes.match(/\[[^\]\n]+\]/g) ?? []);
  metrics.arbitraryValues = arbitrary.length;
  if (metrics.arbitraryValues > 2) {
    addFinding({
      rule: "Prefer tokens over arbitrary values",
      severity: "info",
      category: "tokens",
      message: `Found ${metrics.arbitraryValues} arbitrary value(s) in class names. Some are legitimate, but repeated one-off values signal a missing token.`,
      evidence: unique(arbitrary).slice(0, 5).join(", "),
      fix: "Move repeated sizes, colours or spacing into the token layer.",
    });
  }

  const inlinePattern = /style\s*=\s*(?:\{\{([\s\S]*?)\}\}|["']([^"']*)["'])/g;
  let inlineMatch: RegExpExecArray | null;
  while ((inlineMatch = inlinePattern.exec(source))) {
    metrics.inlineStyles += 1;
    const body = inlineMatch[1] ?? inlineMatch[2] ?? "";
    if (/(?:color|background|padding|margin|font|width|height|gap|border|shadow)/i.test(body)) {
      addFinding({
        rule: "Avoid visual inline styles",
        severity: "warning",
        category: "specificity",
        index: inlineMatch.index,
        message: "An inline style sets visual properties, bypassing tokens and making overrides harder.",
        evidence: lineText(source, inlineMatch.index),
        fix: "Use token utilities or a component variant. Keep inline styles for dynamic values that cannot be expressed as classes.",
      });
    }
  }

  const classImportant = classStrings.flatMap((classes) =>
    classes.match(/(?:^|\s)!(?:text|bg|border|p[trblxy]?|m[trblxy]?|w|h|flex|grid|absolute|relative|rounded|shadow|font|leading|tracking|opacity|z|top|left|right|bottom|inset|gap|space|items|justify|self|overflow|transition|duration|ease|animate)\S*/g) ?? [],
  );
  const importantCount =
    (source.match(/!important\b/g)?.length ?? 0) + classImportant.length;
  metrics.importantRules = importantCount;
  if (importantCount > 0) {
    addFinding({
      rule: "Avoid !important",
      severity: "error",
      category: "specificity",
      message: `Found ${importantCount} !important or forced utility rule(s). Forcing specificity makes the system brittle.`,
      evidence: unique(classImportant).slice(0, 4).join(", ") || "!important",
      fix: "Remove the override. Fix the component variant or the token relationship instead of forcing specificity.",
    });
  }

  // Conflicting utilities in one className.
  for (const classes of classStrings) {
    const tokens = classes.split(/\s+/).filter(Boolean);
    const groups = new Map<string, Set<string>>();
    for (const token of tokens) {
      let group: string | null = null;
      if (/^(?:p|m)[trblxy]?-\S+$/.test(token)) {
        group = token.split("-")[0] ?? null;
      } else if (/^text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/.test(token)) {
        group = "text-size";
      } else if (/^rounded(?:-\S+)?$/.test(token)) {
        group = "radius";
      } else if (/^font-(?:thin|light|normal|medium|semibold|bold|extrabold|black)$/.test(token)) {
        group = "font-weight";
      } else if (/^(?:w|h|gap|leading|tracking)-\S+$/.test(token)) {
        group = token.split("-")[0] ?? null;
      } else if (/^bg-\S+$/.test(token)) {
        group = "background";
      }
      if (!group) continue;
      const values = groups.get(group) ?? new Set<string>();
      values.add(token);
      groups.set(group, values);
    }
    for (const [group, values] of groups) {
      if (values.size > 1) {
        addFinding({
          rule: "Avoid conflicting utility classes",
          severity: "warning",
          category: "specificity",
          message: `The same element sets multiple ${group} utilities: ${[...values].join(", ")}. The result depends on CSS order.`,
          evidence: [...values].join(", "),
          fix: "Keep one value per property group. Use responsive or state variants instead of stacking conflicts.",
        });
      }
    }
  }

  // Generic visual defaults.
  const gradientMatches = [...source.matchAll(/\b(?:bg-gradient-to-\w+|bg-linear-to-\w+|from-\S+|via-\S+|to-\S+)\b/g)];
  if (gradientMatches.length > 0) {
    addFinding({
      rule: "Gradients need a subject reason",
      severity: "warning",
      category: "visual-default",
      message: "A background gradient is present. Gradients are a common generic default and should be justified by the subject.",
      evidence: unique(gradientMatches.map((match) => match[0])).slice(0, 5).join(", "),
      fix: "Remove the gradient unless it represents something specific. Use a solid token, image or typographic hierarchy instead.",
    });
  }

  const glassMatches = [...source.matchAll(/\b(?:backdrop-blur-\S+|bg-(?:white|black|card)\/\d+|bg-white\/\d+|bg-black\/\d+)\b/g)];
  metrics.glassmorphism = glassMatches.length;
  if (metrics.glassmorphism > 0) {
    addFinding({
      rule: "Avoid glassmorphism by default",
      severity: "warning",
      category: "visual-default",
      message: "Translucent or blurred panels reduce legibility and date quickly.",
      evidence: unique(glassMatches.map((match) => match[0])).slice(0, 5).join(", "),
      fix: "Use an opaque surface token. Keep blur only when it carries a real layering meaning.",
    });
  }

  const gradientText =
    source.includes("bg-clip-text") && source.includes("text-transparent");
  if (gradientText) {
    metrics.gradientText = 1;
    addFinding({
      rule: "No gradient text",
      severity: "error",
      category: "visual-default",
      message: "Gradient text substitutes effect for hierarchy and can fail contrast.",
      evidence: "bg-clip-text with text-transparent",
      fix: "Set the text in a solid token colour and use type size or weight for hierarchy.",
    });
  }

  // Repeated card treatment.
  for (const classes of classStrings) {
    if (/\brounded-/.test(classes) && /\bborder\b/.test(classes)) {
      metrics.cardLikeBlocks += 1;
    }
  }
  if (metrics.cardLikeBlocks >= 3) {
    addFinding({
      rule: "Avoid a uniform card grid",
      severity: "warning",
      category: "visual-default",
      message: `Found ${metrics.cardLikeBlocks} rounded, bordered blocks. A repeated card treatment is the default AI layout.`,
      evidence: `${metrics.cardLikeBlocks} rounded bordered blocks`,
      fix: "Ask whether a table, ledger, split, timeline or asymmetric grid would express the content better.",
    });
  }

  // Motion.
  const motionMatches = [...source.matchAll(/\b(?:animate-\S+|transition-\S+|duration-\d+|motion-\S+|@keyframes\b)/g)];
  metrics.animatedElements = motionMatches.length;
  if (metrics.animatedElements > 0) {
    const hasReduced =
      source.includes("motion-reduce:") ||
      source.includes("prefers-reduced-motion") ||
      source.includes("useReducedMotion");
    if (!hasReduced) {
      addFinding({
        rule: "Motion needs a reduced-motion path",
        severity: "warning",
        category: "motion",
        message: "Animation or transition utilities are present, but there is no reduced-motion alternative.",
        evidence: unique(motionMatches.map((match) => match[0])).slice(0, 5).join(", "),
        fix: "Add a motion-reduce variant or a prefers-reduced-motion block that removes non-essential motion.",
      });
    }
  }

  // Focus-visible states on interactive elements.
  const interactiveCount = (source.match(/<(button|a|input|select|textarea)\b/gi) || []).length;
  const hasFocusVisible =
    /focus-visible|focus:ring|focus:outline|outline-none.*focus|focus:shadow/.test(source);
  if (interactiveCount > 0 && !hasFocusVisible) {
    addFinding({
      rule: "Interactive elements need focus-visible styles",
      severity: "warning",
      category: "accessibility",
      index: 0,
      message: "Interactive elements are present but no focus-visible or focus-ring styling was found. Keyboard users cannot see focus.",
      fix: "Add focus-visible:outline or focus-visible:ring utilities to buttons, links and inputs.",
    });
  }

  const hoverMotion = [...source.matchAll(/\b(?:hover|group-hover):(?:scale-\S+|translate-[xy]-\S+|shadow-\S+|rotate-\S+)\b/g)];
  metrics.uniformHoverMotion = hoverMotion.length;
  if (metrics.uniformHoverMotion > 0) {
    addFinding({
      rule: "Reserve motion for state changes",
      severity: "warning",
      category: "motion",
      message: "Hover scale, lift or shadow is applied to elements. Uniform hover motion creates constant low-value movement.",
      evidence: unique(hoverMotion.map((match) => match[0])).slice(0, 5).join(", "),
      fix: "Remove hover lift and scale. Use one orchestrated load sequence or a transition that communicates a real state change.",
    });
  }

  // Copy.
  const copyMatches = [...source.matchAll(GENERIC_CTA)];
  metrics.genericCtas = copyMatches.length;
  if (metrics.genericCtas > 0) {
    addFinding({
      rule: "CTAs should name the action",
      severity: "warning",
      category: "copy",
      message: `Found ${metrics.genericCtas} generic CTA label(s). Submit, Learn more and Get started do not say what happens next.`,
      evidence: unique(copyMatches.map((match) => match[1] ?? match[0])).slice(0, 5).join(", "),
      fix: "Replace with the next state: Save changes, Create workspace, Review transfers, Book a walkthrough.",
    });
  }

  const proofMatches = [...source.matchAll(UNVERIFIED_METRIC)];
  metrics.unverifiedMetrics = proofMatches.length;
  if (metrics.unverifiedMetrics > 0) {
    addFinding({
      rule: "Do not ship unverified proof",
      severity: "warning",
      category: "copy",
      message: `Found ${metrics.unverifiedMetrics} unverified metric or proof pattern(s). These must be real, sourced or visibly labelled as placeholders.`,
      evidence: unique(proofMatches.map((match) => match[0])).slice(0, 5).join(", "),
      fix: "Use a real, sourced value; a labelled placeholder; or omit the claim entirely.",
    });
  }

  const counts: Record<Severity, number> = {
    error: findings.filter((finding) => finding.severity === "error").length,
    warning: findings.filter((finding) => finding.severity === "warning").length,
    info: findings.filter((finding) => finding.severity === "info").length,
  };
  const score = Math.max(0, 100 - counts.error * 12 - counts.warning * 5 - counts.info * 1);
  const verdict: ValidationReport["verdict"] =
    counts.error > 0 || score < 70 ? "fail" : counts.warning > 0 || score < 90 ? "warn" : "pass";

  const passes: string[] = [];
  if (metrics.images === 0 || metrics.imagesMissingAlt === 0) {
    passes.push("Images have alt attributes or none are present.");
  }
  if (metrics.inputs === 0 || metrics.inputsWithoutLabel === 0) {
    passes.push("Form controls have visible labels or accessible names.");
  }
  if (metrics.buttons === 0 || metrics.buttonsWithoutLabel === 0) {
    passes.push("Buttons have readable text or accessible names.");
  }
  if (metrics.headingSkips === 0 && metrics.multipleH1 <= 1) {
    passes.push("Heading order is sequential with at most one h1.");
  }
  if (metrics.rawHexColors === 0) passes.push("No raw hex colours; the snippet stays on tokens.");
  if (metrics.importantRules === 0) passes.push("No !important or forced utility overrides.");
  if (metrics.headlineAccents === 0) passes.push("No italic or coloured word inside a heading.");
  if (metrics.uppercaseLabels === 0) passes.push("No all-caps label noise.");
  if (metrics.cardLikeBlocks < 3) passes.push("No repeated rounded-card treatment.");
  if (metrics.uniformHoverMotion === 0) passes.push("No uniform hover lift or scale.");
  if (metrics.gradientText === 0) passes.push("No gradient text.");
  if (metrics.genericCtas === 0) passes.push("CTA copy names an action.");
  if (metrics.unverifiedMetrics === 0) passes.push("No obvious unverified proof patterns.");

  const fixes = unique(
    findings
      .filter((finding) => finding.severity !== "info")
      .map((finding) => finding.fix),
  ).slice(0, 5);
  if (fixes.length === 0) {
    fixes.push("No blocking issues found. Review hierarchy, subject fit and content truthfulness manually.");
  }

  return {
    summary: `${verdict.toUpperCase()}: ${counts.error} error(s), ${counts.warning} warning(s), ${counts.info} info. ${passes.length} checks passed.`,
    verdict,
    score,
    code: {
      lines: metrics.lines,
      characters: source.length,
      fileName: options.fileName,
    },
    findings,
    counts,
    metrics,
    passes,
    topFixes: fixes,
  };
}

export function validationMarkdown(report: ValidationReport): string {
  const findingLines = report.findings.length
    ? report.findings.map(
        (finding) =>
          `- **${finding.severity.toUpperCase()}** · ${finding.rule} (line ${finding.line})\n  ${finding.message}\n  Fix: ${finding.fix}`,
      )
    : ["- No findings."];

  return [
    `# UI validation: ${report.verdict.toUpperCase()} (${report.score}/100)`,
    "",
    report.summary,
    "",
    "## Top fixes",
    "",
    ...report.topFixes.map((fix) => `- ${fix}`),
    "",
    "## Findings",
    "",
    ...findingLines,
    "",
    "## Passed checks",
    "",
    ...(report.passes.length ? report.passes.map((pass) => `- ${pass}`) : ["- None yet."]),
  ].join("\n");
}
