import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { APP_DIR, CATALOGUE_JSON, COMPONENTS_DIR, ROOT, readJson, relativeToRoot } from "./paths";
import { loadDerived, computeDerivedAll } from "./derived";
import MiniSearch from "minisearch";
import type {
  AuthorInfo,
  CatalogueMetadata,
  ComponentDependencies,
  ComponentGuidelines,
  ComponentHandoff,
  ComponentIndex,
  ComponentIndexSummary,
  ComponentInfo,
  ComponentKind,
  LicenseClass,
  ComponentSummary,
  ComponentVariants,
  PropInfo,
} from "./types";

/* --------------------------------------------------------------- metadata */

const DESCRIPTIONS: Record<string, string> = {
  button:
    "The primary action primitive. Seven visual variants and five sizes, with a house focus ring, active press and disabled treatment.",
  badge:
    "Compact status or metadata label with semantic variants. Use for state, counts and categories, not for long copy.",
  input:
    "Single-line text field with a visible focus ring, placeholder treatment and disabled state.",
  textarea:
    "Multi-line text field for messages, notes and long-form input.",
  kbd:
    "Keyboard key token used inside hints and shortcut menus.",
  skeleton:
    "Loading placeholder that preserves layout while data resolves.",
  separator:
    "Semantic horizontal or vertical divider for grouping content.",
  switch:
    "Labelled on/off control with a real checkbox underneath and keyboard support.",
  dialog:
    "Modal dialog with focus trapping, escape-to-close, scroll lock and a labelled panel.",
  sheet:
    "Edge panel for secondary tasks, filters and mobile navigation.",
  "sheet-header":
    "Header row for a sheet, with an optional accessible close button.",
  dropdown:
    "Trigger-driven menu with outside-click dismissal, escape handling and alignment control.",
  "dropdown-item":
    "Keyboard-accessible menu item with active state and disabled support.",
  "dropdown-label":
    "Small group label for a menu. It carries grouping meaning; do not use it as decoration.",
  "dropdown-separator":
    "Hairline separator between menu groups.",
  select:
    "Compact option picker built on the dropdown primitive, with an accessible trigger and selected state.",
  tabs:
    "Segmented or underline tab set with arrow-key navigation and roving tab index.",
  tooltip:
    "Short contextual hint shown on hover or focus. Not a place for essential instructions.",
  avatar:
    "Author or user image with initials fallback, optional ring and accessible name.",
  "gradient-preview":
    "Deterministic generated artwork used only when a real preview is missing.",
  reveal:
    "One-shot scroll reveal with a reduced-motion path. Use sparingly, not on every card.",
  toaster:
    "Portalled, polite live region for transient success and status messages.",
  logo:
    "My Ui wordmark and link to home.",
  "logo-badge":
    "Compact My Ui monogram for headers and tight spaces.",
  "theme-toggle":
    "Light/dark theme control that respects the active theme provider.",
  "site-header":
    "Marketing site header with navigation, search and account actions.",
  "app-header":
    "Application header for marketplace and workspace surfaces.",
  "app-footer":
    "Application footer with secondary navigation and legal links.",
  "marketplace-shell":
    "Two-column marketplace shell with a persistent category rail and a scrollable content pane.",
  "search-dialog":
    "Command palette for searching components, authors and tags.",
  "category-browser":
    "Paginated category grid with sorting, tag filters, license filters and load-more.",
  "category-sidebar":
    "Grouped category navigation for the marketplace.",
  "discovery-feed":
    "Marketplace discovery surface composed of horizontal rails and a browse-all entry point.",
  "component-card":
    "Component preview card with author, stats and a link to the detail page.",
  "component-list-row":
    "Dense list representation of a component for list views and tables.",
  "section-rail":
    "Horizontal rail of component cards with a section heading and optional view-all link.",
  "sort-bar":
    "Sort, filter and view controls for a component result set.",
  "results-grid":
    "Grid or list renderer for a set of component records, with an empty state.",
  "install-panel":
    "Install instructions and dependency list for a component registry entry.",
  "preview-frame":
    "Preview surface for a recording, screenshot or generated fallback, with device and theme controls.",
  "action-bar":
    "Primary actions for a component: copy prompt, save, remix, CLI and report.",
  "code-viewer":
    "Tabbed, syntax-highlighted source viewer for component, demo and install files.",
  "component-detail":
    "Full component detail view combining preview, code, install and metadata.",
  "creator-profile-view":
    "Creator profile with identity, stats and a component library.",
  "icon-browser":
    "Searchable icon gallery with copy affordances.",
  "theme-grid":
    "Theme preset browser with preview cards and filtering.",
  "pricing-view":
    "Pricing page composition with plan comparison, FAQ and conversion sections.",
  "sign-in-form":
    "Email and password sign-in form with inline validation and social entry points.",
  "landing-hero":
    "Editorial landing hero with rotating serif accent, preview rail and primary conversion actions.",
  "trusted-by":
    "Logo band for verified customers only. Never populate it with invented logos.",
  "authors-band":
    "Creator spotlights with real author identity and component counts.",
  "market-showcase":
    "Asymmetric component showcase grid used to demonstrate the library.",
  "feature-grid":
    "Feature section with icon, title and body. Use only when the items are genuinely parallel.",
  "final-cta":
    "Closing conversion section with a single primary action.",
  "landing-footer":
    "Marketing footer with grouped navigation and legal links.",
  "author-directory":
    "Searchable directory of component authors.",
  "theme-provider":
    "Client-side light/dark theme provider with local storage persistence and system preference.",
};

const GUIDELINES: Record<string, Partial<ComponentGuidelines>> = {
  button: {
    usage: [
      "One primary action per view. Use the brand variant for that action and outline/ghost for secondary actions.",
      "Label with a specific verb and object: 'Save changes', 'Create invoice', 'Invite teammate'.",
      "Use size=icon only when an aria-label is present.",
    ],
    accessibility: [
      "The component renders a real <button> and defaults type to 'button'.",
      "Icon-only buttons must carry an aria-label.",
      "Never remove the focus-visible ring.",
    ],
    avoid: ["Do not use a button as a link. Use an anchor for navigation.", "Do not stack two brand buttons in the same action group."],
  },
  input: {
    usage: [
      "Always pair with a visible label. Placeholder text is not a label.",
      "Use a short helper line for format guidance and a separate error line.",
      "Use the correct type: email, password, search, tel or url.",
    ],
    accessibility: [
      "Connect the label with htmlFor/id, or use aria-label when the design genuinely hides it.",
      "Connect errors with aria-describedby and set aria-invalid.",
    ],
    avoid: ["Do not use placeholder-only forms.", "Do not use an input for a value that should be a select or switch."],
  },
  textarea: {
    usage: ["Use for messages and notes that may exceed one line.", "Set rows to match the expected writing length."],
    accessibility: ["Pair with a visible label and describe the expected content.", "Do not auto-grow into a layout that moves the submit action unpredictably."],
    avoid: ["Do not use for short structured values; use Input or Select."],
  },
  badge: {
    usage: ["Use for state, counts and categories. Keep labels to 1–3 words.", "Use the success variant only when the state is genuinely successful."],
    accessibility: ["Do not encode meaning with colour alone; keep text in the badge.", "If the badge is interactive, use a button and an accessible name."],
    avoid: ["Do not use badges as decoration on every heading."],
  },
  dialog: {
    usage: ["Use for a blocking decision or a focused task that needs the page context behind it.", "Provide a visible title and connect it with aria-labelledby."],
    accessibility: ["Focus is trapped while open; Escape closes; scroll is locked.", "Return focus to the trigger when the dialog closes."],
    avoid: ["Do not nest dialogs.", "Do not use a dialog for long multi-step flows; use a page or sheet."],
  },
  sheet: {
    usage: ["Use for filters, secondary navigation and short tasks on small screens.", "Choose the edge that matches the reading direction and task."],
    accessibility: ["Provide a labelled header and close control.", "Keep the sheet's content in a sensible focus order."],
    avoid: ["Do not use a sheet as a permanent navigation surface on desktop."],
  },
  dropdown: {
    usage: ["Use for a small set of mutually exclusive actions or options.", "Use Select when the trigger displays the current value."],
    accessibility: ["Escape closes; outside click closes; items are keyboard reachable.", "Label the menu with aria-label or a visible label."],
    avoid: ["Do not put more than a short list of items in a dropdown."],
  },
  select: {
    usage: ["Use when the chosen value should remain visible in the trigger.", "Keep options short and parallel."],
    accessibility: ["Always pass an ariaLabel or a visible label.", "Do not rely on the chevron alone to communicate that the control opens a menu."],
    avoid: ["Do not use a select for two options; use a segmented control or switch."],
  },
  tabs: {
    usage: ["Use for parallel views of the same object, not for sequential steps.", "Keep labels short and stable."],
    accessibility: ["Arrow keys move focus; the active tab owns the roving tab index.", "Connect tab panels with aria-controls and aria-labelledby in the consuming page."],
    avoid: ["Do not hide the only primary action inside a tab."],
  },
  switch: {
    usage: ["Use for a setting that takes effect immediately.", "Write the label as the state being controlled: 'Email notifications'."],
    accessibility: ["The underlying input is a real checkbox with role=switch and aria-checked.", "Do not use a switch for a choice that requires a save step unless the save is explicit."],
    avoid: ["Do not use a switch for destructive actions."],
  },
  tooltip: {
    usage: ["Use for a short hint about an unfamiliar icon or control.", "Keep the content under one sentence."],
    accessibility: ["Tooltips appear on hover and focus.", "Do not put essential instructions or interactive content in a tooltip."],
    avoid: ["Do not use a tooltip as a label substitute."],
  },
  avatar: {
    usage: ["Use with a real author or user name.", "The initials fallback is intentional; do not replace it with a generic silhouette."],
    accessibility: ["The name is exposed to assistive technology; the image itself is decorative.", "Keep the ring only when it communicates selection or presence."],
    avoid: ["Do not use avatars as the only way to identify a person."],
  },
  reveal: {
    usage: ["Use once per section or for one orchestrated load sequence.", "Do not wrap every card in a separate reveal."],
    accessibility: ["The component honours motion-reduce; keep that path.", "Do not hide content permanently if JavaScript fails."],
    avoid: ["Do not use scroll reveal for content above the fold."],
  },
  toaster: {
    usage: ["Use for transient confirmations and non-blocking errors.", "Keep titles short and describe the outcome."],
    accessibility: ["The live region is polite; do not use a toast for critical errors that need action.", "Do not auto-dismiss an error the user must act on."],
    avoid: ["Do not stack more than three toasts."],
  },
  "landing-hero": {
    usage: ["Use once at the top of a marketing page.", "Replace the rotating word with one specific to the subject; do not keep it generic."],
    accessibility: ["The rotating word must not cause layout shift or distract from the h1.", "Keep the primary action keyboard reachable and visible."],
    avoid: ["Do not add an eyebrow above the h1.", "Do not italicise or colour one word in the headline; the rotating accent is a deliberate, single exception in this component and should be evaluated for the brief."],
  },
  "feature-grid": {
    usage: ["Use only when the features are genuinely parallel.", "Vary the layout if one feature is the primary differentiator."],
    accessibility: ["Keep heading order correct; cards should not introduce h3 before an h2."],
    avoid: ["Do not make every feature a rounded card with an icon, title and two lines of copy."],
  },
  "component-card": {
    usage: ["Use for discrete, comparable components in a catalogue.", "Show a real preview; use the generated artwork only when no preview exists."],
    accessibility: ["The card link needs an accessible name that includes the component name.", "Do not rely on hover to reveal essential actions."],
    avoid: ["Do not use a card grid as the default layout for every page."],
  },
  "section-rail": {
    usage: ["Use for browsing a set of related items without leaving the page.", "Keep rails to one or two per page."],
    accessibility: ["Make the rail keyboard scrollable and label the section heading.", "Do not hide content beyond the rail without a visible affordance."],
    avoid: ["Do not use a rail for a single item."],
  },
  "pricing-view": {
    usage: ["Use real prices or clearly labelled placeholders.", "Make the plan difference legible in one scan."],
    accessibility: ["Plan comparison must remain readable as a table on small screens.", "Do not encode the recommended plan with colour alone."],
    avoid: ["Do not invent customer counts, discounts or testimonials."],
  },
  "sign-in-form": {
    usage: ["Use one primary path and make the alternative path secondary.", "Show errors next to the field that caused them."],
    accessibility: ["Labels must remain visible; do not use placeholder-only fields.", "Announce form-level errors in a live region."],
    avoid: ["Do not use a generic 'Submit' CTA; use 'Sign in' or the specific action."],
  },
  "component-detail": {
    usage: ["Keep preview, code, install and metadata in one reading order.", "Never show a preview state that does not exist."],
    accessibility: ["Tabs must connect to their panels.", "The preview controls need accessible names."],
    avoid: ["Do not fabricate usage metrics or code that does not match the preview."],
  },
  "preview-frame": {
    usage: ["Use the real recording or screenshot first; use generated artwork only as a last resort.", "Keep device and theme controls visible."],
    accessibility: ["Every control has an aria-label.", "Alt text names the component; decorative fallback art is hidden."],
    avoid: ["Do not label a generated fallback as a live preview."],
  },
  "search-dialog": {
    usage: ["Use for fast navigation across a large catalogue.", "Show recent and suggested results before a query."],
    accessibility: ["Command palette must trap focus, close on Escape and announce result counts.", "Keep the input labelled."],
    avoid: ["Do not make search the only way to browse."],
  },
  "marketplace-shell": {
    usage: ["Use for catalogue and admin surfaces with a persistent navigation rail.", "Collapse the rail before the content becomes cramped."],
    accessibility: ["Provide a skip link to the content pane.", "Mark the current navigation item with aria-current."],
    avoid: ["Do not nest a second sidebar inside the shell."],
  },
};

