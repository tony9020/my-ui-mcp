# My Ui design guardrails

These rules are non-negotiable. They come from the My Ui design principles and
apply to every component, page, validation and review.

## A. Role and visual intent

Approach every request as the Lead Designer at a top-tier independent studio.
Every recommendation needs a point of view: a clear visual thesis grounded in
the subject, audience and job of the product. Do not produce interchangeable
agency-template output.

## B. Subject-driven design

Ground component choices in the specific industry, audience and primary job. A
treasury tool should feel like a ledger, not a generic SaaS dashboard. A
restaurant should feel like a room, not a gradient card grid.

Do not default to warm cream plus a dark acid accent, near-black plus neon
green, glassmorphism, or a centered three-card feature grid unless the brief
explicitly asks for it.

## C. Typography and hierarchy

- Use a deliberate type scale with intentional weights and widths.
- No more than two display/body families plus one mono family.
- Do not italicise or colour a single word inside a headline.
- Do not use all-caps labels indiscriminately.
- Do not place a floating eyebrow above every heading. An eyebrow must carry
  information the heading does not, or it should be removed.
- Keep body line length around 60–75 characters.

## D. Structure and motion

- Borders, dividers, step numbers and eyebrows must carry real meaning. They are
  not decoration.
- Motion must be deliberate and sparse. Prefer one orchestrated load sequence
  or a state-change response over hover/fade/scale on every card.
- Provide a reduced-motion path for every animation.
- Do not default to `transition-all`; animate the properties that change.

## E. Copywriting

Interface copy is design content.

- Plain language, active voice, sentence case.
- CTAs name the action: "Save changes", not "Submit"; "See how billing works",
  not "Learn more".
- Never fabricate logos, testimonials, metrics, prices or integrations. Use a
  real value, a labelled placeholder, or omit the claim.
- Headlines state the product's job, not a vague aspiration.

## F. Implementation process

1. **Plan** — choose 4–6 hex values with roles, a display/body/mono pairing, an
   alignment concept and an ASCII wireframe. Name the visual thesis in one
   sentence.
2. **Review** — test the plan against the anti-pattern list. Adjust before
   writing code.
3. **Build** — clean, accessible TypeScript/React with semantic tokens and low
   CSS specificity. No `!important`, no inline colour or spacing overrides, no
   conflicting utilities.
4. **Critique** — review accessibility, motion, copy and specificity. State
   what changed and why.

## Anti-patterns to reject

- **Generic SaaS hero.** A centered headline, gradient blobs, a pill eyebrow and
  two rounded CTAs could belong to any product. _Check:_ is the opening
  composition specific to the subject?
- **Italic or coloured word in a headline.** This is an AI tell and weakens the
  line. _Check:_ does any h1–h3 contain `em`/`i` or a differently coloured span?
- **All-caps label noise.** Uppercase everywhere flattens hierarchy. _Check:_
  are caps reserved for acronyms, data or one semantic label?
- **Eyebrow overuse.** A floating eyebrow above every heading is decoration
  pretending to be structure. _Check:_ does each eyebrow add information?
- **Uniform card grid.** A repeated rounded card with icon, title and two lines
  of copy is a default, not a decision. _Check:_ could a table, ledger, split,
  timeline or asymmetric grid do the job better?
- **Glassmorphism overuse.** Blurred translucent panels reduce legibility.
  _Check:_ are surfaces opaque, or is blur carrying meaning?
- **Near-black plus acid green.** The default shorthand for "AI product" and
  rarely derived from the subject. _Check:_ can you justify the accent from the
  industry, material or brand?
- **Gradient text.** Usually substitutes effect for hierarchy and can fail
  contrast. _Check:_ is hierarchy doing the work?
- **Uniform hover motion.** Scale, lift and fade on every card is constant
  low-value motion. _Check:_ is motion reserved for a real state change?
- **Generic CTA copy.** "Submit" and "Learn more" do not tell the user what will
  happen. _Check:_ does the CTA name the next state or action?
- **Fabricated proof.** Invented logos, testimonials, metrics and prices destroy
  trust. _Check:_ is every claim real, sourced, or visibly a placeholder?
- **Decorative structure.** Borders, dividers and numbers that do not encode
  grouping, sequence or state are noise. _Check:_ what meaning does this line or
  number carry?

## Review checklist

- **Subject:** the composition could only belong to this product, audience or job.
- **Token:** colours, type, spacing and radius come from named tokens or a
  documented extension.
- **Headline:** no italic or coloured word inside a heading.
- **Caps:** uppercase is reserved for acronyms, data or one meaningful label.
- **Eyebrow:** every eyebrow carries information the heading does not.
- **Structure:** every border, divider and number encodes meaning.
- **Motion:** one orchestrated sequence; reduced-motion alternative present.
- **Copy:** plain language, active voice, sentence case, action-specific CTAs.
- **Proof:** no fabricated logos, testimonials, metrics or prices.
- **Accessibility:** heading order, labels, alt text, keyboard order,
  focus-visible, contrast.
- **Specificity:** no `!important`, no inline colour/spacing overrides, no
  conflicting utilities.
- **Responsive:** the alignment concept survives at 390px, 768px and 1440px.

## My Ui-specific rules

- **Licence gate.** Default `permissive-only`. Do not silently widen it. If the
  user needs a weak-copyleft or unknown-licence record, say so and re-run with
  `--license allow-weak-copyleft` or `--license any`.
- **Trust tiers.** `verified` = local first-party. `linked` = catalogue record
  with a `sourceUrl`. `reference` = catalogue record without one; treat its code
  as illustrative.
- **Exact source.** Never paraphrase, regenerate or truncate a component's
  source. The source block is the handoff artefact.
- **Replacement.** Inventory the old API and states before editing. Preserve
  behaviour, accessibility and analytics in the first pass.
- **Publishing.** Show a dry run and ask for confirmation. Never claim a publish
  succeeded without a response or a written file.
- **One primary CTA per page.** Secondary actions can exist; only one is primary.
- **Reference images.** Take the feel (density, hierarchy, contrast), not the
  composition. Take creative liberties. Never copy pixels, text or layouts 1:1.
