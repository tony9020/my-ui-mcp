"use client";

import * as React from "react";
import Link from "next/link";
import { Apple, ArrowLeft, Check, Chrome, Eye, EyeOff, Github, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/menu";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

const BENEFITS = [
  "Save components into collections you can share with your team",
  "Publish private components only your workspace can see",
  "Keep every project on the same set of design tokens",
  "Sync your library to your agent through the MCP endpoint",
];

export function SignInForm() {
  const [mode, setMode] = React.useState<Mode>("signin");
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [done, setDone] = React.useState(false);

  const isSignUp = mode === "signup";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      toast("Check your details", "Enter a valid email and a password of at least 6 characters.");
      return;
    }
    setDone(true);
    toast(isSignUp ? "Welcome to My Ui" : "Signed in", "This is a static recreation — no account was created.");
  };

  return (
    <div className="mx-auto grid w-full max-w-[1000px] grid-cols-1 gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-20">
      {/* -------------------------------------------------------- value prop */}
      <aside className="hidden flex-col justify-center lg:flex">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to the library
        </Link>

        <h1 className="mt-8 text-balance text-[clamp(28px,3.4vw,40px)] font-medium leading-[1.1] tracking-tight">
          Join the <span className="font-serif font-normal italic text-brand">living</span> library of
          interfaces
        </h1>
        <p className="mt-4 max-w-[46ch] text-pretty text-[16px] leading-relaxed text-muted-foreground">
          8,000+ crafted React components, templates and themes — indexed, searchable and one prompt
          away.
        </p>

        <ul className="mt-8 flex flex-col gap-3.5">
          {BENEFITS.map((b) => (
            <li key={b} className="flex gap-3 text-[14px] leading-relaxed">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-muted text-brand dark:bg-brand/15 dark:text-[#8f9dff]">
                <Check className="size-3" />
              </span>
              <span className="text-muted-foreground">{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex items-center gap-2.5 rounded-2xl border border-border bg-card p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-muted text-brand dark:bg-brand/15 dark:text-[#8f9dff]">
            <ShieldCheck className="size-4" />
          </span>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Components are MIT licensed by default. Install them as source — no runtime dependency,
            no lock-in.
          </p>
        </div>
      </aside>

      {/* -------------------------------------------------------------- form */}
      <section className="mx-auto w-full max-w-[420px]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </Link>
          </div>

          <header className="mt-4 lg:mt-0">
            <h2 className="text-[22px] font-medium tracking-tight">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-1.5 text-[14px] text-muted-foreground">
              {isSignUp
                ? "Free forever. No credit card required."
                : "Sign in to your collections and private components."}
            </p>
          </header>

          <div className="mt-5">
            <Tabs
              items={[
                { value: "signin", label: "Sign in" },
                { value: "signup", label: "Sign up" },
              ]}
              value={mode}
              onChange={(v) => {
                setMode(v as Mode);
                setDone(false);
              }}
              className="w-full"
            />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { label: "GitHub", Icon: Github },
              { label: "Google", Icon: Chrome },
              { label: "Apple", Icon: Apple },
            ].map(({ label, Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => toast(`${label} sign-in`, "Static recreation — OAuth is not wired up.")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background text-[13px] font-medium transition-colors hover:bg-muted"
              >
                <Icon className="size-4" />
                <span className="sr-only">{label}</span>
              </button>
            ))}
          </div>

          <div className="my-5 flex items-center gap-3 text-[12px] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or continue with email
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium">Email</span>
              <span className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                  className="pl-9"
                />
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="flex items-center justify-between text-[13px] font-medium">
                Password
                {!isSignUp ? (
                  <span className="font-normal text-muted-foreground">Forgot?</span>
                ) : null}
              </span>
              <span className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </label>

            <Button
              type="submit"
              variant={done ? "secondary" : "brand"}
              size="lg"
              className={cn("mt-1 w-full", done && "text-foreground")}
            >
              {done ? (
                <>
                  <Check className="size-4" />
                  {isSignUp ? "Account created" : "Signed in"}
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  {isSignUp ? "Create account" : "Sign in"}
                </>
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-[12px] leading-relaxed text-muted-foreground">
            By continuing you agree to the Terms of Service and Privacy Policy. This page is a static
            recreation of My Ui.
          </p>
        </div>

        <p className="mt-6 text-center text-[13px] text-muted-foreground">
          Just browsing?{" "}
          <Link
            href="/community/components"
            className="font-medium text-brand underline-offset-4 hover:underline"
          >
            Explore components
          </Link>
        </p>
      </section>
    </div>
  );
}