const CATEGORY_INFO: Record<string, { name: string; kind: ComponentKind }> = {
  ui: { name: "Primitives", kind: "primitive" },
  landing: { name: "Landing sections", kind: "section" },
  marketplace: { name: "Marketplace patterns", kind: "pattern" },
  layout: { name: "App layout", kind: "pattern" },
  detail: { name: "Component detail", kind: "pattern" },
  auth: { name: "Authentication", kind: "pattern" },
  profile: { name: "Creator profile", kind: "pattern" },
  themes: { name: "Themes", kind: "pattern" },
  pricing: { name: "Pricing", kind: "section" },
  authors: { name: "Authors", kind: "pattern" },
  icons: { name: "Icons", kind: "pattern" },
  providers: { name: "Providers", kind: "provider" },
};

const KIND_GUIDANCE: Record<ComponentKind, ComponentGuidelines> = {
  primitive: {
    usage: [
      "Use as a building block inside a section or pattern; do not promote a primitive to a whole page.",
      "Keep the public variants; compose with className instead of forking the primitive.",
    ],
    accessibility: ["Preserve focus-visible styles, semantic elements and disabled states.", "Test the component with keyboard and a screen reader in context."],
    avoid: ["Do not use raw hex values or arbitrary spacing when a semantic token exists."],
  },
  pattern: {
    usage: [
      "Use when the surface has the job this pattern was designed for; adapt copy and data rather than the structure.",
      "Check the surrounding reading order before adding another pattern to the page.",
    ],
    accessibility: ["Keep landmarks, labels and focus order intact when composing.", "Do not hide essential actions behind hover."],
    avoid: ["Do not repeat the same pattern until the page becomes a uniform card grid."],
  },
  section: {
    usage: [
      "Use once per page unless the brief genuinely has two parallel sections.",
      "Replace sample content with specific subject copy; keep labelled placeholders labelled.",
    ],
    accessibility: ["Keep a single h1 on the page and do not skip heading levels inside the section.", "Provide alt text for real imagery and mark decorative art as hidden."],
    avoid: ["Do not add an eyebrow unless it carries information the heading does not.", "Do not fabricate logos, testimonials or metrics to fill the section."],
  },
  provider: {
    usage: ["Wrap the application once at the root.", "Keep provider order stable; theme depends on the document class."],
    accessibility: ["Respect the user's reduced-motion and colour-scheme preferences.", "Do not trap focus in a provider."],
    avoid: ["Do not mount a second provider tree inside a page."],
  },
  catalogue: {
    usage: [
      "Treat the catalogue record as a starting point: verify the licence, dependency set and implementation before production use.",
      "Read the demo snippet against the component source rather than assuming the metadata describes the current API.",
      "Prefer a verified local component when it covers the same role.",
    ],
    accessibility: [
      "Render the component and verify labels, keyboard order, focus visibility and contrast before shipping it.",
      "Do not assume the catalogue record already handles reduced motion, form errors or screen-reader announcements.",
    ],
    avoid: [
      "Do not present catalogue work as original work or remove licence and attribution requirements.",
      "Do not copy demo content, screenshots or branding into a product without permission.",
    ],
  },
};

const CATEGORY_GUIDANCE: Record<string, Partial<ComponentGuidelines>> = {
  marketplace: {
    usage: ["Use for catalogue surfaces where items are discrete and comparable.", "Give the page one clear browse path and one clear detail path."],
    avoid: ["Do not make every surface a card grid; use list rows for dense comparison."],
  },
  detail: {
    usage: ["Pair real preview media with real source. If implementation is reconstructed, say so." ],
    avoid: ["Do not show a preview state that does not exist."],
  },
  auth: {
    usage: ["Keep one primary path; make recovery and alternate providers secondary."],
    accessibility: ["Keep labels visible and errors next to the field."],
  },
  landing: {
    usage: ["Vary section rhythm and structure; a landing page is a sequence, not a stack of identical bands."],
    avoid: ["Do not put an eyebrow above every section."],
  },
  pricing: {
    usage: ["Show real prices or labelled placeholders; make the plan difference scannable."],
    avoid: ["Do not invent discounts, customer counts or logos."],
  },
  layout: {
    usage: ["Keep the shell stable across routes; change the content, not the navigation model."],
    accessibility: ["Provide a skip link, clear landmarks and aria-current on navigation."],
  },
};

const TAG_KEYWORDS: { pattern: RegExp; tags: string[] }[] = [
  { pattern: /<button|Button|onClick/, tags: ["action", "interactive"] },
  { pattern: /Input|Textarea|Select|Switch|form|label/i, tags: ["form", "input"] },
  { pattern: /Dialog|Sheet|Dropdown|Tooltip|popover/i, tags: ["overlay", "menu"] },
  { pattern: /nav|header|footer|sidebar|Tabs/i, tags: ["navigation", "layout"] },
  { pattern: /Avatar|img|image|GradientPreview|media/i, tags: ["media", "image"] },
  { pattern: /Toast|Badge|Skeleton|alert|status/i, tags: ["feedback", "status"] },
  { pattern: /Pricing|plan|billing/i, tags: ["pricing", "commerce"] },
  { pattern: /SignIn|auth|password|email/i, tags: ["auth", "form"] },
  { pattern: /Hero|FeatureGrid|FinalCTA|TrustedBy|AuthorsBand/i, tags: ["marketing", "section"] },
  { pattern: /Card|Grid|Rail|Results/i, tags: ["data", "catalogue"] },
  { pattern: /Reveal|animate|transition|motion/i, tags: ["motion"] },
  { pattern: /aria-|focus-visible|role=|tabIndex/i, tags: ["accessibility"] },
];

/* ---------------------------------------------------------------- helpers */

const HUMANIZE = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const KEBAB = (value: string) =>
  HUMANIZE(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const unique = <T,>(items: T[]): T[] => [...new Set(items)];

const UPPER = (value: string) => /^[A-Z]/.test(value);

function hasExportModifier(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) return false;
  const flags = ts.getCombinedModifierFlags(node as ts.Declaration);
  return Boolean(flags & ts.ModifierFlags.Export) || Boolean(flags & ts.ModifierFlags.Default);
}

