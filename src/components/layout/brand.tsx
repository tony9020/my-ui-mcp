import { cn } from "@/lib/utils";

/** The My Ui mark: a single-stroke M, designed to read at 16px. */
function MSigil({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false" className={className}>
      <path
        d="M6.5 24.5V9L16 18.5 25.5 9v15.5"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The My Ui lockup: brand tile + wordmark. */
export function Logo({
  className,
  variant = "full",
}: {
  className?: string;
  variant?: "full" | "mark";
}) {
  if (variant === "mark") {
    return (
      <span role="img" aria-label="My Ui" className={cn("inline-flex text-current", className)}>
        <MSigil className="h-full w-auto" />
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label="My Ui"
      className={cn("inline-flex items-center gap-2 whitespace-nowrap leading-none", className)}
    >
      <span className="grid size-5 shrink-0 place-items-center rounded-[6px] bg-brand text-brand-foreground">
        <MSigil className="h-[62%] w-auto" />
      </span>
      <span className="text-[16px] font-semibold tracking-tight">My Ui</span>
    </span>
  );
}

/** The app-icon treatment used in the marketplace top bar. */
export function LogoBadge({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-label="My Ui"
      className={cn(
        "grid shrink-0 place-items-center rounded-[9px] bg-brand text-brand-foreground shadow-sm",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <MSigil className="h-[55%] w-auto" />
    </span>
  );
}
