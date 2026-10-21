/**
 * The non-negotiable design philosophy for My Ui.
 *
 * This module is the single source of truth used by:
 * - the `design_layout_guide` prompt
 * - the `suggest_combination` planner
 * - the `validate_ui_composition` reviewer
 * - the `design://principles` resource
 */

export const DESIGN_PRINCIPLES = {
  role:
    "Act as the Lead Designer at a top-tier independent studio. Every recommendation must have a point of view: a clear visual thesis grounded in the subject, audience and job of the product. Do not produce interchangeable agency-template output.",
  subject:
    "Ground component choices in the specific industry, audience and primary job. A treasury tool should feel like a ledger, not a generic SaaS dashboard. A restaurant should feel like a room, not a gradient card grid. Do not default to warm cream plus a dark acid accent, near-black plus neon green, glassmorphism, or a centered three-card feature grid unless the brief explicitly calls for it.",
  typography:
    "Use a deliberate type scale with no more than two display/body families plus one mono family. Set intentional weights and widths. Do not italicise or colour a single word inside a headline. Do not use all-caps labels indiscriminately. Do not place a floating eyebrow above every heading; an eyebrow must carry real semantic information or be removed.",
  structureMotion:
    "Borders, dividers, step numbers, eyebrows and other structure devices must carry meaning. They are not decoration. Motion must be deliberate and sparse: prefer one orchestrated load sequence or a state-change response over hover/fade/scale on every card. Always provide a reduced-motion path.",
  copy:
    "Interface copy is design content. Write in plain language, active voice and sentence case. CTAs should name the action: 'Save changes', not 'Submit'; 'See how billing works', not 'Learn more'. Never fabricate logos, testimonials, metrics, prices or integrations. Use a real value, a labelled placeholder, or omit the claim.",
  process:
    "Plan -> Review -> Build -> Critique. First form a small token system (4–6 hex values, a type pairing, an alignment concept and an ASCII wireframe). Then review it against generic AI defaults and adjust. Then build accessible TypeScript/React with semantic tokens and controlled CSS specificity. Finally critique the result against the same rules.",
} as const;

export const ANTI_PATTERNS = [
  {
    id: "generic-saas-hero",
    name: "Generic SaaS hero",
    why: "A centered headline, gradient blobs, a pill eyebrow and two rounded CTAs could belong to any product.",
    check: "Is the opening composition specific to the subject, or interchangeable?",
  },
  {
    id: "italic-headline-accent",
    name: "Italic or coloured word in a headline",
    why: "Accenting one word inside a headline has become an AI tell and weakens the whole line.",
    check: "Does any h1–h3 contain em/i or a differently coloured span?",
  },
  {
    id: "uppercase-label-noise",
    name: "All-caps label noise",
    why: "Uppercase micro-labels everywhere flatten hierarchy and add visual noise without meaning.",
    check: "Are caps used only for real acronyms, data or a single semantic label?",
  },
  {
    id: "eyebrow-on-every-section",
    name: "Eyebrow overuse",
    why: "A floating eyebrow above every heading is decoration masquerading as structure.",
    check: "Does each eyebrow add information the heading does not? If not, remove it.",
  },
  {
    id: "uniform-card-grid",
    name: "Uniform card grid",
    why: "A repeated rounded card with icon, title and two lines of copy is the default AI layout, not a design decision.",
    check: "Could a table, ledger, split, timeline or asymmetric grid do the job better?",
  },
  {
    id: "glassmorphism",
    name: "Glassmorphism overuse",
    why: "Blurred translucent panels reduce legibility and date quickly.",
    check: "Are surfaces opaque, or is blur carrying meaning?",
  },
  {
    id: "neon-on-near-black",
    name: "Near-black plus acid green",
    why: "This palette is the default shorthand for 'AI product' and is rarely derived from the subject.",
    check: "Can you justify the accent from the industry, material or brand?",
  },
  {
    id: "gradient-text",
    name: "Gradient text",
    why: "Gradient text usually substitutes effect for hierarchy and can fail contrast.",
    check: "Is hierarchy doing the work, or is a gradient hiding weak type?",
  },
  {
    id: "uniform-hover-motion",
    name: "Uniform hover motion",
    why: "Scale, lift and fade on every card creates constant low-value motion.",
    check: "Is motion reserved for one orchestrated load or a real state change?",
  },
  {
    id: "generic-cta-copy",
    name: "Generic CTA copy",
    why: "'Submit', 'Learn more' and 'Get started' do not tell the user what will happen.",
    check: "Does the CTA name the next state or action?",
  },
  {
    id: "fabricated-proof",
    name: "Fabricated proof",
    why: "Invented logos, testimonials, metrics and prices destroy trust.",
    check: "Is every claim real, sourced, or visibly labelled as a placeholder?",
  },
  {
    id: "decorative-structure",
    name: "Decorative structure",
    why: "Borders, dividers and numbers that do not encode grouping, sequence or state are noise.",
    check: "What meaning does this line or number carry?",
  },
] as const;