function cleanComment(value: string): string {
  return value
    .replace(/^\s*\*\s?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function jsDocText(node: ts.Node): string | undefined {
  const docs = (node as ts.Node & { jsDoc?: ts.JSDoc[] }).jsDoc;
  if (!docs?.length) return undefined;
  for (const doc of docs) {
    const comment = doc.comment as unknown;
    if (typeof comment === "string" && comment.trim()) return cleanComment(comment);
    if (Array.isArray(comment)) {
      const text = comment
        .map((part) => (typeof part === "string" ? part : (part as { text?: string }).text ?? ""))
        .join("");
      if (text.trim()) return cleanComment(text);
    }
  }
  return undefined;
}

function firstSentence(value: string, max = 220): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return (stop > 0 ? cut.slice(0, stop + 1) : `${cut.trim()}…`).trim();
}

function isColorValue(value: string): boolean {
  return /^(#|rgb|hsl|oklch|oklab|color-mix\()/i.test(value.trim());
}

interface DeclarationMaps {
  interfaces: Map<string, ts.InterfaceDeclaration>;
  aliases: Map<string, ts.TypeAliasDeclaration>;
  variables: Map<string, ts.VariableDeclaration>;
  functions: Map<string, ts.FunctionDeclaration>;
  classes: Map<string, ts.ClassDeclaration>;
  cvaCalls: Map<string, ts.CallExpression>;
}

function collectDeclarations(sourceFile: ts.SourceFile): DeclarationMaps {
  const maps: DeclarationMaps = {
    interfaces: new Map(),
    aliases: new Map(),
    variables: new Map(),
    functions: new Map(),
    classes: new Map(),
    cvaCalls: new Map(),
  };

  for (const statement of sourceFile.statements) {
    if (ts.isInterfaceDeclaration(statement)) {
      maps.interfaces.set(statement.name.text, statement);
    } else if (ts.isTypeAliasDeclaration(statement)) {
      maps.aliases.set(statement.name.text, statement);
    } else if (ts.isFunctionDeclaration(statement) && statement.name) {
      maps.functions.set(statement.name.text, statement);
    } else if (ts.isClassDeclaration(statement) && statement.name) {
      maps.classes.set(statement.name.text, statement);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        maps.variables.set(declaration.name.text, declaration);
        const init = declaration.initializer;
        if (init && ts.isCallExpression(init)) {
          const callee = init.expression.getText(sourceFile);
          if (callee === "cva" || callee.endsWith(".cva")) {
            maps.cvaCalls.set(declaration.name.text, init);
          }
        }
      }
    }
  }
  return maps;
}

interface ExportRecord {
  localName: string;
  declaration: ts.Node;
  statement: ts.Node;
}

function collectExports(sourceFile: ts.SourceFile, maps: DeclarationMaps): Map<string, ExportRecord> {
  const exported = new Map<string, ExportRecord>();

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && hasExportModifier(statement)) {
      const name = statement.name.text;
      if (UPPER(name)) exported.set(name, { localName: name, declaration: statement, statement });
    } else if (ts.isClassDeclaration(statement) && statement.name && hasExportModifier(statement)) {
      const name = statement.name.text;
      if (UPPER(name)) exported.set(name, { localName: name, declaration: statement, statement });
    } else if (ts.isVariableStatement(statement) && hasExportModifier(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        const name = declaration.name.text;
        if (!UPPER(name)) continue;
        exported.set(name, { localName: name, declaration, statement });
      }
    } else if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        if (element.isTypeOnly) continue;
        const exportName = element.name.text;
        if (!UPPER(exportName)) continue;
        const localName = element.propertyName?.text ?? exportName;
        const decl =
          maps.functions.get(localName) ??
          maps.variables.get(localName) ??
          maps.classes.get(localName);
        if (decl) exported.set(exportName, { localName, declaration: decl, statement });
      }
    } else if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      const expr = statement.expression;
      if (ts.isIdentifier(expr) && UPPER(expr.text)) {
        const decl =
          maps.functions.get(expr.text) ??
          maps.variables.get(expr.text) ??
          maps.classes.get(expr.text);
        if (decl) exported.set(expr.text, { localName: expr.text, declaration: decl, statement });
      }
    }
  }

  return exported;
}

function declarationFor(name: string, maps: DeclarationMaps): ts.Node | undefined {
  return maps.functions.get(name) ?? maps.variables.get(name) ?? maps.classes.get(name);
}

interface Signature {
  params: ts.ParameterDeclaration[];
  typeNode?: ts.TypeNode;
}

function signatureFor(record: ExportRecord, sourceFile: ts.SourceFile): Signature {
  const node = record.declaration;
  if (ts.isFunctionDeclaration(node)) {
    return { params: [...node.parameters], typeNode: node.parameters[0]?.type };
  }
  if (ts.isClassDeclaration(node)) {
    const ctor = node.members.find(ts.isConstructorDeclaration);
    return { params: ctor ? [...ctor.parameters] : [], typeNode: ctor?.parameters[0]?.type };
  }
  if (ts.isVariableDeclaration(node)) {
    const init = node.initializer;
    if (!init) return { params: [] };
    if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
      return { params: [...init.parameters], typeNode: init.parameters[0]?.type };
    }
    if (ts.isCallExpression(init)) {
      const callee = init.expression.getText(sourceFile);
      const typeArgs = init.typeArguments;
      if (callee.includes("forwardRef") || callee.includes("memo")) {
        const fn = init.arguments[0];
        const params =
          fn && (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) ? [...fn.parameters] : [];
        return {
          params,
          typeNode: typeArgs?.[1] ?? params[0]?.type,
        };
      }
      const fn = init.arguments[0];
      if (fn && (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn))) {
        return { params: [...fn.parameters], typeNode: fn.parameters[0]?.type };
      }
    }
  }
  return { params: [] };
}

function collectDefaults(param: ts.ParameterDeclaration | undefined): Map<string, string> {
  const defaults = new Map<string, string>();
  if (!param || !ts.isObjectBindingPattern(param.name)) return defaults;
  for (const element of param.name.elements) {
    if (!ts.isBindingElement(element)) continue;
    if (!element.initializer) continue;
    const name = element.name.getText();
    defaults.set(name, element.initializer.getText());
  }
  return defaults;
}

interface ResolvedProps {
  props: PropInfo[];
  inherited: string[];
  variants: Record<string, ComponentVariants>;
}

function unionValues(typeNode: ts.TypeNode | undefined, maps: DeclarationMaps, depth = 0): string[] {
  if (!typeNode || depth > 2) return [];
  if (ts.isUnionTypeNode(typeNode)) {
    return unique(typeNode.types.flatMap((part) => unionValues(part, maps, depth + 1)));
  }
  if (ts.isLiteralTypeNode(typeNode) && ts.isStringLiteral(typeNode.literal)) {
    return [typeNode.literal.text];
  }
  if (ts.isTypeReferenceNode(typeNode)) {
    const last = typeNode.typeName.getText().split(".").pop() ?? "";
    const alias = maps.aliases.get(last);
    if (alias) return unionValues(alias.type, maps, depth + 1);
  }
  return [];
}

function addProp(props: PropInfo[], prop: PropInfo): void {
  const existing = props.find((item) => item.name === prop.name);
  if (!existing) {
    props.push(prop);
    return;
  }
  existing.required = existing.required || prop.required;
  if (!existing.description && prop.description) existing.description = prop.description;
  if (!existing.defaultValue && prop.defaultValue) existing.defaultValue = prop.defaultValue;
  if (prop.values?.length) existing.values = unique([...(existing.values ?? []), ...prop.values]);
  if (existing.type === "unknown" && prop.type !== "unknown") existing.type = prop.type;
}

function commonPropsFor(typeName: string): PropInfo[] {
  const base: PropInfo[] = [
    { name: "className", type: "string", required: false, description: "Layout or composition overrides. Use semantic utilities." },
  ];
  if (typeName === "ButtonHTMLAttributes") {
    return [
      ...base,
      { name: "children", type: "React.ReactNode", required: false, description: "Visible button label or icon plus label." },
      { name: "type", type: '"button" | "submit" | "reset"', required: false, defaultValue: '"button"' },
      { name: "disabled", type: "boolean", required: false },
      { name: "name", type: "string", required: false },
      { name: "value", type: "string | number", required: false },
      { name: "form", type: "string", required: false },
      { name: "onClick", type: "React.MouseEventHandler<HTMLButtonElement>", required: false },
    ];
  }
  if (typeName === "InputHTMLAttributes") {
    return [
      ...base,
      { name: "type", type: "React.HTMLInputTypeAttribute", required: false, defaultValue: '"text"' },
      { name: "value", type: "string | number | readonly string[]", required: false },
      { name: "defaultValue", type: "string | number | readonly string[]", required: false },
      { name: "placeholder", type: "string", required: false },
      { name: "disabled", type: "boolean", required: false },
      { name: "name", type: "string", required: false },
      { name: "id", type: "string", required: false },
      { name: "required", type: "boolean", required: false },
      { name: "onChange", type: "React.ChangeEventHandler<HTMLInputElement>", required: false },
    ];
  }
  if (typeName === "TextareaHTMLAttributes") {
    return [
      ...base,
      { name: "value", type: "string | number | readonly string[]", required: false },
      { name: "defaultValue", type: "string | number | readonly string[]", required: false },
      { name: "placeholder", type: "string", required: false },
      { name: "disabled", type: "boolean", required: false },
      { name: "rows", type: "number", required: false },
      { name: "onChange", type: "React.ChangeEventHandler<HTMLTextAreaElement>", required: false },
    ];
  }
  if (typeName === "AnchorHTMLAttributes") {
    return [
      ...base,
      { name: "children", type: "React.ReactNode", required: false },
      { name: "href", type: "string", required: false },
      { name: "target", type: "string", required: false },
      { name: "rel", type: "string", required: false },
    ];
  }
  return [...base, { name: "children", type: "React.ReactNode", required: false }];
}

