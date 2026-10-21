/**
 * Shared types for the My Ui design-system MCP server.
 *
 * These types are intentionally serialisable so every tool can return a
 * predictable JSON payload alongside its human-readable summary.
 */

export type ComponentKind = "primitive" | "pattern" | "section" | "provider" | "catalogue";

export type ComponentOrigin = "local" | "catalogue";
export type TrustTier = "verified" | "linked" | "reference";
export type LicenseClass =
  | "first-party"
  | "permissive"
  | "weak-copyleft"
  | "strong-copyleft"
  | "restricted"
  | "none"
  | "unknown";

export interface CodeQualitySignals {
  declaredDepsUnused: string[];
  importsResolvable: boolean;
  usesUndefinedKeyframes: boolean;
  demoMatchesComponent: boolean;
  hasReducedMotion: boolean;
  ariaScore: number;
  usesTokens: boolean;
  usesHardcodedColor: boolean;
}

export interface AuthorInfo {
  username: string;
  name: string;
  avatar: string | null;
}

export interface CatalogueStats {
  downloads: number;
  likes: number;
  bookmarks: number;
  views: number;
}

export interface CatalogueMetadata {
  id: string;
  author: AuthorInfo;
  previewUrl: string | null;
  previewLight: string | null;
  previewDark: string | null;
  videoUrl: string | null;
  videoUrlDark: string | null;
  demoCode: string | null;
  sourceUrl: string | null;
  websiteUrl: string | null;
  license: string;
  registry: string;
  stats: CatalogueStats;
  gradient: [string, string] | null;
  updatedAt?: string | null;
  generated: boolean;
  registryRoute: string;
  sourcePage: string;
  installCommand: string;
  sourceNote: string;
}

export interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
  values?: string[];
}

export interface ComponentGuidelines {
  usage: string[];
  accessibility: string[];
  avoid: string[];
}

export interface ComponentDependencies {
  npm: string[];
  internal: string[];
  declared?: string[];
}

export interface ComponentVariants {
  values: string[];
  default?: string;
}

export interface ComponentInfo {
  id: string;
  slug: string;
  name: string;
  exportName: string;
  origin: ComponentOrigin;
  category: string;
  categorySlug: string;
  categories: string[];
  kind: ComponentKind;
  description: string;
  file: string;
  importPath: string;
  lineCount: number;
  code: string;
  exports: string[];
  props: PropInfo[];
  propsType: string | null;
  inheritedProps: string[];
  variants: Record<string, ComponentVariants>;
  dependencies: ComponentDependencies;
  tags: string[];
  usageExamples: string[];
  guidelines: ComponentGuidelines;
  related: string[];
  relatedReasons?: { id: string; score: number; reasons: string[] }[];
  tokensUsed: string[];
  usedIn: number;
  catalogue?: CatalogueMetadata;
  // ---- derived (from src/data/catalogue-derived.json or computed in-process)
  trustTier?: TrustTier;
  licenseClass?: LicenseClass;
  isCanonical?: boolean;
  canonicalId?: string;
  duplicateOf?: string | null;
  alternates?: string[];
  codeQuality?: CodeQualitySignals;
  complianceScore?: number;
  popularityScore?: number;
  heavyDeps?: string[];
  frameworkLock?: "next" | "none";
  codeHash?: string;
  resolvedPreviewUrl?: string | null;
  resolvedPreviewLight?: string | null;
  resolvedPreviewDark?: string | null;
  resolvedVideoUrl?: string | null;
}

export interface ComponentSummary {
  id: string;
  name: string;
  slug: string;
  exportName: string;
  origin: ComponentOrigin;
  category: string;
  categories: string[];
  kind: ComponentKind;
  description: string;
  file: string;
  importPath: string;
  tags: string[];
  propCount: number;
  variants: Record<string, ComponentVariants>;
  usedIn: number;
  author?: AuthorInfo;
  catalogueId?: string;
  license?: string;
  previewUrl?: string | null;
  licenseClass?: LicenseClass;
  trustTier?: TrustTier;
  isCanonical?: boolean;
  alternates?: number;
  complianceScore?: number;
  popularityScore?: number;
  resolvedPreviewUrl?: string | null;
}

