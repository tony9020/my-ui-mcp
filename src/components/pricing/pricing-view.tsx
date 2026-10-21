"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Minus, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  tagline: string;
  monthly: number | null;
  annual: number | null;
  unit?: string;
  cta: string;
  href: string;
  featured?: boolean;
  features: string[];
  limits: string[];
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "For side projects and first experiments.",
    monthly: 0,
    annual: 0,
    cta: "Start for free",
    href: "/sign-in",
    features: [
      "Browse the full component library",
      "Copy any prompt or install command",
      "Community support",
    ],
    limits: ["No private components", "5 saved collections"],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For design engineers shipping every week.",
    monthly: 20,
    annual: 16,
    cta: "Upgrade to Pro",
    href: "/sign-in",
    featured: true,
    features: [
      "Everything in Free",
      "Unlimited saved collections",
      "Private components & drafts",
      "Agent-ready MCP endpoint",
      "Early access to new blocks",
    ],
    limits: ["1 seat", "Priority queue for indexing"],
  },
  {
    id: "team",
    name: "Team",
    tagline: "A shared library for the whole product org.",
    monthly: 40,
    annual: 32,
    unit: "per seat",
    cta: "Start a team",
    href: "/sign-in",
    features: [
      "Everything in Pro",
      "Shared team collections & tokens",
      "Role-based publishing",
      "Theme sync across projects",
      "Usage analytics",
    ],
    limits: ["Unlimited seats"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Compliance, SSO and a private registry.",
    monthly: null,
    annual: null,
    cta: "Talk to us",
    href: "/sign-in",
    features: [
      "Everything in Team",
      "SSO / SAML and SCIM",
      "Private registry mirror",
      "Audit logs & DPA",
      "Dedicated success engineer",
    ],
    limits: ["Custom terms"],
  },
];

const COMPARISON: { label: string; values: (boolean | string)[] }[] = [
  { label: "Browse the library", values: [true, true, true, true] },
  { label: "Copy prompts & CLI installs", values: [true, true, true, true] },
  { label: "Saved collections", values: ["5", "Unlimited", "Unlimited", "Unlimited"] },
  { label: "Private components", values: [false, true, true, true] },
  { label: "Agent / MCP endpoint", values: [false, true, true, true] },
  { label: "Shared team tokens", values: [false, false, true, true] },
  { label: "SSO / SAML", values: [false, false, false, true] },
  { label: "Private registry mirror", values: [false, false, false, true] },
  { label: "Support", values: ["Community", "Email", "Priority", "Dedicated"] },
];

const FAQ = [
  {
    q: "Is everything installed as source?",
    a: "Yes. The shadcn CLI copies the component into your repo — there is no runtime dependency to keep in sync, and no vendor lock-in. You own the code you install.",
  },
  {
    q: "What does the free plan actually limit?",
    a: "Browsing, previewing, copying prompts and installing components are unlimited on Free. Paid plans add private components, saved collections, team sharing and the agent endpoint.",
  },
  {
    q: "Can I use these components commercially?",
    a: "Components are MIT licensed by default, so you can ship them in client work and products. A small number of community entries carry their own license, shown on every component page.",
  },
  {
    q: "How does annual billing work?",
    a: "Annual billing is 20% cheaper and charged once per year. You can switch or cancel at any time from your account settings, and unused time is prorated.",
  },
  {
    q: "Do you offer student or open-source discounts?",
    a: "Yes — Pro is free for verified students, and for maintainers of open-source projects with more than 500 stars. Get in touch and we'll enable it on your account.",
  },
];