function parseCva(
  variableName: string,
  maps: DeclarationMaps,
  sourceFile: ts.SourceFile,
): Record<string, ComponentVariants> {
  const call = maps.cvaCalls.get(variableName);
  if (!call) return {};
  const config = call.arguments[1];
  if (!config || !ts.isObjectLiteralExpression(config)) return {};

  const variants: Record<string, ComponentVariants> = {};
  let defaults: Record<string, string> = {};

  for (const prop of config.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = prop.name.getText(sourceFile).replace(/^["']|["']$/g, "");
    if (key === "defaultVariants" && ts.isObjectLiteralExpression(prop.initializer)) {
      for (const item of prop.initializer.properties) {
        if (!ts.isPropertyAssignment(item)) continue;
        const name = item.name.getText(sourceFile).replace(/^["']|["']$/g, "");
        const value = item.initializer.getText(sourceFile).replace(/^["']|["']$/g, "");
        defaults[name] = value;
      }
    }
    if (key !== "variants" || !ts.isObjectLiteralExpression(prop.initializer)) continue;
    for (const group of prop.initializer.properties) {
      if (!ts.isPropertyAssignment(group)) continue;
      const name = group.name.getText(sourceFile).replace(/^["']|["']$/g, "");
      if (!ts.isObjectLiteralExpression(group.initializer)) continue;
      const values = group.initializer.properties
        .filter(ts.isPropertyAssignment)
        .map((item) => item.name.getText(sourceFile).replace(/^["']|["']$/g, ""));
      if (values.length) variants[name] = { values };
    }
  }

  for (const [name, variant] of Object.entries(variants)) {
    if (defaults[name]) variant.default = defaults[name];
  }
  return variants;
}

function addVariantProps(
  variants: Record<string, ComponentVariants>,
  props: PropInfo[],
): void {
  for (const [variantName, variant] of Object.entries(variants)) {
    addProp(props, {
      name: variantName,
      type: variant.values.map((v) => `"${v}"`).join(" | "),
      required: false,
      defaultValue: variant.default ? `"${variant.default}"` : undefined,
      description:
        variantName === "variant"
          ? "Visual variant."
          : variantName === "size"
            ? "Control size."
            : "Variant value.",
      values: variant.values,
    });
  }
}

function resolveInterface(
  iface: ts.InterfaceDeclaration,
  maps: DeclarationMaps,
  sourceFile: ts.SourceFile,
  depth: number,
  visited: Set<string>,
  result: ResolvedProps,
): void {
  if (visited.has(iface.name.text)) return;
  visited.add(iface.name.text);

  for (const clause of iface.heritageClauses ?? []) {
    if (clause.token !== ts.SyntaxKind.ExtendsKeyword) continue;
    for (const ext of clause.types) {
      const extText = ext.getText(sourceFile);
      const extName = extText.split("<")[0].split(".").pop() ?? "";
      result.inherited.push(extText);

      if (extName === "VariantProps") {
        const typeArg = ext.typeArguments?.[0];
        if (typeArg && ts.isTypeQueryNode(typeArg)) {
          const name = typeArg.exprName.getText(sourceFile).split(".").pop() ?? "";
          const variants = parseCva(name, maps, sourceFile);
          Object.assign(result.variants, variants);
          addVariantProps(variants, result.props);
        }
        continue;
      }

      const nestedIface = maps.interfaces.get(extName);
      if (nestedIface) {
        resolveInterface(nestedIface, maps, sourceFile, depth + 1, visited, result);
        continue;
      }

      const alias = maps.aliases.get(extName);
      if (alias) {
        const nested = resolveProps(alias.type, maps, sourceFile, depth + 1, visited);
        for (const prop of nested.props) addProp(result.props, prop);
        result.inherited.push(...nested.inherited);
        Object.assign(result.variants, nested.variants);
        continue;
      }

      for (const prop of commonPropsFor(extName)) addProp(result.props, prop);
    }
  }

  for (const member of iface.members) addMember(member, result, maps, sourceFile);
}

function resolveProps(
  typeNode: ts.TypeNode | undefined,
  maps: DeclarationMaps,
  sourceFile: ts.SourceFile,
  depth = 0,
  visited = new Set<string>(),
): ResolvedProps {
  const result: ResolvedProps = { props: [], inherited: [], variants: {} };
  if (!typeNode || depth > 4) return result;

  if (ts.isTypeLiteralNode(typeNode)) {
    for (const member of typeNode.members) {
      addMember(member, result, maps, sourceFile);
    }
    return result;
  }

  if (ts.isIntersectionTypeNode(typeNode)) {
    for (const part of typeNode.types) {
      const nested = resolveProps(part, maps, sourceFile, depth + 1, visited);
      for (const prop of nested.props) addProp(result.props, prop);
      result.inherited.push(...nested.inherited);
      Object.assign(result.variants, nested.variants);
    }
    return result;
  }

  if (ts.isTypeReferenceNode(typeNode)) {
    const text = typeNode.typeName.getText(sourceFile);
    const last = text.split(".").pop() ?? text;

    if (last === "VariantProps") {
      const arg = typeNode.typeArguments?.[0];
      if (arg && ts.isTypeQueryNode(arg)) {
        const name = arg.exprName.getText(sourceFile).split(".").pop() ?? "";
        const variants = parseCva(name, maps, sourceFile);
        Object.assign(result.variants, variants);
        addVariantProps(variants, result.props);
      }
      return result;
    }

    if (/^React\./.test(text) || ["HTMLAttributes", "ButtonHTMLAttributes", "InputHTMLAttributes", "TextareaHTMLAttributes", "AnchorHTMLAttributes"].includes(last)) {
      result.inherited.push(text.replace(/^React\./, "React."));
      for (const prop of commonPropsFor(last)) addProp(result.props, prop);
      return result;
    }

    const iface = maps.interfaces.get(last);
    if (iface) {
      resolveInterface(iface, maps, sourceFile, depth + 1, visited, result);
      return result;
    }

    const alias = maps.aliases.get(last);
    if (alias && !visited.has(last)) {
      visited.add(last);
      const nested = resolveProps(alias.type, maps, sourceFile, depth + 1, visited);
      for (const prop of nested.props) addProp(result.props, prop);
      result.inherited.push(...nested.inherited);
      Object.assign(result.variants, nested.variants);
      return result;
    }

    result.inherited.push(text);
    return result;
  }

  if (ts.isUnionTypeNode(typeNode)) {
    for (const part of typeNode.types) {
      const nested = resolveProps(part, maps, sourceFile, depth + 1, visited);
      for (const prop of nested.props) addProp(result.props, prop);
      result.inherited.push(...nested.inherited);
      Object.assign(result.variants, nested.variants);
    }
  }
  return result;
}

function addMember(
  member: ts.TypeElement,
  result: ResolvedProps,
  maps: DeclarationMaps,
  sourceFile: ts.SourceFile,
): void {
  if (ts.isPropertySignature(member)) {
    const name = member.name.getText(sourceFile).replace(/^["']|["']$/g, "");
    const optional = Boolean(member.questionToken);
    const type = member.type?.getText(sourceFile) ?? "unknown";
    const values = member.type ? unionValues(member.type, maps) : [];
    addProp(result.props, {
      name,
      type,
      required: !optional,
      values: values.length ? values : undefined,
      description: jsDocText(member),
    });
    return;
  }
  if (ts.isMethodSignature(member)) {
    const name = member.name.getText(sourceFile).replace(/^["']|["']$/g, "");
    const params = member.parameters.map((param) => param.getText(sourceFile)).join(", ");
    const returns = member.type?.getText(sourceFile) ?? "void";
    addProp(result.props, {
      name,
      type: `(${params}) => ${returns}`,
      required: !member.questionToken,
      description: jsDocText(member),
    });
  }
}

function extractDependencies(sourceFile: ts.SourceFile): ComponentDependencies {
  const npm = new Set<string>();
  const internal = new Set<string>();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const spec = statement.moduleSpecifier.getText(sourceFile).replace(/^["']|["']$/g, "");
    if (spec.startsWith(".") || spec.startsWith("@/")) {
      internal.add(spec);
    } else {
      const packageName = spec.startsWith("@")
        ? spec.split("/").slice(0, 2).join("/")
        : spec.split("/")[0];
      if (packageName) npm.add(packageName);
    }
  }
  return {
    npm: [...npm].sort(),
    internal: [...internal].sort(),
  };
}

function extractTokens(code: string): string[] {
  const matches = code.match(
    /\b(?:bg|text|border|ring|from|via|to|fill|stroke|shadow|rounded|font|animate|p[trblxy]?|m[trblxy]?|gap|space-[xy]|w|h|size|min-[wh]|max-[wh]|leading|tracking|opacity|transition|duration|ease|backdrop|divide)-(?:\[[^\]]+\]|[a-zA-Z0-9_/.#%:-]+)/g,
  );
  return unique(matches ?? []).slice(0, 32);
}

function deriveTags(name: string, categorySlug: string, kind: ComponentKind, code: string): string[] {
  const tags = new Set<string>([kind, categorySlug]);
  for (const part of KEBAB(name).split("-")) {
    if (part && !["component", "app", "the", "and"].includes(part)) tags.add(part);
  }
  for (const entry of TAG_KEYWORDS) {
    if (entry.pattern.test(code)) for (const tag of entry.tags) tags.add(tag);
  }
  return [...tags].slice(0, 16);
}

function categoryFor(file: string): { folder: string; slug: string; name: string; kind: ComponentKind } {
  const rel = path.relative(COMPONENTS_DIR, file).split(path.sep);
  const folder = rel.length > 1 ? rel[0] : "providers";
  const info = CATEGORY_INFO[folder] ?? { name: HUMANIZE(folder), kind: "pattern" as ComponentKind };
  return { folder, slug: KEBAB(info.name), name: info.name, kind: info.kind };
}

function importPathFor(file: string): string {
  const rel = path
    .relative(COMPONENTS_DIR, file)
    .replace(/\\/g, "/")
    .replace(/\.tsx$/, "");
  return `@/components/${rel}`;
}

/* --------------------------------------------------------------- usage map */

interface UsageRecord {
  tag: string;
  file: string;
  line: number;
  priority: number;
  snippet: string;
}

function walkFiles(dir: string, extension = ".tsx"): string[] {
  if (!fs.existsSync(dir)) return [];
  const result: string[] = [];
  const visit = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "dist") continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && entry.name.endsWith(extension)) result.push(full);
    }
  };
  visit(dir);
  return result.sort();
}

function dedentSnippet(raw: string): string {
  const lines = raw.replace(/\t/g, "  ").split("\n");
  const indents = lines
    .filter((line) => line.trim())
    .map((line) => (line.match(/^\s*/) ?? [""])[0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  const trimmed = lines.map((line) => line.slice(min)).join("\n").trim();
  const clipped = trimmed.split("\n");
  return clipped.length > 18 ? `${clipped.slice(0, 18).join("\n")}\n  {/* … */}` : trimmed;
}

function buildUsageMap(): { records: Map<string, UsageRecord[]>; counts: Map<string, number> } {
  const records = new Map<string, UsageRecord[]>();
  const files = [...walkFiles(APP_DIR), ...walkFiles(COMPONENTS_DIR)];
  const uniqueFiles = [...new Set(files)];
  const counts = new Map<string, number>();
  const filesByTag = new Map<string, Set<string>>();
  const seenSnippets = new Set<string>();

  for (const file of uniqueFiles) {
    const rel = relativeToRoot(file);
    const source = fs.readFileSync(file, "utf8");
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const priority = rel.startsWith("src/app/") ? 0 : 1;

    const visit = (node: ts.Node) => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(sourceFile).split(".").pop() ?? "";
        if (UPPER(tag)) {
          const outer = ts.isJsxOpeningElement(node) ? node.parent : node;
          const raw = source.slice(outer.getStart(sourceFile), outer.getEnd());
          const snippet = dedentSnippet(raw);
          const key = `${tag}\u0000${snippet}`;
          if (!seenSnippets.has(key)) {
            seenSnippets.add(key);
            const line = sourceFile.getLineAndCharacterOfPosition(outer.getStart(sourceFile)).line + 1;
            const list = records.get(tag) ?? [];
            list.push({ tag, file: rel, line, priority, snippet });
            records.set(tag, list);
            const filesForTag = filesByTag.get(tag) ?? new Set<string>();
            filesForTag.add(rel);
            filesByTag.set(tag, filesForTag);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  for (const [tag, filesForTag] of filesByTag) {
    counts.set(tag, filesForTag.size);
  }
  for (const [tag, list] of records) {
    list.sort((a, b) => a.priority - b.priority || a.file.localeCompare(b.file) || a.line - b.line);
    records.set(tag, list.slice(0, 3));
  }
  return { records, counts };
}

function generatedExample(component: ComponentInfo): string {
  const required = component.props.filter((prop) => prop.required && prop.name !== "children");
  const hasChildren = component.props.some((prop) => prop.name === "children");
  const attrs: string[] = [];

  for (const prop of required) {
    const value = prop.values?.[0];
    let rendered: string;
    if (value) rendered = `"${value}"`;
    else if (/boolean/.test(prop.type)) rendered = "{true}";
    else if (/number/.test(prop.type)) rendered = "{1}";
    else if (/string/.test(prop.type)) rendered = `"Example"`;
    else if (/\[\]/.test(prop.type)) rendered = "{[]}";
    else if (/=>|function/.test(prop.type)) rendered = "{() => {}}";
    else rendered = "{value}";
    attrs.push(`${prop.name}=${rendered}`);
  }

  if (component.name === "Button") {
    const variant = component.variants.variant?.values.find((v) => v === "brand") ?? component.variants.variant?.values[0];
    if (variant) attrs.unshift(`variant="${variant}"`);
  }
  if (component.name === "Input" && !attrs.some((a) => a.startsWith("aria-label"))) {
    attrs.push('placeholder="Email"', 'aria-label="Email"');
  }

  const open = `<${component.exportName}${attrs.length ? ` ${attrs.join(" ")}` : ""}`;
  const body = hasChildren || component.name === "Button" ? "Save changes" : null;
  const jsx = body ? `${open}>${body}</${component.exportName}>` : `${open} />`;

  return [
    `// generated example — supply surrounding state and real data`,
    `import { ${component.exportName} } from "${component.importPath}";`,
    "",
    jsx,
  ].join("\n");
}

function usageExamplesFor(component: ComponentInfo, usage: Map<string, UsageRecord[]>): string[] {
  const records = (usage.get(component.exportName) ?? []).filter((record) => record.file !== component.file);
  if (!records.length) return [generatedExample(component)];
  return records.slice(0, 2).map((record) => `// ${record.file}:${record.line}\n${record.snippet}`);
}

/* ------------------------------------------------------------- description */

function describeComponent(
  slug: string,
  name: string,
  kind: ComponentKind,
  category: string,
  doc: string | undefined,
  variants: Record<string, ComponentVariants>,
): string {
  const mapped = DESCRIPTIONS[slug];
  if (mapped) return mapped;
  if (doc) return firstSentence(doc);
  const variantText = Object.entries(variants)
    .map(([key, value]) => `${value.values.length} ${key} options`)
    .join(", ");
  return `${name} is a ${kind} in the My Ui design system, grouped under ${category}.${variantText ? ` It exposes ${variantText}.` : ""}`;
}

function guidelinesFor(
  slug: string,
  kind: ComponentKind,
  categorySlug: string,
): ComponentGuidelines {
  const base = KIND_GUIDANCE[kind];
  const category = CATEGORY_GUIDANCE[categorySlug] ?? {};
  const specific = GUIDELINES[slug] ?? {};
  return {
    usage: unique([...(specific.usage ?? []), ...(category.usage ?? []), ...base.usage]),
    accessibility: unique([...(specific.accessibility ?? []), ...(category.accessibility ?? []), ...base.accessibility]),
    avoid: unique([...(specific.avoid ?? []), ...(category.avoid ?? []), ...base.avoid]),
  };
}

/* ------------------------------------------------------------------- build */

function parseFile(
  file: string,
  usage: Map<string, UsageRecord[]>,
  usageCounts: Map<string, number>,
  usedSlugs: Set<string>,
): ComponentInfo[] {
  const source = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const maps = collectDeclarations(sourceFile);
  const exports = collectExports(sourceFile, maps);
  const exportNames = [...exports.keys()].sort();
  const category = categoryFor(file);
  const deps = extractDependencies(sourceFile);
  const tokensUsed = extractTokens(source);
  const components: ComponentInfo[] = [];

  for (const [exportName, record] of exports) {
    const declaration = declarationFor(record.localName, maps) ?? record.declaration;
    const signature = signatureFor(record, sourceFile);
    const resolved = resolveProps(signature.typeNode, maps, sourceFile);
    const defaults = collectDefaults(signature.params[0]);

    for (const [name, value] of defaults) {
      const existing = resolved.props.find((prop) => prop.name === name);
      if (existing) {
        if (!existing.defaultValue) existing.defaultValue = value;
      } else {
        addProp(resolved.props, {
          name,
          type: "unknown",
          required: false,
          defaultValue: value,
          description: "Destructured default.",
        });
      }
    }

    const doc = jsDocText(record.declaration) ?? jsDocText(record.statement);
    let slug = KEBAB(exportName);
    if (usedSlugs.has(slug)) {
      const fileSuffix = KEBAB(path.basename(file, ".tsx"));
      slug = `${slug}-${fileSuffix}`;
    }
    let counter = 2;
    while (usedSlugs.has(slug)) slug = `${slug}-${counter++}`;
    usedSlugs.add(slug);

    const relatedTags = deriveTags(exportName, category.slug, category.kind, source);
    const description = describeComponent(slug, exportName, category.kind, category.name, doc, resolved.variants);
    const component: ComponentInfo = {
      id: `local:${category.slug}:${slug}`,
      slug,
      name: exportName,
      exportName,
      origin: "local",
      category: category.name,
      categorySlug: category.slug,
      categories: [category.slug],
      kind: category.kind,
      description,
      file: relativeToRoot(file),
      importPath: importPathFor(file),
      lineCount: source.split("\n").length,
      code: source,
      exports: exportNames,
      props: resolved.props,
      propsType: signature.typeNode?.getText(sourceFile) ?? null,
      inheritedProps: unique(resolved.inherited).slice(0, 10),
      variants: resolved.variants,
      dependencies: deps,
      tags: relatedTags,
      usageExamples: usageExamplesFor(
        {
          id: "",
          slug,
          name: exportName,
          exportName,
          origin: "local",
          category: category.name,
          categorySlug: category.slug,
          categories: [category.slug],
          kind: category.kind,
          description,
          file: relativeToRoot(file),
          importPath: importPathFor(file),
          lineCount: 0,
          code: source,
          exports: exportNames,
          props: resolved.props,
          propsType: signature.typeNode?.getText(sourceFile) ?? null,
          inheritedProps: [],
          variants: resolved.variants,
          dependencies: deps,
          tags: relatedTags,
          usageExamples: [],
          guidelines: { usage: [], accessibility: [], avoid: [] },
          related: [],
          tokensUsed: [],
          usedIn: 0,
        },
        usage,
      ),
      guidelines: guidelinesFor(slug, category.kind, category.slug),
      related: [],
      tokensUsed,
      usedIn: usageCounts.get(exportName) ?? 0,
    };
    components.push(component);
  }

  return components;
}

/* -------------------------------------------------------- marketplace catalogue */

interface RawCatalogueRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  author: AuthorInfo;
  tags: string[];
  categories: string[];
  previewUrl: string | null;
  previewLight: string | null;
  previewDark: string | null;
  videoUrl: string | null;
  videoUrlDark: string | null;
  downloads: number;
  likes: number;
  bookmarks: number;
  views: number;
  license: string;
  registry: string;
  dependencies: Record<string, string>;
  websiteUrl: string | null;
  sourceUrl: string | null;
  demoCode: string | null;
  componentCode: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  generated: boolean;
  gradient: [string, string] | null;
}

interface RawCatalogueDataset {
  meta?: { total?: number };
  categories?: { slug: string; name: string; count: number | null }[];
  components?: RawCatalogueRecord[];
}

interface CatalogueBuild {
  components: ComponentInfo[];
  rawRecords: RawCatalogueRecord[];
  categoryNames: Map<string, string>;
  sourceFound: boolean;
  expectedCount: number | null;
}

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://my-ui-dun.vercel.app"
).replace(/\/$/, "");

function chooseCatalogueExport(
  record: RawCatalogueRecord,
  exports: Map<string, ExportRecord>,
): { exportName: string; record: ExportRecord } | null {
  const wanted = new Set([KEBAB(record.name), KEBAB(record.slug)]);
  for (const [name, entry] of exports) {
    if (wanted.has(KEBAB(name))) return { exportName: name, record: entry };
  }
  const first = [...exports.entries()][0];
  return first ? { exportName: first[0], record: first[1] } : null;
}

function catalogueSourceNote(sourceUrl: string | null): string {
  return sourceUrl
    ? "Trust tier: linked. The catalogue record links to an original source. Prefer the upstream file, and treat the catalogue code below as a hint rather than an authoritative copy."
    : "Trust tier: reference. No original source URL is recorded. This catalogue entry is an illustrative approximation of the idea; re-implement it using local primitives and tokens rather than copying it, and verify the licence before adopting anything.";
}

function buildCatalogueComponent(
  raw: RawCatalogueRecord,
  categoryNames: Map<string, string>,
): ComponentInfo {
  const code = raw.componentCode?.trim()
    ? raw.componentCode
    : "// The catalogue record has no component source.\n";
  const author = raw.author ?? { username: "unknown", name: "Unknown", avatar: null };

  const categories = raw.categories?.length ? unique(raw.categories) : ["uncategorised"];
  const categorySlug = categories[0] ?? "uncategorised";
  const category = categoryNames.get(categorySlug) ?? HUMANIZE(categorySlug);
  // AST parsing is deferred to ensureCatalogueParsed() (lazy) to keep startup fast.
  const npm = unique(Object.keys(raw.dependencies ?? {})).sort();
  const tags = unique([
    ...deriveTags(raw.name, categorySlug, "catalogue", code),
    ...(raw.tags ?? []).map((tag) => KEBAB(tag)),
    ...categories.map((item) => KEBAB(item)),
  ]).filter(Boolean).slice(0, 20);
  const sourceUrl = raw.sourceUrl ?? null;
  const catalogue: CatalogueMetadata = {
    id: raw.id,
    author,
    previewUrl: raw.previewUrl ?? null,
    previewLight: raw.previewLight ?? null,
    previewDark: raw.previewDark ?? null,
    videoUrl: raw.videoUrl ?? null,
    videoUrlDark: raw.videoUrlDark ?? null,
    demoCode: raw.demoCode ?? null,
    sourceUrl,
    websiteUrl: raw.websiteUrl ?? null,
    license: raw.license || "Unknown",
    registry: raw.registry || "ui",
    stats: {
      downloads: raw.downloads ?? 0,
      likes: raw.likes ?? 0,
      bookmarks: raw.bookmarks ?? 0,
      views: raw.views ?? 0,
    },
    gradient: raw.gradient ?? null,
    generated: Boolean(raw.generated),
    updatedAt: raw.updatedAt ?? null,
    registryRoute: `/r/${author.username}/${raw.slug}`,
    sourcePage: `/@${author.username}/components/${raw.slug}`,
    installCommand: `npx shadcn@latest add ${SITE_URL}/r/${author.username}/${raw.slug}`,
    sourceNote: catalogueSourceNote(sourceUrl),
  };

  const component: ComponentInfo = {
    id: `catalogue:${author.username}:${raw.slug}`,
    slug: raw.slug,
    name: raw.name,
    exportName: raw.name,
    origin: "catalogue",
    category,
    categorySlug,
    categories,
    kind: "catalogue",
    description: firstSentence(raw.description) || `${raw.name} from the My Ui marketplace catalogue.`,
    file: `src/data/components.json#catalogue/${author.username}/${raw.slug}`,
    importPath: `@/components/catalogue/${author.username}-${raw.slug}`,
    lineCount: code.split("\n").length,
    code,
    exports: [],
    props: [],
    propsType: null,
    inheritedProps: [],
    variants: {},
    dependencies: { npm, internal: [], declared: npm },
    tags,
    usageExamples: raw.demoCode
      ? [`// catalogue demo: ${author.username}/${raw.slug}\n${raw.demoCode}`]
      : [],
    guidelines: guidelinesFor(raw.slug, "catalogue", categorySlug),
    related: [],
    tokensUsed: extractTokens(code),
    usedIn: 0,
    catalogue,
  };

  if (!component.usageExamples.length) {
    component.usageExamples = [generatedExample(component)];
  }
  return component;
}

function buildCatalogueComponents(): CatalogueBuild {
  const dataset = readJson<RawCatalogueDataset | null>(CATALOGUE_JSON, null);
  if (!dataset || !Array.isArray(dataset.components)) {
    return {
      components: [],
      rawRecords: [],
      categoryNames: new Map(),
      sourceFound: false,
      expectedCount: null,
    };
  }
  const categoryNames = new Map(
    (dataset.categories ?? []).map((category) => [category.slug, category.name]),
  );
  return {
    components: dataset.components.map((record) =>
      buildCatalogueComponent(record, categoryNames),
    ),
    rawRecords: dataset.components,
    categoryNames,
    sourceFound: true,
    expectedCount: dataset.meta?.total ?? dataset.components.length,
  };
}

const parsedCatalogue = new WeakSet<ComponentInfo>();
let catalogueByCategoryGlobal: Map<string, ComponentInfo[]> | null = null;

export function ensureCatalogueParsed(component: ComponentInfo): void {
  if (component.origin !== "catalogue") return;
  if (parsedCatalogue.has(component)) return;
  const code = component.code;
  const sourceFile = ts.createSourceFile(
    `${component.slug}.tsx`,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const maps = collectDeclarations(sourceFile);
  const exports = collectExports(sourceFile, maps);
  const exportNames = [...exports.keys()].sort();
  const chosen = chooseCatalogueExport({ name: component.name, slug: component.slug } as RawCatalogueRecord, exports);
  const exportName = chosen?.exportName ?? component.name;
  const signature = chosen ? signatureFor(chosen.record, sourceFile) : { params: [] };
  const resolved = resolveProps(signature.typeNode, maps, sourceFile);
  const defaults = collectDefaults(signature.params[0]);
  for (const [name, value] of defaults) {
    const existing = resolved.props.find((prop) => prop.name === name);
    if (existing) {
      if (!existing.defaultValue) existing.defaultValue = value;
    } else {
      addProp(resolved.props, {
        name,
        type: "unknown",
        required: false,
        defaultValue: value,
        description: "Destructured default.",
      });
    }
  }
  const discoveredDeps = extractDependencies(sourceFile);
  const realNpm = unique(discoveredDeps.npm.length ? discoveredDeps.npm : (component.dependencies.npm ?? [])).sort();
  component.exportName = exportName;
  component.exports = exportNames;
  component.props = resolved.props;
  component.propsType = signature.typeNode?.getText(sourceFile) ?? null;
  component.inheritedProps = unique(resolved.inherited).slice(0, 10);
  component.variants = resolved.variants;
  component.dependencies = {
    npm: realNpm,
    internal: unique([...(component.dependencies.internal ?? []), ...discoveredDeps.internal]),
    declared: component.dependencies.declared,
  };
  if (!component.tokensUsed.length) component.tokensUsed = extractTokens(code);

  // related (lazy): compute for this component using shared categories.
  if (!component.related || component.related.length === 0) {
    const propNames = new Set(component.props.map((p) => p.name));
    const tagSet = new Set(component.tags);
    const catSet = new Set(component.categories);
    const candidateSet = new Set<ComponentInfo>();
    for (const cat of component.categories) {
      for (const c of catalogueByCategoryGlobal?.get(cat) ?? []) candidateSet.add(c);
    }
    const scored = [...candidateSet]
      .filter((other) => other.id !== component.id && other.isCanonical !== false)
      .map((other) => {
        let sharedTags = 0;
        for (const t of other.tags) if (tagSet.has(t)) sharedTags++;
        let sharedCategories = 0;
        for (const c of other.categories) if (catSet.has(c)) sharedCategories++;
        let sharedProps = 0;
        for (const p of other.props) if (propNames.has(p.name)) sharedProps++;
        const score = sharedTags * 2 + sharedCategories * 3 + sharedProps;
        const reasons: string[] = [];
        if (sharedCategories) reasons.push(`${sharedCategories} shared categor${sharedCategories === 1 ? "y" : "ies"}`);
        if (sharedTags) reasons.push(`${sharedTags} shared tag${sharedTags === 1 ? "" : "s"}`);
        if (sharedProps) reasons.push(`${sharedProps} shared prop${sharedProps === 1 ? "" : "s"}`);
        return { other, score, reasons };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.other.name.localeCompare(b.other.name))
      .slice(0, 6);
    component.related = scored.map((item) => item.other.id);
    component.relatedReasons = scored.map((item) => ({
      id: item.other.id,
      score: item.score,
      reasons: item.reasons,
    }));
  }

  parsedCatalogue.add(component);
}

export function buildComponentIndex(): ComponentIndex {
  const files = walkFiles(COMPONENTS_DIR);
  const { records: usage, counts: usageCounts } = buildUsageMap();
  const usedSlugs = new Set<string>();
  const localComponents = files.flatMap((file) =>
    parseFile(file, usage, usageCounts, usedSlugs),
  );
  const catalogue = buildCatalogueComponents();
  let derivedMap = loadDerived();
  if (!derivedMap && catalogue.sourceFound) {
    derivedMap = computeDerivedAll(catalogue.rawRecords);
  }
  const components = [...localComponents, ...catalogue.components];

  // Attach derived fields to every component.
  for (const component of localComponents) {
    component.trustTier = "verified";
    component.licenseClass = "first-party";
    component.isCanonical = true;
    component.canonicalId = component.id;
    component.duplicateOf = null;
    component.alternates = [];
    component.codeQuality = {
      declaredDepsUnused: [],
      importsResolvable: true,
      usesUndefinedKeyframes: false,
      demoMatchesComponent: true,
      hasReducedMotion: false,
      ariaScore: 0,
      usesTokens: false,
      usesHardcodedColor: false,
    };
    component.complianceScore = 100;
    component.popularityScore = 0;
    component.heavyDeps = [];
    component.frameworkLock = "none";
    component.codeHash = "";
    component.resolvedPreviewUrl = null;
    component.resolvedPreviewLight = null;
    component.resolvedPreviewDark = null;
    component.resolvedVideoUrl = null;
  }
  for (const component of catalogue.components) {
    if (!component.catalogue) continue;
    const d = derivedMap?.get(component.catalogue.id);
    if (d) {
      component.trustTier = d.trustTier;
      component.licenseClass = d.licenseClass;
      component.isCanonical = d.isCanonical;
      component.canonicalId = d.canonicalId;
      component.duplicateOf = d.duplicateOf;
      component.alternates = d.alternates;
      component.codeQuality = d.codeQuality;
      component.complianceScore = d.complianceScore;
      component.popularityScore = d.popularityScore;
      component.heavyDeps = d.heavyDeps;
      component.frameworkLock = d.frameworkLock;
      component.codeHash = d.codeHash;
      component.resolvedPreviewUrl = d.resolvedPreviewUrl;
      component.resolvedPreviewLight = d.resolvedPreviewLight;
      component.resolvedPreviewDark = d.resolvedPreviewDark;
      component.resolvedVideoUrl = d.resolvedVideoUrl;
      if (component.catalogue) {
        component.catalogue.previewUrl = d.resolvedPreviewUrl;
        component.catalogue.previewLight = d.resolvedPreviewLight;
        component.catalogue.previewDark = d.resolvedPreviewDark;
        component.catalogue.videoUrl = d.resolvedVideoUrl;
      }
    } else {
      component.trustTier = component.catalogue.sourceUrl ? "linked" : "reference";
      component.licenseClass = "unknown";
      component.isCanonical = true;
      component.canonicalId = component.id;
      component.duplicateOf = null;
      component.alternates = [];
      component.codeQuality = {
        declaredDepsUnused: [],
        importsResolvable: true,
        usesUndefinedKeyframes: false,
        demoMatchesComponent: true,
        hasReducedMotion: false,
        ariaScore: 0,
        usesTokens: false,
        usesHardcodedColor: false,
      };
      component.complianceScore = 50;
      component.popularityScore = 0;
      component.heavyDeps = [];
      component.frameworkLock = "none";
      component.codeHash = "";
      component.resolvedPreviewUrl = component.catalogue.previewUrl;
      component.resolvedPreviewLight = component.catalogue.previewLight;
      component.resolvedPreviewDark = component.catalogue.previewDark;
      component.resolvedVideoUrl = component.catalogue.videoUrl;
    }
  }

  if (!catalogue.sourceFound) {
    console.error(
      `[myui-mcp] marketplace catalogue not found at ${relativeToRoot(CATALOGUE_JSON)}; only local components are indexed`,
    );
  } else if (
    catalogue.expectedCount !== null &&
    catalogue.expectedCount !== catalogue.components.length
  ) {
    console.error(
      `[myui-mcp] catalogue metadata says ${catalogue.expectedCount} records but ${catalogue.components.length} were loaded`,
    );
  }

  const bySlug = new Map(localComponents.map((component) => [component.slug, component]));
  const byId = new Map(components.map((component) => [component.id, component]));
  const byCatalogueKey = new Map<string, ComponentInfo>();
  for (const component of catalogue.components) {
    if (!component.catalogue) continue;
    byCatalogueKey.set(
      `${component.catalogue.author.username}/${component.slug}`.toLowerCase(),
      component,
    );
  }

  for (const component of [...localComponents]) {
    const candidates = localComponents
      .filter((other) => other.id !== component.id)
      .map((other) => {
        const shared = other.tags.filter((tag) => component.tags.includes(tag)).length;
        const sameCategory = other.categorySlug === component.categorySlug ? 3 : 0;
        const sameKind = other.kind === component.kind ? 1 : 0;
        return { other, score: shared + sameCategory + sameKind };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.other.name.localeCompare(b.other.name))
      .slice(0, 6);
    component.related = candidates.map((item) => item.other.id);
  }

  const catalogueByCategory = new Map<string, ComponentInfo[]>();
  for (const component of catalogue.components) {
    for (const category of component.categories) {
      const bucket = catalogueByCategory.get(category) ?? [];
      bucket.push(component);
      catalogueByCategory.set(category, bucket);
    }
  }
  catalogueByCategoryGlobal = catalogueByCategory;

  const categoryMap = new Map<string, { slug: string; name: string; count: number }>();
  for (const component of components) {
    const entry = categoryMap.get(component.categorySlug) ?? {
      slug: component.categorySlug,
      name: component.category,
      count: 0,
    };
    entry.count += 1;
    categoryMap.set(component.categorySlug, entry);
  }

  const originRank = (component: ComponentInfo) => (component.origin === "local" ? 0 : 1);

  // MiniSearch index is built lazily on first search (see ensureSearchIndex).

  return {
    root: ROOT,
    indexedAt: new Date().toISOString(),
    sourceFileCount: files.length,
    localComponentCount: localComponents.length,
    catalogueRecordCount: catalogue.components.length,
    catalogueSource: catalogue.sourceFound ? relativeToRoot(CATALOGUE_JSON) : "",
    components: components.sort(
      (a, b) =>
        originRank(a) - originRank(b) ||
        a.category.localeCompare(b.category) ||
        a.name.localeCompare(b.name),
    ),
    bySlug,
    byId,
    byCatalogueKey,
    categories: [...categoryMap.values()].sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name),
    ),
  };
}

/* ------------------------------------------------------------------ lookup */

export function summaryOf(component: ComponentInfo): ComponentSummary {
  return {
    id: component.id,
    name: component.name,
    slug: component.slug,
    exportName: component.exportName,
    origin: component.origin,
    category: component.category,
    categories: component.categories,
    kind: component.kind,
    description: component.description,
    file: component.file,
    importPath: component.importPath,
    tags: component.tags,
    propCount: component.props.length,
    variants: component.variants,
    usedIn: component.usedIn,
    ...(component.catalogue
      ? {
          author: component.catalogue.author,
          catalogueId: component.catalogue.id,
          license: component.catalogue.license,
          previewUrl: component.catalogue.previewUrl,
        }
      : {}),
  };
}

/** Compact summary used by the all-component index resource. */
export function indexSummaryOf(component: ComponentInfo): ComponentIndexSummary {
  return {
    id: component.id,
    name: component.name,
    slug: component.slug,
    origin: component.origin,
    category: component.category,
    categories: component.categories,
    kind: component.kind,
    description:
      component.description.length > 180
        ? `${component.description.slice(0, 177)}...`
        : component.description,
    importPath: component.importPath,
    propCount: component.props.length,
    ...(component.catalogue
      ? {
          author: component.catalogue.author,
          catalogueId: component.catalogue.id,
          license: component.catalogue.license,
          sourcePage: component.catalogue.sourcePage,
        }
      : {}),
  };
}

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@\/components\//, "")
    .replace(/^src\/components\//, "")
    .replace(/\.tsx$/, "")
    .replace(/[\s_]+/g, "-");
}

export interface FindOptions {
  include_duplicates?: boolean;
  license_policy?: "permissive-only" | "allow-weak-copyleft" | "any";
  min_trust?: "verified" | "linked" | "reference";
  framework?: "react" | "next";
  has_preview?: boolean;
  max_deps?: number;
  tags?: string[];
  categories?: string[];
  sort?: "relevance" | "popularity" | "recent" | "compliance";
  explain?: boolean;
  cursor?: string;
}

export interface SearchResult {
  components: ComponentInfo[];
  excludedForLicence: number;
  excludedDuplicates: number;
  explanations?: { id: string; score: number; reasons: string[] }[];
  nextCursor?: string;
}

const TRUST_RANK: Record<string, number> = { verified: 0, linked: 1, reference: 2 };

function licenseAllowed(cls: LicenseClass | undefined, policy: string): boolean {
  const c = cls ?? "unknown";
  if (policy === "any") return true;
  if (policy === "allow-weak-copyleft") return c === "first-party" || c === "permissive" || c === "weak-copyleft";
  return c === "first-party" || c === "permissive";
}

export function suggestNames(index: ComponentIndex, query: string, limit = 5): string[] {
  const needle = normalizeName(query);
  if (!needle) return [];
  // Try MiniSearch first
  try {
    if (!index.searchIndex) ensureSearchIndex(index);
    const ms = index.searchIndex as { search: (q: string, o?: any) => { id: string; score: number }[] } | undefined;
    if (ms) {
      const results = ms.search(needle, { fuzzy: 0.3, prefix: true });
      const names = results
        .map((r) => index.byId.get(r.id)?.name)
        .filter((n): n is string => Boolean(n));
      if (names.length) return [...new Set(names)].slice(0, limit);
    }
  } catch {
    // fall through
  }
  // Fallback: substring + Levenshtein on slugs/names
  const candidates = index.components.map((c) => c.name);
  const unique = [...new Set(candidates)];
  const scored = unique.map((name) => {
    const n = normalizeName(name);
    let d = 0;
    // simple contains bonus
    if (n.includes(needle) || needle.includes(n)) d -= 5;
    // levenshtein
    const a = needle, b = n;
    const m = a.length, nn = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(nn + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= nn; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= nn; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    d += dp[m][nn];
    return { name, d };
  });
  scored.sort((a, b) => a.d - b.d);
  return scored.slice(0, limit).map((s) => s.name);
}

export function ensureSearchIndex(index: ComponentIndex): void {
  if (index.searchIndex) return;
  try {
    const ms = new MiniSearch({
      fields: ["name", "slug", "description", "tags", "category", "props", "author", "importPath"],
      storeFields: ["id"],
      searchOptions: {
        boost: { name: 4, slug: 3, tags: 2.5, category: 2, description: 1.5, props: 1.2, author: 1, importPath: 1 },
        fuzzy: 0.2,
        prefix: true,
      },
    });
    ms.addAll(
      index.components.map((component) => ({
        id: component.id,
        name: component.name,
        slug: component.slug,
        description: component.description,
        tags: (component.tags || []).join(" "),
        category: component.category,
        props: (component.props || []).map((p) => p.name).join(" "),
        author: component.catalogue?.author.username ?? component.catalogue?.author.name ?? "",
        importPath: component.importPath,
      })),
    );
    index.searchIndex = ms;
  } catch (error) {
    console.error(`[myui-mcp] MiniSearch index failed: ${error instanceof Error ? error.message : String(error)}`);
    index.searchIndex = undefined;
  }
}

// Small LRU cache for repeated searchComponents calls (warm queries).
const SEARCH_CACHE = new Map<string, SearchResult>();
const SEARCH_CACHE_MAX = 128;
function searchCacheKey(query: string, options: FindOptions): string {
  return query + "\u0000" + JSON.stringify(options);
}

function cacheResult(key: string, result: SearchResult): SearchResult {
  if (SEARCH_CACHE.size >= SEARCH_CACHE_MAX) {
    const firstKey = SEARCH_CACHE.keys().next().value;
    if (firstKey !== undefined) SEARCH_CACHE.delete(firstKey);
  }
  SEARCH_CACHE.set(key, result);
  return result;
}

export function searchComponents(index: ComponentIndex, query: string, options: FindOptions = {}): SearchResult {
  ensureSearchIndex(index);
  const cacheKey = searchCacheKey(query, options);
  const cached = SEARCH_CACHE.get(cacheKey);
  if (cached) {
    // LRU touch
    SEARCH_CACHE.delete(cacheKey);
    SEARCH_CACHE.set(cacheKey, cached);
    return cached;
  }
  const needle = normalizeName(query);
  const opts = {
    include_duplicates: options.include_duplicates ?? false,
    license_policy: options.license_policy ?? "permissive-only",
    min_trust: options.min_trust ?? "reference",
    sort: options.sort ?? "relevance",
    ...options,
  };
  const minTrustRank = TRUST_RANK[opts.min_trust ?? "reference"] ?? 2;

  // Capture the filters once so the duplicate count can be measured against the
  // same candidate set. Reporting `index.length - pool.length` conflated every
  // filter (category, tags, framework, preview, deps) with "duplicates hidden".
  const tagSet = opts.tags?.length ? new Set(opts.tags.map((tag) => tag.toLowerCase())) : null;
  const catSet = opts.categories?.length
    ? new Set(opts.categories.map((category) => category.toLowerCase()))
    : null;
  const requireNext = opts.framework === "next";
  const requirePreview = Boolean(opts.has_preview);
  const maxDeps = typeof opts.max_deps === "number" ? opts.max_deps : null;

  const matchesBaseFilters = (candidate: ComponentInfo): boolean => {
    if (tagSet && !candidate.tags.some((tag) => tagSet.has(tag.toLowerCase()))) return false;
    if (
      catSet &&
      !candidate.categories.some((category) => catSet.has(category.toLowerCase())) &&
      !catSet.has(candidate.category.toLowerCase())
    ) {
      return false;
    }
    if (requireNext && !(candidate.frameworkLock === "next" || (candidate.dependencies.npm || []).includes("next"))) {
      return false;
    }
    if (requirePreview && !(candidate.resolvedPreviewUrl || candidate.catalogue?.previewUrl)) {
      return false;
    }
    if (maxDeps !== null && (candidate.dependencies.npm?.length ?? 0) > maxDeps) {
      return false;
    }
    return true;
  };

  const matchedBase = index.components.filter(matchesBaseFilters);
  const canonicalBase = opts.include_duplicates
    ? matchedBase
    : matchedBase.filter((candidate) => candidate.isCanonical !== false);
  const excludedDuplicates = opts.include_duplicates ? 0 : matchedBase.length - canonicalBase.length;

  let excludedForLicence = 0;
  const pool = canonicalBase.filter((candidate) => {
    const r = TRUST_RANK[candidate.trustTier ?? "reference"] ?? 2;
    if (r > minTrustRank) return false;
    if (!licenseAllowed(candidate.licenseClass, opts.license_policy)) {
      excludedForLicence++;
      return false;
    }
    return true;
  });

  if (!needle) {
    let sorted = [...pool];
    if (opts.sort === "popularity") sorted.sort((a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0));
    else if (opts.sort === "compliance") sorted.sort((a, b) => (b.complianceScore ?? 0) - (a.complianceScore ?? 0));
    else if (opts.sort === "recent") sorted.sort((a, b) => (b.catalogue?.updatedAt ?? "").localeCompare(a.catalogue?.updatedAt ?? ""));
    return cacheResult(cacheKey, { components: sorted, excludedForLicence, excludedDuplicates });
  }

  const exact = pool.filter((component) => {
    const author = component.catalogue?.author.username ?? "";
    const catalogueKey = author ? `${author}/${component.slug}` : "";
    return (
      normalizeName(component.id) === needle ||
      normalizeName(component.slug) === needle ||
      normalizeName(component.name) === needle ||
      normalizeName(component.exportName) === needle ||
      normalizeName(component.file) === needle ||
      normalizeName(component.importPath) === needle ||
      normalizeName(catalogueKey) === needle ||
      normalizeName(component.catalogue?.id ?? "") === needle ||
      normalizeName(component.catalogue?.sourcePage ?? "") === needle
    );
  });
  if (exact.length) {
    const sorted = exact.sort((a, b) =>
      (a.origin === "local" ? 0 : 1) - (b.origin === "local" ? 0 : 1) ||
      (b.catalogue?.stats.downloads ?? 0) - (a.catalogue?.stats.downloads ?? 0) ||
      a.name.localeCompare(b.name),
    );
    return cacheResult(cacheKey, { components: sorted, excludedForLicence, excludedDuplicates });
  }

  // MiniSearch relevance (precomputed index) with substring fallback.
  const ms = index.searchIndex as { search: (q: string, o?: any) => { id: string; score: number; terms?: string[] }[] } | undefined;
  const msScores = new Map<string, number>();
  const msTerms = new Map<string, string[]>();
  if (ms) {
    try {
      let count = 0;
      for (const r of ms.search(needle, { fuzzy: 0.2, prefix: true })) {
        if (count >= 500) break;
        msScores.set(r.id, r.score);
        msTerms.set(r.id, r.terms || []);
        count++;
      }
    } catch {
      // fall back to substring scoring below
    }
  }

  // Build the candidate list from MiniSearch results when available, so we only
  // score the matched subset instead of the whole pool.
  const poolById = new Map(pool.map((c) => [c.id, c]));
  let candidates: ComponentInfo[];
  if (msScores.size > 0) {
    candidates = [];
    for (const id of msScores.keys()) {
      const c = poolById.get(id);
      if (c) candidates.push(c);
    }
    if (!candidates.length) candidates = pool;
  } else {
    candidates = pool;
  }

  const scored = candidates
    .map((component) => {
      const msScore = msScores.get(component.id);
      let base: number;
      const reasons: string[] = [];
      if (msScore !== undefined) {
        base = Math.round(msScore * 10);
        if (component.slug.startsWith(needle)) { base += 15; if (opts.explain) reasons.push("slug prefix"); }
        if (component.name.toLowerCase().startsWith(needle)) { base += 15; if (opts.explain) reasons.push("name prefix"); }
        if (component.origin === "local") { base += 25; if (opts.explain) reasons.push("local boost"); }
        const terms = msTerms.get(component.id);
        if (opts.explain && terms && terms.length) reasons.push(`matched: ${terms.join(", ")}`);
      } else {
        const haystack = [
          component.id, component.slug, component.name, component.exportName,
          component.category, component.file, component.importPath,
          component.catalogue?.author.username ?? "", component.catalogue?.author.name ?? "",
          component.catalogue?.id ?? "", component.catalogue?.sourceUrl ?? "",
          ...component.categories, ...component.tags,
          ...component.props.map((prop) => prop.name),
          component.description,
        ].join(" ").toLowerCase();
        base = 0;
        if (haystack.includes(needle)) { base += 20; if (opts.explain) reasons.push("exact phrase in index"); }
        for (const token of needle.split("-").filter(Boolean)) {
          if (haystack.includes(token)) base += 6;
        }
        if (component.slug.startsWith(needle)) { base += 15; if (opts.explain) reasons.push("slug prefix"); }
        if (component.name.toLowerCase().startsWith(needle)) { base += 15; if (opts.explain) reasons.push("name prefix"); }
        if (component.origin === "local" && base >= 20) { base += 25; if (opts.explain) reasons.push("local boost"); }
      }
      const trustW = component.trustTier === "verified" ? 1.2 : component.trustTier === "linked" ? 1.05 : 0.85;
      const pop = component.popularityScore ?? 0;
      const comp = (component.complianceScore ?? 50) / 100;
      const final = base * trustW * (0.7 + 0.3 * pop) * (0.8 + 0.2 * comp);
      if (opts.explain && component.trustTier) reasons.push(`trust:${component.trustTier}`);
      return { component, score: final, base, reasons };
    })
    .filter((item) => item.base > 0)
    .sort((a, b) => {
      if (opts.sort === "popularity") return (b.component.popularityScore ?? 0) - (a.component.popularityScore ?? 0);
      if (opts.sort === "compliance") return (b.component.complianceScore ?? 0) - (a.component.complianceScore ?? 0);
      if (opts.sort === "recent") return (b.component.catalogue?.updatedAt ?? "").localeCompare(a.component.catalogue?.updatedAt ?? "");
      return b.score - a.score;
    });


  const explanations = opts.explain
    ? scored.map((item) => ({ id: item.component.id, score: Math.round(item.score * 100) / 100, reasons: item.reasons }))
    : undefined;

  return cacheResult(cacheKey, { components: scored.map((item) => item.component), excludedForLicence, excludedDuplicates, explanations });
}

export function findComponents(index: ComponentIndex, query: string, options?: FindOptions): ComponentInfo[] {
  return searchComponents(index, query, options).components;
}


export function componentDetailPayload(component: ComponentInfo, index: ComponentIndex) {
  ensureCatalogueParsed(component);
  const handoff = componentHandoff(component);
  return {
    ...summaryOf(component),
    propsType: component.propsType,
    props: component.props,
    inheritedProps: component.inheritedProps,
    dependencies: component.dependencies,
    exports: component.exports,
    sourceFile: component.file,
    copyTarget: handoff.suggestedPath,
    sourceAvailable: handoff.sourceAvailable,
    copyInstruction: handoff.copyInstruction,
    code: component.code,
    usageExamples: component.usageExamples,
    guidelines: component.guidelines,
    tokensUsed: component.tokensUsed,
    ...(component.catalogue ? { catalogue: component.catalogue } : {}),
    related: component.related
      .map((id) => index.byId.get(id))
      .filter((item): item is ComponentInfo => Boolean(item))
      .map(summaryOf),
  };
}

/** A copy-ready source record. Never strip the code: the agent must copy it. */
export function componentHandoff(component: ComponentInfo): ComponentHandoff {
  ensureCatalogueParsed(component);
  const suggestedPath =
    component.origin === "local"
      ? component.file
      : `src/components/catalogue/${component.catalogue?.author.username ?? "unknown"}-${component.slug}.tsx`;
  const sourceAvailable =
    component.origin === "local" ||
    (component.code.trim().length > 0 &&
      !component.code.trim().startsWith("// The catalogue record has no component source."));
  const catalogue = component.catalogue;

  const problems: string[] = [];
  if (component.codeQuality) {
    if (component.codeQuality.declaredDepsUnused.length) problems.push(`declared-but-unused dependencies: ${component.codeQuality.declaredDepsUnused.join(", ")}`);
    if (component.codeQuality.usesUndefinedKeyframes) problems.push("uses animate-[...] keyframes that are not defined in this project");
    if (!component.codeQuality.demoMatchesComponent) problems.push("demo does not import the component it claims to show");
    if (!component.codeQuality.hasReducedMotion) problems.push("no reduced-motion handling");
    if (component.codeQuality.usesHardcodedColor) problems.push("hardcoded colours instead of semantic tokens");
  }

  let copyInstruction: string;
  if (component.origin === "local") {
    copyInstruction = `Verified local source. Copy the exact code below into \`${suggestedPath}\` in the target project. Preserve the export and imports; adapt only import aliases. Do not paraphrase or regenerate it.`;
  } else if (component.trustTier === "linked") {
    copyInstruction = `Linked catalogue record (prefer the upstream file at ${catalogue?.sourceUrl}). The code below is a hint/reconstruction: verify it against the upstream implementation and the ${catalogue?.license ?? "unknown"} licence, then copy or re-implement as needed. Do not treat it as authoritative.`;
  } else {
    const problemLine = problems.length ? ` Detected issues: ${problems.join("; ")}.` : "";
    copyInstruction = `Reference-only catalogue record: this is an illustrative approximation, not production code. Re-implement it using local primitives and semantic tokens rather than copying it.${problemLine} Licence: ${catalogue?.license ?? "unknown"} (verify before adopting).`;
  }

  const licenceNote = catalogue
    ? ` Verify the ${catalogue.license} licence and attribution before copying.`
    : "";
  const installNote = catalogue?.installCommand
    ? ` The registry install is \`${catalogue.installCommand}\`; copy the source when you need to own and edit the implementation.`
    : "";

  return {
    id: component.id,
    name: component.name,
    slug: component.slug,
    exportName: component.exportName,
    origin: component.origin,
    category: component.category,
    description: component.description,
    sourceFile: component.file,
    suggestedPath,
    importPath: component.importPath,
    code: component.code,
    sourceAvailable,
    dependencies: component.dependencies,
    props: component.props,
    variants: component.variants,
    tokensUsed: component.tokensUsed,
    usageExamples: component.usageExamples,
    guidelines: component.guidelines,
    copyInstruction,
    ...(catalogue
      ? {
          license: catalogue.license,
          author: catalogue.author,
          installCommand: catalogue.installCommand,
          sourceNote: catalogue.sourceNote,
        }
      : {}),
    trustTier: component.trustTier,
    licenseClass: component.licenseClass,
    isCanonical: component.isCanonical,
    canonicalId: component.canonicalId,
    duplicateOf: component.duplicateOf,
    alternates: component.alternates,
    codeQuality: component.codeQuality,
    complianceScore: component.complianceScore,
    popularityScore: component.popularityScore,
    heavyDeps: component.heavyDeps,
    frameworkLock: component.frameworkLock,
    resolvedPreviewUrl: component.resolvedPreviewUrl,
  };
}

export function componentResourceList(index: ComponentIndex) {
  return index.components.map((component) => ({
    uri: component.catalogue
      ? `myui://catalogue/${component.catalogue.author.username}/${component.slug}`
      : `myui://components/${component.slug}`,
    name: component.name,
    description: component.description,
    mimeType: "application/json",
  }));
}

export function componentSummaryText(component: ComponentInfo): string {
  const origin = component.catalogue
    ? `catalogue/${component.catalogue.author.username}`
    : "local";
  return `${component.name} — ${component.description} (${origin}, ${component.category}, ${component.file})`;
}
