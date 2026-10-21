export type SurfaceType =
  | "landing"
  | "dashboard"
  | "auth"
  | "pricing"
  | "settings"
  | "docs"
  | "onboarding"
  | "mobile"
  | "editor"
  | "marketplace"
  | "profile"
  | "generic";

export const SURFACE_TYPES: SurfaceType[] = [
  "landing",
  "dashboard",
  "auth",
  "pricing",
  "settings",
  "docs",
  "onboarding",
  "mobile",
  "editor",
  "marketplace",
  "profile",
  "generic",
];

export interface SlotRecipe {
  slot: string;
  intent: string;
  layout: string;
  needs: string[];
  copyDirection: string;
  notes: string[];
}

export interface SurfaceRecipe {
  slots: SlotRecipe[];
  wireframe: string;
  gaps: string[];
  copyRules: string[];
  risks: string[];
  accessibility: string[];
  specificity: string[];
}

const box = {
  landing: [
    "+--------------------------------------------------------------+",
    "| wordmark / nav                                  [primary action] |",
    "+-------------------------------+------------------------------+",
    "| H1: the product's job          | real artifact / preview      |",
    "| one specific supporting line   | or a measured data strip     |",
    "| [primary]   [secondary]        |                              |",
    "+-------------------------------+------------------------------+",
    "| proof: real logo or one number, not a wall of invented names    |",
    "+---------------------------+------------------+-----------------+",
    "| capability A (wide)       | capability B     | capability C    |",
    "| outcome + mechanism       | smaller          | smaller         |",
    "+---------------------------+------------------+-----------------+",
    "| showcase: one large work + two details, captions on a baseline   |",
    "+--------------------------------------------------------------+",
    "| closing action: one sentence + one primary action              |",
    "+--------------------------------------------------------------+",
  ].join("\n"),
  dashboard: [
    "+----------+---------------------------------------------------+",
    "| rail     | header: workspace / period / search / account     |",
    "| current  +---------------------------------------------------+",
    "| mark     | KPI: label + figure + unit + range (2 or 3 only)   |",
    "|          +---------------------------------------------------+",
    "| filters  | primary ledger / table                            |",
    "|          | label | measure | measure | status | updated      |",
    "|          |       |  right  |  right  |        |              |",
    "|          +---------------------------------------------------+",
    "|          | detail pane or one row of activity                 |",
    "+----------+---------------------------------------------------+",
  ].join("\n"),
  auth: [
    "+--------------------------------+---------------------------+",
    "| wordmark                       | sign in                   |",
    "| one sentence about the job     | label + input             |",
    "|                                | label + input             |",
    "|                                | [Sign in]                 |",
    "|                                | recovery / alternate path |",
    "+--------------------------------+---------------------------+",
  ].join("\n"),
  pricing: [
    "+--------------------------------------------------------------+",
    "| H1: what the pricing buys                                   |",
    "| billing period control (one)                                |",
    "+----------------+----------------+----------------+----------+",
    "| plan A         | plan B (anchor)| plan C         |          |",
    "| who it's for   | who it's for   | who it's for   |          |",
    "| price          | price          | price          |          |",
    "| [choose]       | [choose]       | [choose]       |          |",
    "+----------------+----------------+----------------+----------+",
    "| comparison: capability | limit | support | overage          |",
    "+--------------------------------------------------------------+",
    "| FAQ: three real purchase blockers, answered directly          |",
    "+--------------------------------------------------------------+",
  ].join("\n"),
  settings: [
    "+----------------+---------------------------------------------+",
    "| settings nav   | section title                               |",
    "| current mark   | label + control                             |",
    "|                | label + control                             |",
    "|                | destructive row with consequence            |",
    "|                +---------------------------------------------+",
    "|                | [Save changes]  (only when dirty)            |",
    "+----------------+---------------------------------------------+",
  ].join("\n"),
  docs: [
    "+----------------+---------------------------------------------+",
    "| docs nav       | search / breadcrumb                         |",
    "| current mark   | H1 + answer first                           |",
    "|                | prose at 72ch                               |",
    "|                | code block + copy                           |",
    "|                | next: [task name]                           |",
    "+----------------+---------------------------------------------+",
  ].join("\n"),
  onboarding: [
    "+--------------------------------------------------------------+",
    "| outcome of this step                        1 of 3           |",
    "+--------------------------------------------------------------+",
    "| one decision per screen                                      |",
    "| label + input                                                 |",
    "| helper / error                                                |",
    "| [continue]                                      [back]        |",
    "+--------------------------------------------------------------+",
  ].join("\n"),
  mobile: [
    "+---------------------------+",
    "| header / one action       |",
    "+---------------------------+",
    "| primary content           |",
    "| one column, one job       |",
    "|                           |",
    "+---------------------------+",
    "| bottom bar: one action    |",
    "+---------------------------+",
  ].join("\n"),
  editor: [
    "+--------------------------------------------------------------+",
    "| header: file / save state / one action                       |",
    "+----------+-----------------------------+---------------------+",
    "| tools    | canvas / preview            | inspector           |",
    "| one rail |                             | label + field       |",
    "|          |                             | label + field       |",
    "+----------+-----------------------------+---------------------+",
    "| status bar: one line of context                              |",
    "+--------------------------------------------------------------+",
  ].join("\n"),
  marketplace: [
    "+----------------+---------------------------------------------+",
    "| category rail  | search / sort / view                        |",
    "| current mark   +---------------------------------------------+",
    "|                | rail: curated / featured                    |",
    "|                +---------------------------------------------+",
    "|                | grid or dense list (choose one)             |",
    "|                |                                             |",
    "+----------------+---------------------------------------------+",
    "| detail: preview | code | install | metadata               |",
    "+--------------------------------------------------------------+",
  ].join("\n"),
  profile: [
    "+--------------------------------------------------------------+",
    "| avatar / name / role / one action                            |",
    "+-----------------------------+--------------------------------+",
    "| dominant project            | proof / stats (real only)      |",
    "|                             |                                |",
    "+-----------------------------+--------------------------------+",
    "| supporting project | supporting project | notes              |",
    "+--------------------------------------------------------------+",
  ].join("\n"),
  generic: [
    "+--------------------------------------------------------------+",
    "| context / navigation / one action                            |",
    "+-----------------------------+--------------------------------+",
    "| primary task                | supporting context             |",
    "|                             |                                |",
    "| [primary action]            | secondary detail               |",
    "+-----------------------------+--------------------------------+",
  ].join("\n"),
};