export interface ComponentIndexSummary {
  id: string;
  name: string;
  slug: string;
  origin: ComponentOrigin;
  author?: AuthorInfo;
  category: string;
  categories: string[];
  kind: ComponentKind;
  description: string;
  importPath: string;
  propCount: number;
  license?: string;
  catalogueId?: string;
  sourcePage?: string;
}

export interface ComponentIndex {
  root: string;
  indexedAt: string;
  sourceFileCount: number;
  localComponentCount: number;
  catalogueRecordCount: number;
  catalogueSource: string;
  components: ComponentInfo[];
  /** Local component lookup by slug. Catalogue records use byId or byCatalogueKey. */
  bySlug: Map<string, ComponentInfo>;
  /** Unique component ID lookup for every local and catalogue record. */
  byId: Map<string, ComponentInfo>;
  /** `author/slug` lookup for catalogue records. */
  byCatalogueKey: Map<string, ComponentInfo>;
  categories: { slug: string; name: string; count: number }[];
  /** Optional precomputed full-text index (MiniSearch). */
  searchIndex?: unknown;
}

export interface ColorToken {
  name: string;
  cssVar: string;
  light: string;
  dark: string;
  tailwindVar: string | null;
  utilities: string[];
  contrast?: {
    against: string;
    ratio: number;
    aaNormal: boolean;
    aaLarge: boolean;
    aaaNormal: boolean;
  }[];
}

export interface TypeScaleStep {
  token: string;
  size: string;
  lineHeight: string;
  tracking: string;
  weight: string;
  use: string;
}

export interface SpacingStep {
  token: string;
  rem: string;
  px: number;
}

export interface RadiusToken {
  token: string;
  value: string;
  cssVar: string;
  tailwind: string;
}

export interface ShadowToken {
  token: string;
  value: string;
  use: string;
}

export interface AnimationToken {
  name: string;
  value: string;
  duration: string | null;
  easing: string | null;
  keyframes: boolean;
  reducedMotion: string;
}

export interface DesignTokens {
  meta: {
    sourceFile: string;
    theme: "light" | "dark";
    generatedAt: string;
    baseRadius: string;
    spacingBase: string;
  };
  colors: {
    tokens: ColorToken[];
    contrastPairs: {
      foreground: string;
      background: string;
      light: number;
      dark: number;
      lightAA: boolean;
      darkAA: boolean;
    }[];
    guidance: string[];
  };
  typography: {
    families: { sans: string; serif: string; mono: string };
    scale: TypeScaleStep[];
    weights: { value: string; use: string }[];
    guidance: string[];
  };
  spacing: {
    base: string;
    scale: SpacingStep[];
    layout: { token: string; value: string; use: string }[];
    guidance: string[];
  };
  radius: { tokens: RadiusToken[]; guidance: string[] };
  shadows: { tokens: ShadowToken[]; guidance: string[] };
  animations: {
    tokens: AnimationToken[];
    keyframes: string[];
    guidance: string[];
  };
  css: {
    root: string;
    dark: string;
    theme: string;
    snippet: string;
  };
}

export type TokenType =
  | "colors"
  | "typography"
  | "spacing"
  | "radius"
  | "shadows"
  | "animations"
  | "all";

export type Severity = "error" | "warning" | "info";

export interface ValidationFinding {
  id: string;
  rule: string;
  severity: Severity;
  category:
    | "accessibility"
    | "tokens"
    | "specificity"
    | "visual-default"
    | "typography"
    | "motion"
    | "copy"
    | "structure";
  line: number;
  message: string;
  evidence: string;
  fix: string;
}

