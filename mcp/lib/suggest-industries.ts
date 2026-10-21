export type IndustryKey =
  | "fintech"
  | "health"
  | "education"
  | "developer"
  | "commerce"
  | "creative"
  | "productivity"
  | "travel"
  | "ai"
  | "realestate"
  | "default";

export interface IndustrySeed {
  label: string;
  audience: string;
  thesis: (subject: string) => string;
  palette: { role: string; hex: string; use: string }[];
  typography: { display: string; body: string; mono: string; rationale: string };
  alignment: string;
  motion: string;
  copy: string;
  rejected: string[];
  alternates: { name: string; thesis: string; whenToUse: string }[];
}

export const INDUSTRIES: Record<IndustryKey, IndustrySeed> = {
  fintech: {
    label: "finance and operations",
    audience: "finance, treasury and operations teams",
    thesis: (subject) =>
      `Treat ${subject} as a ledger, not a dashboard: ink on bone, tabular numerals, and one brass signal for money movement.`,
    palette: [
      { role: "ink", hex: "#101C18", use: "Primary type, rules and the ledger header." },
      { role: "paper", hex: "#F4EFE5", use: "Page ground and quiet table rows." },
      { role: "brass", hex: "#A8793B", use: "The single accent for money movement and primary action." },
      { role: "pine", hex: "#2F5D50", use: "Positive balances and confirmed states." },
      { role: "signal", hex: "#B4472F", use: "Overdue, blocked or at-risk states only." },
    ],
    typography: {
      display: "Averia Serif Libre",
      body: "General Sans",
      mono: "SF Mono",
      rationale:
        "A serif display makes the surface read like a statement; grotesk body keeps dense figures legible; mono is reserved for account numbers, dates and ledger labels.",
    },
    alignment:
      "A 12-column ledger with a 220px metadata rail. Labels left-align; figures right-align and use tabular numerals. Rules separate periods, not every row.",
    motion:
      "One 360ms staged load: header, balance, then ledger rows. Selection is a single row highlight; no per-row hover scale. Honour reduced motion.",
    copy:
      "Use ledger language: balance, settle, reconcile, outstanding. CTAs: Review transfers, Export statement, Reconcile account. Do not use Get started.",
    rejected: [
      "A centered fintech hero with a purple gradient and three feature cards.",
      "Neon green on near-black as a shortcut for money.",
      "Invented AUM, transaction volume or customer logos.",
    ],
    alternates: [
      {
        name: "The brass terminal",
        thesis: "Invert the values: dark ink canvas, paper type, one brass signal for money movement.",
        whenToUse: "Low-light trading, monitoring or operations rooms.",
      },
      {
        name: "The statement",
        thesis: "Use a paper statement with ruled margins, stamps and annotated totals as the structure.",
        whenToUse: "Advisory, reconciliation and month-end review contexts.",
      },
    ],
  },
  health: {
    label: "health and care",
    audience: "clinicians, care teams and patients",
    thesis: (subject) =>
      `Treat ${subject} as a clinical record: calm margins, legible data, and one clay signal for attention.`,
    palette: [
      { role: "ink", hex: "#1C2A28", use: "Primary type and clinical headings." },
      { role: "paper", hex: "#F7F4EE", use: "Page ground and patient-facing surfaces." },
      { role: "sage", hex: "#5B7F72", use: "Confirmed appointments and stable observations." },
      { role: "clay", hex: "#C9856A", use: "One warm accent for care actions and focus." },
      { role: "signal", hex: "#8C3B2E", use: "Urgent flags only; never decorative." },
    ],
    typography: {
      display: "Averia Serif Libre",
      body: "General Sans",
      mono: "SF Mono",
      rationale:
        "Serif display adds a human, record-like tone; body stays neutral and readable; mono is limited to dosages, dates and identifiers.",
    },
    alignment:
      "Asymmetric clinical sheet: a wide reading column with a narrow observation rail. Keep generous line height and never centre long copy.",
    motion:
      "Reserve motion for state changes: a calm 240ms panel reveal when a record opens. No ambient animation. Honour reduced motion.",
    copy:
      "Use plain clinical language and avoid alarm. CTAs: Book appointment, View care plan, Add observation. Avoid Submit.",
    rejected: [
      "Medical stock photography with a blue gradient overlay.",
      "A dashboard that turns every patient into a rounded card.",
      "Colour-only status for urgent observations.",
    ],
    alternates: [
      {
        name: "The care note",
        thesis: "A warm paper record with annotated margins, handwritten-style stamps and a calm reading column.",
        whenToUse: "Patient-facing summaries and care plans.",
      },
      {
        name: "The observation room",
        thesis: "A darker, low-glare surface with precise mono observations and one clay alert.",
        whenToUse: "Clinical monitoring and night-shift workflows.",
      },
    ],
  },
  education: {
    label: "learning and education",
    audience: "learners, instructors and programme teams",
    thesis: (subject) =>
      `Treat ${subject} as an annotated workbook: ruled structure, margin notes, and one ochre signal for progress.`,
    palette: [
      { role: "ink", hex: "#1F2933", use: "Primary type and workbook headings." },
      { role: "paper", hex: "#F6F1E7", use: "Page ground and reading surfaces." },
      { role: "cobalt", hex: "#2F5D8C", use: "Links, active lessons and navigation." },
      { role: "ochre", hex: "#C48A2C", use: "Progress and one primary action." },
      { role: "plum", hex: "#6B4C7A", use: "Reflection prompts and instructor notes." },
    ],
    typography: {
      display: "Averia Serif Libre",
      body: "General Sans",
      mono: "SF Mono",
      rationale:
        "Serif display gives the page a workbook voice; body remains direct; mono marks code, citations and exercise numbers.",
    },
    alignment:
      "A ruled two-column workbook: lesson body at 65ch, margin notes in a narrow rail, numbered steps aligned to the baseline.",
    motion:
      "One staged reveal per lesson: title, then margin note, then exercise. No hover animation on every lesson card. Honour reduced motion.",
    copy:
      "Use verb-led lesson language: Practise, Review, Submit attempt. Avoid gamified hype and vague Level up copy unless the brief asks for it.",
    rejected: [
      "A purple gradient e-learning hero with floating cards.",
      "Confetti and badges as the only progress model.",
      "Fabricated completion rates or testimonial quotes.",
    ],
    alternates: [
      {
        name: "The seminar board",
        thesis: "A dark chalkboard surface with chalk-white type, one ochre underline and generous negative space.",
        whenToUse: "Live workshops and cohort-based teaching.",
      },
      {
        name: "The field notebook",
        thesis: "A compact, tabbed notebook with ruled pages, index marks and marginalia.",
        whenToUse: "Self-paced courses and research-heavy curricula.",
      },
    ],
  },
  developer: {
    label: "developer tools",
    audience: "engineers and technical buyers",
    thesis: (subject) =>
      `Treat ${subject} as a terminal-adjacent workbench: dense mono metadata, warm paper, and one amber signal for state.`,
    palette: [
      { role: "ink", hex: "#111315", use: "Primary type and code chrome." },
      { role: "paper", hex: "#EDEAE4", use: "Page ground; keep code blocks darker than prose." },
      { role: "amber", hex: "#D9A441", use: "One accent for commands, state and focus." },
      { role: "teal", hex: "#5E8C8A", use: "Successful runs and stable signals." },
      { role: "signal", hex: "#C4553D", use: "Errors and destructive actions." },
    ],
    typography: {
      display: "General Sans",
      body: "General Sans",
      mono: "SF Mono",
      rationale:
        "A precise grotesk keeps the page from becoming a code cosplay; mono is used for commands, identifiers and measured metadata, not every label.",
    },
    alignment:
      "A left-aligned workbench: a 56px command rail, a 72ch prose column, and code blocks that break the grid only when they carry the primary example.",
    motion:
      "One 300ms command-palette transition and a single copy confirmation. No looping terminal cursors or hover glow. Honour reduced motion.",
    copy:
      "State the capability, the input and the result. CTAs: Create API key, Run locally, View request logs. Avoid Supercharge your workflow.",
    rejected: [
      "Neon green on near-black with fake terminal chrome.",
      "A centered hero with a purple gradient and floating code cards.",
      "Invented latency, uptime or customer logos.",
    ],
    alternates: [
      {
        name: "The runbook",
        thesis: "A paper runbook with numbered commands, margin warnings and one amber action.",
        whenToUse: "Onboarding and operational documentation.",
      },
      {
        name: "The console",
        thesis: "A low-contrast dark console with mono data, warm amber state and no decorative glow.",
        whenToUse: "Observability and incident response surfaces.",
      },
    ],
  },
  commerce: {
    label: "commerce and retail",
    audience: "shoppers and merchandisers",
    thesis: (subject) =>
      `Treat ${subject} as a catalogue index: editorial product hierarchy, oxblood accents, and price as a first-class column.`,
    palette: [
      { role: "ink", hex: "#1A1714", use: "Primary type and product names." },
      { role: "paper", hex: "#FAF6EF", use: "Page ground and product surfaces." },
      { role: "oxblood", hex: "#8E3B32", use: "One accent for purchase actions and editorial marks." },
      { role: "brass", hex: "#B58B4A", use: "Price emphasis and quiet metadata." },
      { role: "forest", hex: "#355E4B", use: "In-stock and confirmed states." },
    ],
    typography: {
      display: "Averia Serif Libre",
      body: "General Sans",
      mono: "SF Mono",
      rationale:
        "Serif display gives products editorial weight; grotesk body keeps specifications scannable; mono is limited to SKUs and prices.",
    },
    alignment:
      "An asymmetric catalogue: a 2:1 editorial hero, then a 3-column product index with prices aligned to a common right edge. Do not centre every product card.",
    motion:
      "One 280ms image crossfade on product change; no lift or scale on every card. Honour reduced motion.",
    copy:
      "Name the object and the reason to care. CTAs: Add to bag, View size guide, Check delivery. Avoid Shop now as the only action.",
    rejected: [
      "A centered hero with a discount badge and three identical product cards.",
      "Fake countdown timers and invented urgency.",
      "Fabricated reviews or star ratings.",
    ],
    alternates: [
      {
        name: "The lookbook",
        thesis: "A full-bleed editorial lookbook with captions, provenance and a single purchase rail.",
        whenToUse: "Fashion, furniture and high-consideration goods.",
      },
      {
        name: "The stockroom",
        thesis: "A dense, utilitarian index with SKUs, stock states and price columns.",
        whenToUse: "Trade, wholesale and replenishment tools.",
      },
    ],
  },
  creative: {
    label: "creative and studio work",
    audience: "prospective clients, collaborators and curators",
    thesis: (subject) =>
      `Treat ${subject} as a gallery wall: large type, off-grid compositions, and one vermilion signal for action.`,
    palette: [
      { role: "ink", hex: "#141414", use: "Primary type and image captions." },
      { role: "paper", hex: "#F1ECE4", use: "Page ground and quiet space around work." },
      { role: "vermilion", hex: "#C94F2C", use: "One action or current-work marker." },
      { role: "cobalt", hex: "#2F4B7C", use: "Project metadata and links." },
      { role: "sand", hex: "#C9B79C", use: "Secondary surfaces and captions." },
    ],
    typography: {
      display: "Averia Serif Libre",
      body: "General Sans",
      mono: "SF Mono",
      rationale:
        "An expressive serif display carries the work; grotesk body stays out of the way; mono marks project years, dimensions and client names.",
    },
    alignment:
      "An off-grid gallery: one dominant work, two supporting pieces offset on different baselines, captions aligned to a shared metadata column.",
    motion:
      "One 500ms image reveal for the selected work; no hover tilt or parallax on every tile. Honour reduced motion.",
    copy:
      "Write like a wall label: title, year, medium, one sentence of intent. CTAs: View project, Start a conversation. Avoid Explore our work.",
    rejected: [
      "A dark portfolio with a purple gradient and three identical project cards.",
      "Invented client logos or awards.",
      "A giant Hello with no work above the fold.",
    ],
    alternates: [
      {
        name: "The index",
        thesis: "A typographic index of works with years, mediums and one selected image.",
        whenToUse: "Large archives and research-led practices.",
      },
      {
        name: "The projection",
        thesis: "A dark room with one lit work and minimal captions.",
        whenToUse: "Film, photography and immersive installations.",
      },
    ],
  },
  productivity: {
    label: "productivity and work management",
    audience: "teams coordinating work",
    thesis: (subject) =>
      `Treat ${subject} as a workbench: a stable rail, dense but calm rows, and one cobalt signal for the next action.`,
    palette: [
      { role: "ink", hex: "#191B1A", use: "Primary type and structural rules." },
      { role: "paper", hex: "#F3F1EC", use: "Page ground and quiet panels." },
      { role: "cobalt", hex: "#3556A8", use: "One accent for the next action and current selection." },
      { role: "amber", hex: "#C98A2E", use: "Waiting and attention states." },
      { role: "teal", hex: "#2F6F68", use: "Done and healthy states." },
    ],
    typography: {
      display: "General Sans",
      body: "General Sans",
      mono: "SF Mono",
      rationale:
        "A neutral grotesk keeps long work sessions calm; mono is used for dates, IDs and keyboard shortcuts, not for every label.",
    },
    alignment:
      "A stable three-pane workbench: rail, list, detail. The middle pane uses dense rows with a shared baseline; the detail pane is the only place with large type.",
    motion:
      "One 200ms pane transition when selection changes; no card lift. Honour reduced motion.",
    copy:
      "Use task language: assign, review, close, block. CTAs: Create task, Assign owner, Mark done. Avoid Boost productivity.",
    rejected: [
      "A kanban board made of identical rounded cards with hover lift.",
      "A centered marketing hero inside the product.",
      "Fabricated team avatars or activity metrics.",
    ],
    alternates: [
      {
        name: "The ledger of work",
        thesis: "A table-first workspace with one row per commitment and a narrow detail rail.",
        whenToUse: "Operations and high-volume task management.",
      },
      {
        name: "The desk",
        thesis: "A warm paper workspace with pinned notes and a single active task.",
        whenToUse: "Personal planning and focus modes.",
      },
    ],
  },
  travel: {
    label: "travel and hospitality",
    audience: "travellers, guests and hosts",
    thesis: (subject) =>
      `Treat ${subject} as a postcard: full-bleed imagery, captions with provenance, and one terracotta signal for booking.`,
    palette: [
      { role: "ink", hex: "#231F1A", use: "Primary type and captions." },
      { role: "paper", hex: "#F8F1E4", use: "Page ground and reading surfaces." },
      { role: "terracotta", hex: "#B24A2F", use: "One accent for booking and current selection." },
      { role: "forest", hex: "#2E5E4E", use: "Availability and confirmed states." },
      { role: "saffron", hex: "#D9A441", use: "Ratings and seasonal metadata." },
    ],
    typography: {
      display: "Averia Serif Libre",
      body: "General Sans",
      mono: "SF Mono",
      rationale:
        "Serif display carries a sense of place; body stays practical; mono handles dates, prices and booking references.",
    },
    alignment:
      "A postcard composition: one full-bleed image, a caption block on the lower-left, and a compact booking rail on the right. Let images break the grid.",
    motion:
      "One 500ms image reveal when a destination changes; no parallax on every section. Honour reduced motion.",
    copy:
      "Write with place and provenance: where, when, what is included. CTAs: Check availability, Reserve dates, View itinerary. Avoid Book your dream trip.",
    rejected: [
      "A full-screen tropical video with a centered translucent search card.",
      "Invented ratings, reviews or best price claims.",
      "A grid of identical destination cards with hover zoom.",
    ],
    alternates: [
      {
        name: "The field guide",
        thesis: "A paper guide with maps, annotations and one terracotta route marker.",
        whenToUse: "Itineraries and slow-travel planning.",
      },
      {
        name: "The lobby",
        thesis: "A warm, low-lit hospitality surface with one large image and a quiet booking rail.",
        whenToUse: "Hotels and premium stays.",
      },
    ],
  },
  ai: {
    label: "AI and intelligent systems",
    audience: "operators, analysts and technical evaluators",
    thesis: (subject) =>
      `Treat ${subject} as an instrument panel: subdued surfaces, precise mono labels, and one brass signal for confidence.`,
    palette: [
      { role: "ink", hex: "#101315", use: "Primary type and control chrome." },
      { role: "paper", hex: "#ECE9E2", use: "Page ground; keep generated output on a distinct surface." },
      { role: "brass", hex: "#B08A4F", use: "One accent for confidence and primary action." },
      { role: "sage", hex: "#607D6B", use: "Accepted output and stable states." },
      { role: "signal", hex: "#A84B3A", use: "Uncertain, failed or human-review states." },
    ],
    typography: {
      display: "General Sans",
      body: "General Sans",
      mono: "SF Mono",
      rationale:
        "A restrained grotesk avoids sci-fi cosplay; mono is used for model names, token counts and provenance, not for every label.",
    },
    alignment:
      "An instrument panel: prompt column, output column, and a narrow provenance rail. Keep a visible boundary between human input and generated output.",
    motion:
      "A single 220ms state change when a response arrives; no pulsing gradient or perpetual shimmer. Honour reduced motion.",
    copy:
      "State what the system does, what it needs and what it will not do. CTAs: Run analysis, Review output, Approve suggestion. Avoid Unleash the power of AI.",
    rejected: [
      "A purple-blue gradient with floating orbs and a glassmorphic prompt box.",
      "Neon green on near-black as a shorthand for intelligence.",
      "Invented accuracy, benchmark or customer claims.",
    ],
    alternates: [
      {
        name: "The review desk",
        thesis: "A paper-first human review surface with generated output clearly stamped and one brass approval.",
        whenToUse: "Human-in-the-loop review and compliance.",
      },
      {
        name: "The observatory",
        thesis: "A dark, quiet panel with mono provenance and no decorative glow.",
        whenToUse: "Model monitoring and evaluation.",
      },
    ],
  },
  realestate: {
    label: "property and architecture",
    audience: "buyers, sellers, renters and agents",
    thesis: (subject) =>
      `Treat ${subject} as a plan drawing: measured alignment, annotated margins, and one redline signal for decisions.`,
    palette: [
      { role: "ink", hex: "#1C1C1C", use: "Primary type and drawing rules." },
      { role: "paper", hex: "#F4F1EA", use: "Page ground and plan surfaces." },
      { role: "umber", hex: "#7A5C3E", use: "Material and location metadata." },
      { role: "slate", hex: "#4C6B6F", use: "Secondary data and map context." },
      { role: "redline", hex: "#B23A2E", use: "One decision marker, offer or alert." },
    ],
    typography: {
      display: "Averia Serif Libre",
      body: "General Sans",
      mono: "SF Mono",
      rationale:
        "Serif display adds an architectural, editorial tone; grotesk body keeps listings scannable; mono is used for measurements, dates and references.",
    },
    alignment:
      "A measured plan: a 12-column drawing grid, annotated margins, and images aligned to structural lines rather than centred cards.",
    motion:
      "One 320ms plan transition when a floor or listing changes; no hover zoom on every image. Honour reduced motion.",
    copy:
      "State the property, location, size and status plainly. CTAs: Request a viewing, Download floor plan, Make an offer. Avoid Find your dream home.",
    rejected: [
      "A centered hero with a translucent search bar over a generic house photo.",
      "Invented square footage, price drops or exclusive claims.",
      "A grid of identical listing cards with hover lift.",
    ],
    alternates: [
      {
        name: "The site visit",
        thesis: "A field-notes composition with plans, photographs and handwritten annotations.",
        whenToUse: "Architecture and development sales.",
      },
      {
        name: "The register",
        thesis: "A dense property register with measured columns and one redline decision.",
        whenToUse: "Agency and portfolio management.",
      },
    ],
  },
  default: {
    label: "the product subject",
    audience: "the product primary user",
    thesis: (subject) =>
      `Treat ${subject} as editorial utility: warm paper, ink typography, and one iris signal for the primary action.`,
    palette: [
      { role: "ink", hex: "#181512", use: "Primary type and rules." },
      { role: "paper", hex: "#F7F4EE", use: "Page ground and quiet surfaces." },
      { role: "iris", hex: "#6D28D9", use: "The single primary action and current selection." },
      { role: "teal", hex: "#0F766E", use: "Confirmed and healthy states." },
      { role: "rust", hex: "#C2410C", use: "Warnings and destructive states only." },
    ],
    typography: {
      display: "Averia Serif Libre",
      body: "General Sans",
      mono: "SF Mono",
      rationale:
        "Serif display gives the interface a point of view; grotesk body keeps the product usable; mono is reserved for metadata and code.",
    },
    alignment:
      "A left-aligned 12-column editorial grid with an asymmetric hero and a narrow metadata rail. Do not centre every section.",
    motion:
      "One staged load sequence and one state-change transition. No uniform card hover animation. Honour reduced motion.",
    copy:
      "Lead with the product job. Use action-specific CTAs and sentence case. Do not invent proof.",
    rejected: [
      "A centered SaaS hero with a purple gradient and three feature cards.",
      "Italic or coloured word accents inside headlines.",
      "Glassmorphism panels and decorative eyebrow labels.",
    ],
    alternates: [
      {
        name: "The field note",
        thesis: "A paper-first composition with annotated margins and one iris action.",
        whenToUse: "Explanation-heavy products and professional tools.",
      },
      {
        name: "The signal room",
        thesis: "A low-light control surface with one warm signal and precise mono metadata.",
        whenToUse: "Monitoring, operations and expert tools.",
      },
    ],
  },
};