const COMMON_COPY = [
  "One primary action per page; secondary actions are text or outline.",
  "Use sentence case and action-specific CTAs.",
  "Do not invent proof; use a real value or a labelled placeholder.",
];

const COMMON_A11Y = [
  "One h1 per page; section headings follow in order.",
  "Every control has a visible label or accessible name.",
  "Focus-visible on every interactive element; no focus traps outside dialogs.",
  "Contrast at least 4.5:1 for body text and 3:1 for large text.",
];

const COMMON_SPECIFICITY = [
  "Use semantic tokens: bg-background, text-foreground, border-border, text-muted-foreground, bg-brand.",
  "No raw hex in composition code; extend the token layer if the palette requires it.",
  "No !important, inline colour/spacing, or conflicting utilities.",
];

export const SURFACE_RECIPES: Record<SurfaceType, SurfaceRecipe> = {
  landing: {
    slots: [
      {
        slot: "Opening",
        intent: "State the product job and earn one qualified action.",
        layout: "Asymmetric two-column opening: copy left, a real artifact or preview right. No centered hero.",
        needs: ["hero", "headline", "button"],
        copyDirection: "Lead with the job, not the category. One sentence of specificity, then the action.",
        notes: [
          "Do not add an eyebrow above the headline.",
          "If reusing the rotating hero accent, replace it with subject-specific copy and keep it the single exception.",
        ],
      },
      {
        slot: "Proof",
        intent: "Show real evidence, not a wall of invented logos.",
        layout: "A narrow band with real logos or one quantified proof point. If neither exists, omit the band.",
        needs: ["trusted", "authors", "badge"],
        copyDirection: "Use a real customer or a labelled placeholder. Never invent a logo or metric.",
        notes: ["If using TrustedBy, replace its data with verified customers only."],
      },
      {
        slot: "Capability",
        intent: "Explain the two or three capabilities that make the product different.",
        layout: "A broken grid: one capability gets a wide cell, the others are smaller. Not three equal cards.",
        needs: ["feature", "grid"],
        copyDirection: "Each capability names an outcome and a mechanism. No vague powerful or seamless.",
        notes: ["If all features are truly parallel, a table may be clearer than cards."],
      },
      {
        slot: "Showcase",
        intent: "Show the work or the product surface at a real scale.",
        layout: "An asymmetric showcase: one large preview, two supporting details, captions on a metadata line.",
        needs: ["showcase", "component", "card"],
        copyDirection: "Write captions like labels: what it is, why it matters, what changed.",
        notes: ["Use real previews or clearly labelled generated fallbacks."],
      },
      {
        slot: "Conversion",
        intent: "Close with one action and the consequence of taking it.",
        layout: "A short band with one primary action and one secondary text link. No new claims.",
        needs: ["cta", "button"],
        copyDirection: "Name the next state: Create workspace, Book a walkthrough.",
        notes: ["Only one brand button in this section."],
      },
      {
        slot: "Footer",
        intent: "Provide navigation, legal and contact without becoming a second sitemap.",
        layout: "Four columns at most, with the wordmark and one sentence. Keep it quieter than the page.",
        needs: ["footer"],
        copyDirection: "Plain labels; no marketing copy in the footer.",
        notes: [],
      },
    ],
    wireframe: box.landing,
    gaps: ["No local FAQ or accordion section; add one before promising a complete marketing page."],
    copyRules: [
      "Headline states the product job; supporting line adds one specific mechanism.",
      "One primary CTA per page; secondary actions are text or outline.",
    ],
    risks: [
      "Do not let the feature section become three equal rounded cards.",
      "Do not add an eyebrow above the hero or every section.",
      "Do not use the rotating hero accent as a decorative template.",
    ],
    accessibility: [
      "Decorative preview art is hidden from assistive technology; real screenshots have alt text.",
      "Primary action is visible and keyboard reachable above the fold.",
    ],
    specificity: [
      "Use section-level spacing utilities; do not override component internals with !important.",
      "Keep one radius family and one shadow family.",
    ],
  },
  dashboard: {
    slots: [
      {
        slot: "Chrome",
        intent: "Orient the user with stable navigation and context.",
        layout: "A narrow rail for context, a top bar for scope and account. The content pane owns the width.",
        needs: ["app-header", "shell", "navigation"],
        copyDirection: "Label the current workspace and period. Do not turn the chrome into a marketing surface.",
        notes: ["Keep the rail collapsible before the content becomes cramped."],
      },
      {
        slot: "KPI row",
        intent: "Surface the two or three numbers that change a decision.",
        layout: "A left-aligned row with labels, figures, units and time range. Right-align figures; avoid six equal cards.",
        needs: ["badge", "stat"],
        copyDirection: "Every number needs a label, unit and time range. Mark estimates as estimates.",
        notes: ["There is no dedicated stat primitive; compose a ledger row or add one."],
      },
      {
        slot: "Primary data",
        intent: "Make the main ledger or result set scannable.",
        layout: "A dense table or list with a shared baseline, hairline row rules and one selected row.",
        needs: ["results", "list", "table"],
        copyDirection: "Use column headers that name the measure and unit. Keep empty states specific.",
        notes: ["ResultsGrid renders component records, not arbitrary data rows; add a Table primitive for real financial data."],
      },
      {
        slot: "Controls",
        intent: "Filter and sort without hiding the current scope.",
        layout: "One inline control row above the data; no floating filter card.",
        needs: ["sort", "filter", "select"],
        copyDirection: "Show the active filter as a removable chip; label the sort order.",
        notes: [],
      },
      {
        slot: "Detail and feedback",
        intent: "Inspect a row and confirm state changes.",
        layout: "A side panel for detail, with toasts only for non-blocking confirmations.",
        needs: ["dialog", "toast"],
        copyDirection: "Detail headings name the record; confirmations state what changed.",
        notes: ["Do not use a modal for a primary data-editing flow."],
      },
    ],
    wireframe: box.dashboard,
    gaps: [
      "No local chart or generic data-table primitive; ResultsGrid is a component-result grid.",
      "No local stat or KPI primitive; compose a ledger row or add one.",
      "No local app rail or sidebar primitive; compose a simple navigation list or add one.",
    ],
    copyRules: [
      "Every number has a label, unit and time range.",
      "One primary action per view; filters are not actions.",
      "Empty states explain the next step, not just No data.",
    ],
    risks: [
      "Do not build the dashboard out of six identical metric cards.",
      "Do not hide the scope or time range.",
      "Do not use a modal for the primary editing flow.",
    ],
    accessibility: [
      "Table headers must be real th elements with scope.",
      "Do not use colour alone for trend or status.",
      "Provide a skip link to the data pane.",
    ],
    specificity: [
      "Keep table density in one place; do not override cell padding per row.",
      "Use tokens for status colours; no raw hex in row classes.",
    ],
  },
  auth: {
    slots: [
      {
        slot: "Frame",
        intent: "Get the right user through the door with minimal friction.",
        layout: "A split screen: one quiet brand column, one focused form column. Collapse to the form on mobile.",
        needs: ["auth", "sign-in", "form"],
        copyDirection: "State what the user gets after signing in. No generic Welcome back alone.",
        notes: ["Keep the form column narrow; do not fill it with marketing cards."],
      },
      {
        slot: "Identity",
        intent: "Reassure the user about the product and account context.",
        layout: "Small wordmark and one sentence in the brand column; no hero image required.",
        needs: ["logo", "brand"],
        copyDirection: "One sentence about the product job. No invented security badges.",
        notes: [],
      },
      {
        slot: "Action",
        intent: "Make the primary path obvious and the alternate path secondary.",
        layout: "One primary button, one text link for recovery, one secondary provider row at most.",
        needs: ["button"],
        copyDirection: "Use Sign in or the specific action, not Submit.",
        notes: [],
      },
      {
        slot: "Feedback",
        intent: "Show errors and confirmations without losing the form.",
        layout: "Inline field errors plus a form-level live region. Toast only for non-blocking confirmation.",
        needs: ["toast", "badge"],
        copyDirection: "State the problem and the fix: That email is not recognised. Check the address or create an account.",
        notes: [],
      },
    ],
    wireframe: box.auth,
    gaps: [],
    copyRules: [
      "Primary action names the outcome: Sign in, Create account.",
      "Errors sit next to the field and describe the fix.",
      "Do not claim security certifications you do not have.",
    ],
    risks: [
      "Do not use placeholder-only fields.",
      "Do not put a generic Submit button at the bottom.",
      "Do not use a full-bleed stock photo behind a translucent form.",
    ],
    accessibility: [
      "Visible labels connected with htmlFor and id.",
      "Announce form-level errors in a live region.",
      "Return focus to the first invalid field.",
    ],
    specificity: [
      "Avoid inline styles on the form column; use tokens.",
      "Do not override the input focus ring.",
    ],
  },
  pricing: {
    slots: [
      {
        slot: "Opening",
        intent: "Explain what the pricing buys before showing numbers.",
        layout: "Left-aligned heading and one billing-period control. No centered pricing hero.",
        needs: ["pricing", "hero"],
        copyDirection: "Name the unit of value: seats, projects, transactions or usage.",
        notes: ["PricingView is a full-page composition; use it as the base or extract the plan table."],
      },
      {
        slot: "Plan comparison",
        intent: "Make the difference between plans legible in one scan.",
        layout: "A table-like comparison with one recommended plan, right-aligned prices and shared capability rows.",
        needs: ["pricing", "grid"],
        copyDirection: "Plan names should describe who they are for, not just Starter/Pro/Enterprise.",
        notes: ["Use real prices or labelled placeholders. Do not invent discounts."],
      },
      {
        slot: "FAQ",
        intent: "Answer the purchase blockers.",
        layout: "A short list of real questions with direct answers; no decorative accordion animation on every row.",
        needs: ["faq", "accordion"],
        copyDirection: "Answer the question in the first sentence.",
        notes: ["No local accordion primitive; use a definition list or add one."],
      },
      {
        slot: "Conversion",
        intent: "Close with one action and a clear next step.",
        layout: "A short band with one primary action; no repeated plan cards.",
        needs: ["cta", "button"],
        copyDirection: "Start with the [plan] or Talk to us about [use case].",
        notes: [],
      },
    ],
    wireframe: box.pricing,
    gaps: ["No local FAQ, accordion or comparison-table primitive; add one for a complete pricing page."],
    copyRules: [
      "Use real prices or visibly labelled placeholders.",
      "Name the unit of value and the limit.",
      "Do not invent customer counts, discounts or testimonials.",
    ],
    risks: [
      "Do not centre three identical pricing cards with a purple gradient on the middle one.",
      "Do not hide the billing period or overage rules.",
      "Do not use Most popular without real data.",
    ],
    accessibility: [
      "Plan comparison remains readable as a table on small screens.",
      "Do not encode the recommended plan with colour alone.",
      "Price changes are announced, not just visually updated.",
    ],
    specificity: [
      "Keep price typography in one component; do not override font size per card.",
      "Use one border treatment for the comparison rows.",
    ],
  },
  settings: {
    slots: [
      {
        slot: "Chrome",
        intent: "Keep account context and navigation stable while settings change.",
        layout: "A narrow settings rail and a single reading column. No nested sidebar.",
        needs: ["app-header", "shell", "navigation"],
        copyDirection: "Label the current settings group and account scope.",
        notes: [],
      },
      {
        slot: "Navigation",
        intent: "Group settings by the user mental model, not the database schema.",
        layout: "Tabs or a short vertical list; current item marked with more than colour.",
        needs: ["tabs", "menu", "sidebar"],
        copyDirection: "Use nouns the user recognises: Profile, Notifications, Billing, Access.",
        notes: [],
      },
      {
        slot: "Form sections",
        intent: "Change one class of settings at a time.",
        layout: "Label-left or label-above rows with a control on the right; group with meaning, not decorative cards.",
        needs: ["input", "switch", "select"],
        copyDirection: "Explain consequences next to destructive or irreversible controls.",
        notes: ["There is no local settings-section primitive; compose labelled rows."],
      },
      {
        slot: "Save bar",
        intent: "Make unsaved changes and their outcome clear.",
        layout: "A sticky bar that appears only when the form is dirty; primary save on the right, discard as text.",
        needs: ["button", "toast"],
        copyDirection: "Save changes and Discard. Confirm with a specific toast.",
        notes: [],
      },
    ],
    wireframe: box.settings,
    gaps: [
      "No local settings-section or sticky save-bar primitive; compose from primitives.",
      "No local settings rail primitive; compose a short vertical navigation list.",
    ],
    copyRules: [
      "Group by user mental model; use plain nouns.",
      "Save only when dirty; state what changed.",
      "Explain irreversible actions before the control.",
    ],
    risks: [
      "Do not turn every setting into a rounded card.",
      "Do not use a switch for a destructive action.",
      "Do not auto-save without telling the user.",
    ],
    accessibility: [
      "Every control has a visible label and a group heading.",
      "Errors are announced and focus moves to the invalid control.",
      "The save bar is reachable by keyboard and not hidden behind a sticky overlay.",
    ],
    specificity: [
      "Keep control widths consistent with tokens; do not use inline width overrides.",
      "Avoid nesting cards inside cards.",
    ],
  },
  docs: {
    slots: [
      {
        slot: "Shell",
        intent: "Keep navigation stable while the reader moves through reference material.",
        layout: "A persistent docs rail, a 72ch reading column, and an optional on-page table of contents.",
        needs: ["shell", "navigation"],
        copyDirection: "Use the task as the navigation label, not internal team names.",
        notes: [],
      },
      {
        slot: "Search",
        intent: "Get the reader to the right answer quickly.",
        layout: "One search field at the top of the rail or content; no giant hero search.",
        needs: ["search"],
        copyDirection: "Placeholder names what can be searched: Search endpoints, errors, guides.",
        notes: [],
      },
      {
        slot: "Content",
        intent: "Show the answer before the theory.",
        layout: "Prose at 72ch, code blocks that break the measure, copy buttons on real commands.",
        needs: ["code", "tabs"],
        copyDirection: "Lead with the answer; use second person and active voice.",
        notes: ["There is no local prose typography component; use semantic HTML with tokens."],
      },
      {
        slot: "Navigation",
        intent: "Move to the next task without losing orientation.",
        layout: "Previous and next links at the end; on-page table of contents on long pages.",
        needs: ["tabs"],
        copyDirection: "Link labels name the next task.",
        notes: ["No local pagination primitive; use semantic links."],
      },
    ],
    wireframe: box.docs,
    gaps: [
      "No local prose/typography component; use semantic HTML with the type scale.",
      "No local pagination primitive; use semantic previous/next links.",
      "No local docs rail or table-of-contents primitive; compose a simple navigation list or add one.",
    ],
    copyRules: [
      "Answer first, context second.",
      "Use second person and active voice.",
      "Code samples must be copyable and match the actual API.",
    ],
    risks: [
      "Do not use marketing voice inside reference docs.",
      "Do not put a giant centered search hero above the docs.",
      "Do not show code that does not run.",
    ],
    accessibility: [
      "Code blocks are keyboard scrollable and labelled.",
      "Current page is marked with aria-current.",
      "Headings follow the document outline.",
    ],
    specificity: [
      "Do not override prose spacing per page; keep one reading measure.",
      "Use one code-block surface and one copy-button treatment.",
    ],
  },
  onboarding: {
    slots: [
      {
        slot: "Progress",
        intent: "Show where the user is and what remains.",
        layout: "A single progress indicator with step count and the current step name. No decorative stepper circles.",
        needs: ["progress", "steps"],
        copyDirection: "Name the outcome of the step, not Step 1.",
        notes: ["No local progress or stepper primitive; compose a labelled progress line or add one."],
      },
      {
        slot: "Form",
        intent: "Get to first value with one decision per screen.",
        layout: "A narrow single-column form with visible labels, helper text and one primary action.",
        needs: ["input", "select", "switch"],
        copyDirection: "Explain why the information is needed and what happens next.",
        notes: [],
      },
      {
        slot: "Feedback",
        intent: "Confirm completion and expose the next step.",
        layout: "Inline confirmation plus a specific next action; toast only for transient state.",
        needs: ["toast", "badge"],
        copyDirection: "Workspace created. Invite your first teammate.",
        notes: [],
      },
      {
        slot: "Action",
        intent: "Keep the primary action unambiguous.",
        layout: "One primary action on the right; back is a text link.",
        needs: ["button"],
        copyDirection: "Continue to [next step] or Create workspace.",
        notes: [],
      },
    ],
    wireframe: box.onboarding,
    gaps: ["No local progress or stepper primitive; compose a labelled progress line or add one."],
    copyRules: [
      "One decision per screen.",
      "Say why the information is needed.",
      "State the outcome of the step, not just the step number.",
    ],
    risks: [
      "Do not use a decorative stepper with no meaning.",
      "Do not ask for information you do not use.",
      "Do not hide the back path.",
    ],
    accessibility: [
      "Progress is announced as text, not just a visual bar.",
      "Focus moves to the first field on each step.",
      "Errors are announced and linked to the field.",
    ],
    specificity: [
      "Keep one form width across steps; do not resize the column per step.",
      "Use one button hierarchy across the flow.",
    ],
  },
  mobile: {
    slots: [
      {
        slot: "Shell",
        intent: "Orient the user in a single column with one clear action.",
        layout: "Compact header, one content column, and a thumb-reachable bottom action. No desktop sidebar.",
        needs: ["app-header", "shell"],
        copyDirection: "Use a short context label; avoid long breadcrumbs.",
        notes: [],
      },
      {
        slot: "Feed",
        intent: "Show the primary items with enough context to choose.",
        layout: "A dense list or one-column card set with a clear tap target and no hover-only actions.",
        needs: ["card", "list", "results"],
        copyDirection: "One line of context per item; keep metadata secondary.",
        notes: ["Use ComponentListRow for dense comparison, not every item as a card."],
      },
      {
        slot: "Controls",
        intent: "Change scope without covering the content.",
        layout: "A single segmented row or bottom sheet; no floating filter card over the feed.",
        needs: ["tabs", "select", "switch"],
        copyDirection: "Label the current scope; keep option labels short.",
        notes: [],
      },
      {
        slot: "Bottom action",
        intent: "Keep the primary action reachable with one hand.",
        layout: "A sticky bottom bar with one primary action and safe-area padding. Not a floating action button over content.",
        needs: ["button"],
        copyDirection: "Name the action; keep it under four words.",
        notes: [],
      },
    ],
    wireframe: box.mobile,
    gaps: [
      "No local bottom-sheet navigation primitive; use Sheet with care.",
      "No local compact mobile header primitive; AppHeader is the closest fit.",
    ],
    copyRules: [
      "One job per screen.",
      "Keep the primary action thumb-reachable.",
      "Do not hide essential actions behind hover.",
    ],
    risks: [
      "Do not shrink a desktop three-column layout into a phone.",
      "Do not use a floating action button over the primary content.",
      "Do not rely on swipe-only actions.",
    ],
    accessibility: [
      "Tap targets are at least 44x44 CSS pixels.",
      "The bottom bar respects safe-area insets.",
      "Do not trap focus or disable zoom.",
    ],
    specificity: [
      "Use responsive utilities rather than device-specific overrides.",
      "Do not set fixed heights that clip content at large text sizes.",
    ],
  },
  editor: {
    slots: [
      {
        slot: "Chrome",
        intent: "Keep file context and status visible while the canvas owns attention.",
        layout: "A thin top bar with file name, save state and one primary action.",
        needs: ["app-header", "shell"],
        copyDirection: "Show the file name and save state; no marketing copy.",
        notes: [],
      },
      {
        slot: "Toolbar",
        intent: "Expose the few tools that change the canvas.",
        layout: "A single vertical or horizontal tool rail; icon buttons with labels on hover and focus.",
        needs: ["button", "dropdown", "badge"],
        copyDirection: "Tool names are verbs or nouns the user already knows.",
        notes: [],
      },
      {
        slot: "Canvas",
        intent: "Make the work dominant and the preview honest.",
        layout: "A large canvas or preview area with a clear boundary; code or inspector in a secondary pane.",
        needs: ["preview", "code"],
        copyDirection: "Label the current mode and device.",
        notes: ["No local editor canvas primitive; PreviewFrame is a preview surface, not a canvas."],
      },
      {
        slot: "Inspector",
        intent: "Change properties without losing canvas context.",
        layout: "A narrow inspector with labelled fields and a clear reset path.",
        needs: ["input", "switch", "select"],
        copyDirection: "Use the property name as the label; show units.",
        notes: [],
      },
    ],
    wireframe: box.editor,
    gaps: [
      "No local editor canvas primitive; PreviewFrame is a preview surface, not an editing canvas.",
      "No local editor toolbar rail primitive; compose it from Button and Dropdown.",
    ],
    copyRules: [
      "Show file and save state at all times.",
      "Label tools by the action they perform.",
      "Do not hide destructive actions in an overflow menu without warning.",
    ],
    risks: [
      "Do not let the inspector become a second page.",
      "Do not use constant animated grid backgrounds.",
      "Do not make every tool a rounded card.",
    ],
    accessibility: [
      "Every icon-only tool has an accessible name.",
      "Keyboard shortcuts are discoverable and do not conflict with browser shortcuts.",
      "Canvas focus is visible and does not trap the user.",
    ],
    specificity: [
      "Keep canvas and inspector widths tokenised; no inline pixel widths.",
      "Do not override focus rings inside the canvas.",
    ],
  },
  marketplace: {
    slots: [
      {
        slot: "Navigation",
        intent: "Help users move between browse, search and detail.",
        layout: "A persistent category rail plus a top search and account bar. Keep the rail collapsible.",
        needs: ["app-header", "sidebar"],
        copyDirection: "Category labels are nouns; current category is marked with more than colour.",
        notes: [],
      },
      {
        slot: "Search",
        intent: "Make the catalogue searchable without hiding browse.",
        layout: "One search field or command palette trigger in the header; results overlay the page.",
        needs: ["search"],
        copyDirection: "Placeholder names what can be searched.",
        notes: [],
      },
      {
        slot: "Rails and grid",
        intent: "Offer a curated entry point and a dense browse path.",
        layout: "One or two rails, then a grid or list. Do not repeat the same card treatment for both.",
        needs: ["rail", "card", "results"],
        copyDirection: "Section headings name the curation logic: New this week, Most used.",
        notes: ["Use real previews or labelled generated fallbacks."],
      },
      {
        slot: "Detail",
        intent: "Move from comparison to implementation.",
        layout: "Preview, code, install and metadata in one reading order; keep the primary action sticky.",
        needs: ["detail", "preview", "install"],
        copyDirection: "Name what the code does and what the install command changes.",
        notes: ["Do not show a live preview state that does not exist."],
      },
    ],
    wireframe: box.marketplace,
    gaps: ["No local generic table primitive for dense comparison; use ComponentListRow or add one."],
    copyRules: [
      "Show real previews; label generated fallbacks.",
      "Keep browse and compare as distinct modes.",
      "Do not invent usage counts or ratings.",
    ],
    risks: [
      "Do not make the marketplace a single uniform card grid.",
      "Do not hide install instructions below three screens of metadata.",
      "Do not show a preview that does not match the code.",
    ],
    accessibility: [
      "Preview controls have accessible names.",
      "Category navigation uses aria-current.",
      "Dense lists preserve keyboard order and visible focus.",
    ],
    specificity: [
      "Keep one card radius and one preview frame treatment.",
      "Do not override card padding per rail.",
    ],
  },
  profile: {
    slots: [
      {
        slot: "Identity",
        intent: "Establish who the person is and what they make.",
        layout: "A left-aligned identity block with name, role and one action; no giant centered avatar.",
        needs: ["avatar", "profile"],
        copyDirection: "Use the real name, role and a specific sentence about the work.",
        notes: [],
      },
      {
        slot: "Proof",
        intent: "Show real work and real numbers only.",
        layout: "A narrow metadata row with real counts, years or selected clients; omit if unavailable.",
        needs: ["badge"],
        copyDirection: "Label every number and its source or period.",
        notes: ["Do not invent follower counts or client logos."],
      },
      {
        slot: "Work",
        intent: "Let the work carry the page.",
        layout: "An asymmetric grid with one dominant project and two supporting pieces; captions share a baseline.",
        needs: ["grid", "card"],
        copyDirection: "Project titles name the work; captions add year, medium or role.",
        notes: [],
      },
      {
        slot: "Action",
        intent: "Give one clear way to start a conversation.",
        layout: "One primary action near the identity block; no repeated CTA in every project.",
        needs: ["button"],
        copyDirection: "Start a project, Email [name].",
        notes: [],
      },
    ],
    wireframe: box.profile,
    gaps: ["No local project-card primitive; ComponentCard is catalogue-specific. Compose a project tile or add one."],
    copyRules: [
      "Use the real name and role.",
      "Captions name the work, year and role.",
      "Do not invent client logos, awards or follower counts.",
    ],
    risks: [
      "Do not make the page a grid of identical project cards.",
      "Do not hide the work below a giant statement.",
      "Do not use a generic avatar silhouette when a real image exists.",
    ],
    accessibility: [
      "Project images have alt text that names the work.",
      "The primary contact action is keyboard reachable.",
      "Headings follow the page outline.",
    ],
    specificity: [
      "Keep caption typography on one baseline.",
      "Use one tile treatment; do not override radius per project.",
    ],
  },
  generic: {
    slots: [
      {
        slot: "Frame",
        intent: "Orient the user and expose one primary action.",
        layout: "A quiet header with wordmark, context and one action; a single content column below.",
        needs: ["app-header", "shell"],
        copyDirection: "Name the surface and the current context.",
        notes: [],
      },
      {
        slot: "Primary task",
        intent: "Make the main job obvious and measurable.",
        layout: "A left-aligned task area with a clear input and outcome; supporting context in a narrow rail.",
        needs: ["card", "grid"],
        copyDirection: "State the job and the next action.",
        notes: ["Choose a concrete surface type for a more specific plan."],
      },
      {
        slot: "Action",
        intent: "Give the user one way forward.",
        layout: "One primary action after the task; secondary actions are text or outline.",
        needs: ["button"],
        copyDirection: "Use an action-specific verb.",
        notes: [],
      },
      {
        slot: "Feedback",
        intent: "Confirm the outcome and expose the next step.",
        layout: "Inline confirmation or a polite toast; no modal for a non-blocking result.",
        needs: ["toast", "badge"],
        copyDirection: "State what changed and what to do next.",
        notes: [],
      },
    ],
    wireframe: box.generic,
    gaps: ["Surface type was generic; choose landing, dashboard, auth or another concrete surface for a sharper plan."],
    copyRules: COMMON_COPY,
    risks: [
      "Do not let a generic brief turn into a generic SaaS card grid.",
      "Do not add an eyebrow above every heading.",
    ],
    accessibility: COMMON_A11Y,
    specificity: COMMON_SPECIFICITY,
  },
};
