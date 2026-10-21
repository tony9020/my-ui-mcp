import fs from "node:fs";
import path from "node:path";
import { GLOBALS_CSS, relativeToRoot } from "./paths";
import type {
  AnimationToken,
  ColorToken,
  DesignTokens,
  RadiusToken,
  ShadowToken,
  SpacingStep,
  TokenType,
  TypeScaleStep,
} from "./types";

/* ------------------------------------------------------------------ parsing */

function extractBlock(css: string, selector: string): string {
  const start = css.indexOf(selector);
  if (start < 0) return "";
  const open = css.indexOf("{", start + selector.length);
  if (open < 0) return "";
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    const ch = css[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  return css.slice(open + 1);
}

function parseVars(block: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const re = /--([\w-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(block))) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
}

function isColorValue(value: string): boolean {
  return /^(#|rgb|hsl|oklch|oklab|color-mix\(|var\(--)/i.test(value.trim());
}

function hexToRgb(hex: string): [number, number, number] | null {
  let value = hex.trim();
  if (value.startsWith("#")) value = value.slice(1);
  if (value.length === 3) {
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (value.length === 8) value = value.slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(value)) return null;
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function luminance([r, g, b]: [number, number, number]): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number | null {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);
  if (!rgbA || !rgbB) return null;
  const l1 = luminance(rgbA);
  const l2 = luminance(rgbB);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100;
}

function remToPx(value: string): number | null {
  const match = value.match(/(-?\d+(?:\.\d+)?)\s*rem/);
  if (!match) return null;
  return Math.round(Number.parseFloat(match[1]) * 16 * 100) / 100;
}

function evaluateRadius(expr: string, base: string): string {
  const basePx = remToPx(base) ?? 12;
  if (expr.includes("var(--radius)")) {
    const delta = expr.match(/([+-])\s*(\d+(?:\.\d+)?)\s*(px|rem)/);
    if (delta) {
      const amount = Number.parseFloat(delta[2]) * (delta[3] === "rem" ? 16 : 1);
      const px = delta[1] === "+" ? basePx + amount : basePx - amount;
      return `${Math.max(0, px)}px`;
    }
    return `${basePx}px`;
  }
  const px = remToPx(expr);
  if (px != null) return `${px}px`;
  return expr.trim();
}

function parseDuration(value: string): string | null {
  const match = value.match(/(\d+(?:\.\d+)?)(ms|s)\b/);
  return match ? `${match[1]}${match[2]}` : null;
}

function parseEasing(value: string): string | null {
  const match = value.match(
    /(cubic-bezier\([^)]*\)|steps\([^)]*\)|linear|ease-in-out|ease-out|ease-in|ease)/,
  );
  return match ? match[1] : null;
}

/* ------------------------------------------------------------------- tokens */

const TYPE_SCALE: TypeScaleStep[] = [
  {
    token: "display",
    size: "clamp(40px, 6.2vw, 64px)",
    lineHeight: "1.06",
    tracking: "-0.022em",
    weight: "500",
    use: "One per page. The single largest statement of the product's job.",
  },
  {
    token: "h1",
    size: "clamp(32px, 4.4vw, 44px)",
    lineHeight: "1.12",
    tracking: "-0.02em",
    weight: "500",
    use: "Page title. Sentence case, no italic accent inside the line.",
  },
  {
    token: "h2",
    size: "clamp(28px, 3.8vw, 44px)",
    lineHeight: "1.12",
    tracking: "-0.02em",
    weight: "500",
    use: "Section title. Must state the section's job, not a generic label.",
  },
  {
    token: "h3",
    size: "22px",
    lineHeight: "1.25",
    tracking: "-0.01em",
    weight: "500",
    use: "Subsection or card title. Keep it specific.",
  },
  {
    token: "body-lg",
    size: "19px",
    lineHeight: "1.6",
    tracking: "0",
    weight: "400",
    use: "Lead paragraph, one per section at most.",
  },
  {
    token: "body",
    size: "15px",
    lineHeight: "1.6",
    tracking: "0",
    weight: "400",
    use: "Default reading size for interface and marketing copy.",
  },
  {
    token: "small",
    size: "13px",
    lineHeight: "1.45",
    tracking: "0",
    weight: "400",
    use: "Metadata, helper text, table cells. Never use it for primary copy.",
  },
  {
    token: "caption",
    size: "11px",
    lineHeight: "1.35",
    tracking: "0.01em",
    weight: "500",
    use: "Sparse labels and data annotations only. Not an eyebrow default.",
  },
];

