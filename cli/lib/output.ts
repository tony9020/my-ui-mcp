/** Terminal output helpers. Colour is opt-out via NO_COLOR or a non-TTY. */

function colorEnabled(): boolean {
  return !process.env.NO_COLOR && Boolean(process.stdout.isTTY);
}

const codes = {
  reset: "\u001b[0m",
  bold: "\u001b[1m",
  dim: "\u001b[2m",
  red: "\u001b[31m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  cyan: "\u001b[36m",
} as const;

export type ColorName = keyof typeof codes;

export function paint(style: ColorName, value: string): string {
  return colorEnabled() ? `${codes[style]}${value}${codes.reset}` : value;
}

export function printJson(value: unknown): void {
  process.stdout.write(JSON.stringify(value, null, 2) + "\n");
}

/** Diagnostics and progress go to stderr so stdout stays machine-readable. */
export function info(message: string): void {
  process.stderr.write(message + "\n");
}

export function warn(message: string): void {
  process.stderr.write(paint("yellow", `warning: ${message}`) + "\n");
}

export function fail(message: string): void {
  process.stderr.write(paint("red", `error: ${message}`) + "\n");
}

export function success(message: string): void {
  process.stdout.write(paint("green", message) + "\n");
}

export function truncate(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, Math.max(0, max - 1))}…`;
}

export function table(headers: string[], rows: string[][]): string {
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => (row[index] ?? "").length)),
  );
  const line = (cells: string[]) =>
    cells
      .map((cell, index) => cell.padEnd(widths[index] ?? 0))
      .join("  ")
      .trimEnd();
  const divider = widths.map((width) => "─".repeat(width)).join("  ");
  return [line(headers), divider, ...rows.map(line)].join("\n");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