export interface ValidationMetrics {
  lines: number;
  images: number;
  imagesMissingAlt: number;
  inputs: number;
  inputsWithoutLabel: number;
  buttons: number;
  buttonsWithoutLabel: number;
  clickableNonSemantic: number;
  headingSkips: number;
  multipleH1: number;
  rawHexColors: number;
  paletteClasses: number;
  arbitraryValues: number;
  inlineStyles: number;
  importantRules: number;
  uppercaseLabels: number;
  headlineAccents: number;
  eyebrows: number;
  cardLikeBlocks: number;
  glassmorphism: number;
  gradientText: number;
  animatedElements: number;
  uniformHoverMotion: number;
  genericCtas: number;
  unverifiedMetrics: number;
}

export interface ValidationReport {
  summary: string;
  verdict: "pass" | "warn" | "fail";
  score: number;
  code: {
    lines: number;
    characters: number;
    fileName?: string;
  };
  findings: ValidationFinding[];
  counts: Record<Severity, number>;
  metrics: ValidationMetrics;
  passes: string[];
  topFixes: string[];
}

export interface ComponentHandoff {
  id: string;
  name: string;
  slug: string;
  exportName: string;
  origin: ComponentOrigin;
  category: string;
  description: string;
  sourceFile: string;
  suggestedPath: string;
  importPath: string;
  code: string;
  sourceAvailable: boolean;
  dependencies: ComponentDependencies;
  props: PropInfo[];
  variants: Record<string, ComponentVariants>;
  tokensUsed: string[];
  usageExamples: string[];
  guidelines: ComponentGuidelines;
  copyInstruction: string;
  license?: string;
  author?: AuthorInfo;
  installCommand?: string;
  sourceNote?: string;
  trustTier?: TrustTier;
  licenseClass?: LicenseClass;
  isCanonical?: boolean;
  canonicalId?: string;
  duplicateOf?: string | null;
  alternates?: string[];
  codeQuality?: CodeQualitySignals;
  complianceScore?: number;
  popularityScore?: number;
  heavyDeps?: string[];
  frameworkLock?: "next" | "none";
  resolvedPreviewUrl?: string | null;
}

export interface HandoffBundle {
  brief: {
    requirements: string | null;
    projectContext: string | null;
    requestedComponents: string[];
    resolvedComponents: string[];
    missingComponents: string[];
    selectionSource: "explicit" | "requirements" | "empty";
  };
  workflow: string[];
  components: ComponentHandoff[];
  install: {
    npmDependencies: string[];
    internalDependencies: string[];
    commands: string[];
    steps: string[];
  };
  feedback: {
    questions: string[];
    nextTool: string;
    adaptationOrder: string[];
  };
  styleDecisions: string[];
  replacement: string[];
}

export interface SuggestedComponent {
  id: string;
  name: string;
  slug: string;
  importPath: string;
  role: string;
  why: string;
  propsHint: string;
  requiredProps: string[];
}

export interface SuggestedSection {
  slot: string;
  intent: string;
  layout: string;
  components: SuggestedComponent[];
  copyDirection: string;
  notes: string[];
}

export interface DesignDirection {
  name: string;
  thesis: string;
  palette: { role: string; hex: string; use: string }[];
  typography: { display: string; body: string; mono: string; rationale: string };
  alignment: string;
  motion: string;
  copy: string;
  rejectedDefaults: string[];
}

export interface CombinationPlan {
  brief: {
    useCase: string;
    surfaceType: string;
    inferredJob: string;
    audience: string;
    constraints: string[];
  };
  direction: DesignDirection;
  alternates: { name: string; thesis: string; whenToUse: string }[];
  plan: {
    tokens: { role: string; hex: string; use: string }[];
    typography: { display: string; body: string; mono: string };
    alignment: string;
    wireframe: string;
    motion: string;
    copyRules: string[];
  };
  sections: SuggestedSection[];
  componentSources: ComponentHandoff[];
  review: {
    checks: { rule: string; status: "pass" | "risk"; note: string }[];
    risks: string[];
    accessibility: string[];
    specificity: string[];
  };
  gaps: string[];
  scaffold: string;
  nextSteps: string[];
}