export function PricingView() {
  const [annual, setAnnual] = React.useState(true);

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6">
      {/* ------------------------------------------------------------ header */}
      <header className="mx-auto max-w-[60ch] text-center">
        <Badge variant="new" className="gap-1">
          <Sparkles className="size-3" />
          Pricing
        </Badge>
        <h1 className="mt-4 text-balance text-[clamp(30px,4.4vw,48px)] font-medium leading-[1.08] tracking-tight">
          Free to browse.
          <span className="font-serif font-normal italic text-brand"> Priced to build.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-[52ch] text-pretty text-[17px] leading-relaxed text-muted-foreground">
          Every component is open source and installable on the free plan. Upgrade when you need
          private blocks, team sharing or an agent endpoint.
        </p>

        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5">
          <span className={cn("text-[14px]", !annual && "font-medium")}>Monthly</span>
          <Switch checked={annual} onCheckedChange={setAnnual} label="" />
          <span className={cn("text-[14px]", annual && "font-medium")}>Annual</span>
          <Badge variant="success">−20%</Badge>
        </div>
      </header>

      {/* ------------------------------------------------------------- plans */}
      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan) => {
          const price = annual ? plan.annual : plan.monthly;
          return (
            <article
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6",
                plan.featured
                  ? "border-brand/40 shadow-[0_20px_60px_-30px_rgba(0,51,255,0.5)]"
                  : "border-border",
              )}
            >
              {plan.featured ? (
                <span className="absolute -top-3 left-6">
                  <Badge variant="brand">Most popular</Badge>
                </span>
              ) : null}

              <h2 className="text-[17px] font-medium">{plan.name}</h2>
              <p className="mt-1.5 min-h-[2.5rem] text-[13px] leading-relaxed text-muted-foreground">
                {plan.tagline}
              </p>

              <div className="mt-5 flex items-baseline gap-1.5">
                {price === null ? (
                  <span className="text-[32px] font-medium tracking-tight">Custom</span>
                ) : (
                  <>
                    <span className="text-[36px] font-medium leading-none tracking-tight tabular-nums">
                      ${price}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      /{plan.unit ? "seat/" : ""}mo
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {plan.id === "free"
                  ? "Free forever"
                  : price === null
                    ? "Annual contract"
                    : annual
                      ? "Billed annually"
                      : "Billed monthly"}
              </p>

              <Link
                href={plan.href}
                className={cn(
                  buttonVariants({ variant: plan.featured ? "brand" : "outline", size: "lg" }),
                  "mt-6 w-full",
                )}
              >
                {plan.cta}
                <ArrowRight className="size-4" />
              </Link>

              <ul className="mt-6 flex flex-col gap-2.5 text-[13px]">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <ul className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-[13px] text-muted-foreground">
                {plan.limits.map((l) => (
                  <li key={l} className="flex gap-2.5">
                    <Minus className="mt-0.5 size-4 shrink-0 opacity-60" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      {/* -------------------------------------------------------- comparison */}
      <section className="mt-20">
        <h2 className="text-[22px] font-medium tracking-tight">Compare plans</h2>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Everything that changes between tiers, in one table.
        </p>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[720px] border-collapse text-[14px]">
            <caption className="sr-only">Plan comparison</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-5 py-4 text-left font-medium text-muted-foreground">
                  Feature
                </th>
                {PLANS.map((p) => (
                  <th
                    key={p.id}
                    scope="col"
                    className={cn(
                      "px-5 py-4 text-left font-medium",
                      p.featured && "text-brand",
                    )}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <th scope="row" className="px-5 py-3.5 text-left font-normal text-muted-foreground">
                    {row.label}
                  </th>
                  {row.values.map((v, i) => (
                    <td key={i} className="px-5 py-3.5">
                      {typeof v === "boolean" ? (
                        v ? (
                          <Check aria-label="Included" className="size-4 text-brand" />
                        ) : (
                          <span aria-label="Not included" className="text-muted-foreground/50">
                            —
                          </span>
                        )
                      ) : (
                        <span className="tabular-nums">{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* --------------------------------------------------------------- FAQ */}
      <section className="mt-20 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div>
          <h2 className="text-[22px] font-medium tracking-tight">Questions, answered</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Still unsure? Browse the library for free — nothing here is gated behind a paywall that
            stops you from shipping.
          </p>
          <Link
            href="/community/components"
            className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand underline-offset-4 hover:underline"
          >
            Browse components
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <FaqList items={FAQ} />
      </section>

      {/* --------------------------------------------------------------- CTA */}
      <section className="relative mt-20 overflow-hidden rounded-3xl border border-border bg-card p-8 text-center sm:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 h-64 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(50% 80% at 50% 100%, color-mix(in oklab, var(--brand) 28%, transparent), transparent 70%)",
          }}
        />
        <div className="relative">
          <h2 className="mx-auto max-w-[24ch] text-balance text-[clamp(24px,3.2vw,36px)] font-medium leading-tight tracking-tight">
            Start with the free plan today
          </h2>
          <p className="mx-auto mt-3 max-w-[46ch] text-[15px] text-muted-foreground">
            No credit card. Install your first component in under a minute.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-in"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 text-[15px] font-medium text-brand-foreground transition-transform hover:scale-[1.02]"
            >
              Create free account
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/community/components"
              className="inline-flex h-11 items-center rounded-full border border-border px-6 text-[15px] font-medium transition-colors hover:bg-muted"
            >
              Explore the library
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FaqList({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = React.useState<number | null>(0);
  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-[15px] font-medium">{item.q}</span>
                <span
                  aria-hidden
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-45",
                  )}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              className={cn(
                "grid transition-all duration-300",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-[14px] leading-relaxed text-muted-foreground">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
