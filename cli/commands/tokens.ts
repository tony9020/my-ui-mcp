import { cssForType, tokenFileLabel, tokensForType } from "../../mcp/lib/css-tokens";
import type { TokenType } from "../../mcp/lib/types";
import { getTokens } from "../lib/index";
import { printJson } from "../lib/output";

export interface TokensCommandOptions {
  type?: TokenType;
  format?: "json" | "css" | "md";
  json?: boolean;
}

const TOKEN_TYPES: TokenType[] = [
  "colors",
  "typography",
  "spacing",
  "radius",
  "shadows",
  "animations",
  "all",
];

export function tokenTypes(): TokenType[] {
  return TOKEN_TYPES;
}

function primitive(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function renderValue(value: unknown, indent = 0): string[] {
  const pad = "  ".repeat(indent);
  if (Array.isArray(value)) {
    if (!value.length) return [`${pad}- none`];
    const first = value[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      const keys = Object.keys(first as Record<string, unknown>).slice(0, 6);
      const header = `${pad}| ${keys.join(" | ")} |`;
      const divider = `${pad}| ${keys.map((key) => "---").join(" | ")} |`;
      const rows = value.map((item) => {
        const record = item as Record<string, unknown>;
        return `${pad}| ${keys.map((key) => primitive(record[key]).replace(/\|/g, "\\|")).join(" | ")} |`;
      });
      return [header, divider, ...rows];
    }
    return value.map((item) => `${pad}- ${primitive(item)}`);
  }
  if (value && typeof value === "object") {
    const lines: string[] = [];
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (nested && typeof nested === "object") {
        lines.push(`${pad}**${key}**`);
        lines.push(...renderValue(nested, indent + 1));
      } else {
        lines.push(`${pad}- ${key}: ${primitive(nested)}`);
      }
    }
    return lines;
  }
  return [`${pad}${primitive(value)}`];
}

export async function runTokens(options: TokensCommandOptions): Promise<number> {
  const type = options.type ?? "all";
  const format = options.json ? "json" : (options.format ?? "md");
  const tokens = getTokens();

  if (format === "json") {
    printJson({ source: tokenFileLabel(), type, tokens: tokensForType(tokens, type) });
    return 0;
  }

  if (format === "css") {
    process.stdout.write(cssForType(tokens, type) + "\n");
    return 0;
  }

  const payload = tokensForType(tokens, type);
  const lines = [`# Design tokens (${type})`, "", `Source: ${tokenFileLabel()}`, ""];
  for (const [group, value] of Object.entries(payload)) {
    lines.push(`## ${group}`, "", ...renderValue(value), "");
  }
  process.stdout.write(lines.join("\n").replace(/\n{3,}/g, "\n\n") + "\n");
  return 0;
}