const SPACING_STEPS = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64];

const SHADOWS: ShadowToken[] = [
  {
    token: "shadow-xs",
    value: "0 1px 2px rgb(23 19 15 / 0.04)",
    use: "Inputs, small controls and hairline separation.",
  },
  {
    token: "shadow-sm",
    value: "0 1px 3px rgb(23 19 15 / 0.06), 0 1px 2px rgb(23 19 15 / 0.04)",
    use: "Raised controls and sticky bars.",
  },
  {
    token: "shadow-md",
    value: "0 4px 12px rgb(23 19 15 / 0.08)",
    use: "Popovers and dropdowns that must separate from the page.",
  },
  {
    token: "shadow-lg",
    value: "0 12px 32px rgb(23 19 15 / 0.10)",
    use: "Modals and sheets only. Not every card.",
  },
  {
    token: "shadow-focus",
    value: "0 0 0 3px color-mix(in oklab, var(--ring) 25%, transparent)",
    use: "Focus ring companion. Pair with a visible outline.",
  },
];

export function buildDesignTokens(cssFile = GLOBALS_CSS): DesignTokens {
  const css = fs.readFileSync(cssFile, "utf8");
  const rootBlock = extractBlock(css, ":root");
  const darkBlock = extractBlock(css, ".dark");
  const themeBlock = extractBlock(css, "@theme inline");
  const rootVars = parseVars(rootBlock);
  const darkVars = parseVars(darkBlock);
  const themeVars = parseVars(themeBlock);

  /* ------------------------------------------------------------------ colors */
  const colorKeys = Object.keys(rootVars).filter((key) => {
    if (
      key.startsWith("font") ||
      key.startsWith("radius") ||
      key.startsWith("animate") ||
      key === "spacing"
    ) {
      return false;
    }
    return isColorValue(rootVars[key]);
  });

  const colorTokens: ColorToken[] = colorKeys.map((key) => {
    const light = rootVars[key];
    const dark = darkVars[key] ?? light;
    const tailwindVar = themeVars[`color-${key}`] ? `--color-${key}` : null;
    const utilities = [`bg-${key}`, `text-${key}`, `border-${key}`];
    return {
      name: key,
      cssVar: `--${key}`,
      light,
      dark,
      tailwindVar,
      utilities,
    };
  });

  const pairDefs: { foreground: string; background: string }[] = [
    { foreground: "foreground", background: "background" },
    { foreground: "card-foreground", background: "card" },
    { foreground: "popover-foreground", background: "popover" },
    { foreground: "primary-foreground", background: "primary" },
    { foreground: "secondary-foreground", background: "secondary" },
    { foreground: "muted-foreground", background: "background" },
    { foreground: "brand-foreground", background: "brand" },
    { foreground: "destructive-foreground", background: "destructive" },
    { foreground: "lp-fg", background: "lp-bg" },
    { foreground: "lp-muted", background: "lp-bg" },
  ];

  const contrastPairs = pairDefs
    .map(({ foreground, background }) => {
      const light = contrastRatio(rootVars[foreground] ?? "", rootVars[background] ?? "");
      const dark = contrastRatio(darkVars[foreground] ?? rootVars[foreground] ?? "", darkVars[background] ?? rootVars[background] ?? "");
      if (light == null && dark == null) return null;
      return {
        foreground,
        background,
        light: light ?? 0,
        dark: dark ?? 0,
        lightAA: (light ?? 0) >= 4.5,
        darkAA: (dark ?? 0) >= 4.5,
      };
    })
    .filter(Boolean) as DesignTokens["colors"]["contrastPairs"];

  for (const token of colorTokens) {
    const pairs: NonNullable<ColorToken["contrast"]> = [];
    for (const pair of contrastPairs) {
      if (pair.foreground === token.name || pair.background === token.name) {
        const against = pair.foreground === token.name ? pair.background : pair.foreground;
        const ratio =
          pair.foreground === token.name
            ? contrastRatio(token.light, rootVars[against] ?? "")
            : contrastRatio(rootVars[against] ?? "", token.light);
        if (ratio != null) {
          pairs.push({
            against,
            ratio,
            aaNormal: ratio >= 4.5,
            aaLarge: ratio >= 3,
            aaaNormal: ratio >= 7,
          });
        }
      }
    }
    if (pairs.length) token.contrast = pairs;
  }

  /* -------------------------------------------------------------- typography */
  const cleanFamily = (value: string | undefined) =>
    (value ?? "")
      .split(",")[0]
      .trim()
      .replace(/^["']|["']$/g, "");
  const families = {
    sans: cleanFamily(themeVars["font-sans"]) || "General Sans",
    serif: cleanFamily(themeVars["font-serif"]) || "Averia Serif Libre",
    mono: cleanFamily(themeVars["font-mono"]) || "SF Mono",
  };

  /* ------------------------------------------------------------------ spacing */
  const spacingScale: SpacingStep[] = SPACING_STEPS.map((n) => ({
    token: `space-${n}`,
    rem: `${(n * 0.25).toFixed(2).replace(/\.?0+$/, "")}rem`,
    px: n * 4,
  }));

  /* ------------------------------------------------------------------- radius */
  const baseRadius = rootVars.radius ?? "0.75rem";
  const radiusDefs: { token: string; cssVar: string; expr: string; tailwind: string }[] = [
    { token: "radius-sm", cssVar: "--radius-sm", expr: themeVars["radius-sm"] ?? "calc(var(--radius) - 4px)", tailwind: "rounded-sm" },
    { token: "radius-md", cssVar: "--radius-md", expr: themeVars["radius-md"] ?? "calc(var(--radius) - 2px)", tailwind: "rounded-md" },
    { token: "radius-lg", cssVar: "--radius-lg", expr: themeVars["radius-lg"] ?? "var(--radius)", tailwind: "rounded-lg" },
    { token: "radius-xl", cssVar: "--radius-xl", expr: themeVars["radius-xl"] ?? "calc(var(--radius) + 4px)", tailwind: "rounded-xl" },
    { token: "radius-2xl", cssVar: "--radius-2xl", expr: themeVars["radius-2xl"] ?? "calc(var(--radius) + 8px)", tailwind: "rounded-2xl" },
  ];
  const radiusTokens: RadiusToken[] = [
    { token: "radius-base", cssVar: "--radius", value: evaluateRadius(baseRadius, baseRadius), tailwind: "rounded-lg" },
    ...radiusDefs.map((item) => ({
      token: item.token,
      cssVar: item.cssVar,
      value: evaluateRadius(item.expr, baseRadius),
      tailwind: item.tailwind,
    })),
    { token: "radius-full", cssVar: "—", value: "9999px", tailwind: "rounded-full" },
  ];

  /* --------------------------------------------------------------- animations */
  const keyframes = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
  const animationTokens: AnimationToken[] = Object.keys(themeVars)
    .filter((key) => key.startsWith("animate-"))
    .map((key) => {
      const value = themeVars[key];
      return {
        name: key.replace(/^animate-/, ""),
        value,
        duration: parseDuration(value),
        easing: parseEasing(value),
        keyframes: keyframes.some((k) => value.includes(k)),
        reducedMotion: "motion-reduce:transition-none; global prefers-reduced-motion rule",
      };
    });

  /* --------------------------------------------------------------------- css */
  const cssSnippet = [
    ":root {",
    ...colorKeys.slice(0, 16).map((key) => `  --${key}: ${rootVars[key]};`),
    "}",
    "",
    ".dark {",
    ...colorKeys.slice(0, 8).map((key) => `  --${key}: ${darkVars[key] ?? rootVars[key]};`),
    "}",
  ].join("\n");

  return {
    meta: {
      sourceFile: relativeToRoot(cssFile),
      theme: "light",
      generatedAt: new Date().toISOString(),
      baseRadius,
      spacingBase: "0.25rem / 4px",
    },
    colors: {
      tokens: colorTokens,
      contrastPairs,
      guidance: [
        "Use semantic utilities such as bg-background, text-foreground, border-border and bg-brand. Do not hardcode hex values in composition code.",
        "Iris violet is the single brand accent. Do not add a second saturated accent unless it encodes a real state.",
        "Test muted-foreground against the surface it sits on; it is not a substitute for body copy at small sizes.",
        "Charts use chart-1 through chart-5; keep their order stable across light and dark.",
      ],
    },
    typography: {
      families,
      scale: TYPE_SCALE,
      weights: [
        { value: "400", use: "Body and long-form reading." },
        { value: "500", use: "Display, headings, buttons and emphasis. The house weight." },
        { value: "600", use: "Rare emphasis or dense data labels. Do not stack with size jumps." },
      ],
      guidance: [
        "Use at most two display/body families plus one mono family.",
        "Keep headlines sentence case and free of italic or coloured word accents.",
        "Prefer weight and measured size steps over all-caps or letter-spacing tricks.",
        "Keep body line length around 60–75 characters; use text-pretty or text-balance deliberately.",
      ],
    },
    spacing: {
      base: "0.25rem / 4px",
      scale: spacingScale,
      layout: [
        { token: "container-sm", value: "1200px", use: "Editorial and marketing content." },
        { token: "container-lg", value: "1400px", use: "Marketplace and dense application surfaces." },
        { token: "section-sm", value: "48px", use: "Dense application sections." },
        { token: "section", value: "80px", use: "Default marketing section rhythm." },
        { token: "section-lg", value: "96px", use: "One or two high-impact sections only." },
        { token: "gutter", value: "16px / 24px", use: "Page gutter at mobile / desktop." },
      ],
      guidance: [
        "Use the 4px scale. Avoid arbitrary margins and paddings that break the rhythm.",
        "Vary section rhythm; do not apply py-24 to every section.",
        "Use gap and divide utilities before adding borders or wrappers.",
      ],
    },
    radius: {
      tokens: radiusTokens,
      guidance: [
        "Pills are for actions and status chips; cards use radius-lg or radius-xl.",
        "Nested radii should be outer radius minus the inner padding; do not nest a 2xl card inside a 2xl panel.",
        "Do not mix square and pill containers in the same hierarchy without a semantic reason.",
      ],
    },
    shadows: {
      tokens: SHADOWS,
      guidance: [
        "Prefer a border and surface change over a shadow. Shadows imply elevation or overlay.",
        "Use shadow-lg only for modals, sheets and popovers.",
        "No neon glows or coloured drop shadows except the documented focus ring.",
      ],
    },
    animations: {
      tokens: animationTokens,
      keyframes,
      guidance: [
        "Use one orchestrated load sequence, not hover/fade/scale on every card.",
        "Animate state changes that communicate something; remove decorative loops.",
        "Always provide motion-reduce and respect prefers-reduced-motion.",
        "Animate the properties that change; avoid transition-all.",
      ],
    },
    css: {
      root: `:root {\n${rootBlock.trim()}\n}`,
      dark: `.dark {\n${darkBlock.trim()}\n}`,
      theme: `@theme inline {\n${themeBlock.trim()}\n}`,
      snippet: cssSnippet,
    },
  };
}

export function tokensForType(tokens: DesignTokens, type: TokenType): Record<string, unknown> {
  if (type === "all") {
    return {
      colors: tokens.colors,
      typography: tokens.typography,
      spacing: tokens.spacing,
      radius: tokens.radius,
      shadows: tokens.shadows,
      animations: tokens.animations,
    };
  }
  return { [type]: tokens[type] };
}

export function cssForType(tokens: DesignTokens, type: TokenType): string {
  if (type === "all") return tokens.css.snippet;
  if (type === "colors") return tokens.css.snippet;
  if (type === "radius") {
    return tokens.radius.tokens.map((t) => `${t.cssVar}: ${t.value}; /* ${t.token} */`).join("\n");
  }
  if (type === "shadows") {
    return tokens.shadows.tokens.map((t) => `${t.token}: ${t.value};`).join("\n");
  }
  if (type === "animations") {
    return tokens.animations.tokens.map((t) => `--animate-${t.name}: ${t.value};`).join("\n");
  }
  return tokens.css.snippet;
}

export function tokenFileLabel(): string {
  return path.basename(GLOBALS_CSS);
}