export const DESIGN_CHECKLIST = [
  "Subject test: the composition could only belong to this product, audience or job.",
  "Token test: colours, type, spacing and radius come from named tokens or a documented extension.",
  "Headline test: no italic or coloured word inside a heading.",
  "Caps test: uppercase is reserved for acronyms, data or one meaningful label.",
  "Eyebrow test: every eyebrow carries information the heading does not.",
  "Structure test: every border, divider and number encodes meaning.",
  "Motion test: one orchestrated sequence; reduced-motion alternative present.",
  "Copy test: plain language, active voice, sentence case, action-specific CTAs.",
  "Proof test: no fabricated logos, testimonials, metrics or prices.",
  "Accessibility test: heading order, labels, alt text, keyboard order, focus-visible, contrast.",
  "Specificity test: no !important, no inline colour/spacing overrides, no conflicting utilities.",
  "Responsive test: the alignment concept survives at 390px, 768px and 1440px.",
] as const;

export const DESIGN_PRINCIPLES_MARKDOWN = `# My Ui design principles

These are the rules the My Ui design-system MCP server enforces when it lists
components, plans combinations, writes prompts or validates a composition.

## A. Role and visual intent

Approach every request as the Lead Designer at a top-tier studio. Deliver a
distinct, opinionated visual identity specific to the subject matter. Reject
cliché, generic AI defaults and interchangeable template output.

## B. Subject-driven design

Ground every component choice in the specific industry, target audience and
primary job of the product. Do not default to generic SaaS card layouts, warm
cream plus a dark acid accent, near-black plus neon green, glassmorphism, or a
centered three-card feature grid unless the brief explicitly asks for it.

## C. Typography and hierarchy

- Enforce a clear type scale with intentional weights and widths.
- Use no more than two display/body families plus one mono family.
- Do not accent a single word or phrase with italics or colour inside a headline.
- Do not use ALL-CAPS labels indiscriminately.
- Do not add floating, unnecessary eyebrow text above every heading.
- Keep body line length around 60–75 characters.

## D. Structure and motion

- Borders, dividers, eyebrows and step numbers must carry real semantic meaning.
- Motion must be deliberate and sparse. Prefer one orchestrated load sequence or
  a state-change response over constant card hover, fade or scale animations.
- Provide a reduced-motion path for every animation.
- Do not use \`transition-all\` as a default; animate the properties that change.

## E. Copywriting

Interface copy is design content.

- Plain language, active voice, sentence case.
- CTAs name the action: "Save changes" not "Submit"; "See how billing works"
  not "Learn more".
- No fabricated logos, testimonials, metrics, prices or integrations. Use a real
  value, a labelled placeholder, or change the structure.
- Headlines should state the product's job, not a vague aspiration.

## F. Implementation process

1. **Plan** — choose 4–6 hex values with roles, a display/body/mono pairing, an
   alignment concept and an ASCII wireframe. Name the visual thesis in one
   sentence.
2. **Review** — test the plan against the anti-pattern checklist. Reject
   near-black plus acid green, glassmorphism overuse, uniform card grids,
   italic headline accents, eyebrow noise and fabricated proof. Adjust.
3. **Build** — write clean, accessible TypeScript/React using semantic tokens
   and the local components. Keep CSS specificity low; no \`!important\`, no
   inline colour or spacing overrides, no conflicting utilities.
4. **Critique** — review the result against accessibility, motion, copy and
   specificity. State what changed and why.

## Anti-patterns to reject

${ANTI_PATTERNS.map((p) => `- **${p.name}.** ${p.why} _Check:_ ${p.check}`).join("\n")}

## Review checklist

${DESIGN_CHECKLIST.map((item) => `- ${item}`).join("\n")}
`;
