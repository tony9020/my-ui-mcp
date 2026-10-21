/**
 * Map a user's existing CSS variables onto the My Ui semantic token names.
 *
 * Shared by the CLI (`myui map-tokens`) and, in Phase 4, the HTTP API. The
 * matching is intentionally conservative: an exact or normalised name match
 * only, plus a fuzzy contains/contained pass. Anything else is reported as
 * unmapped rather than guessed.
 */
import { buildDesignTokens } from "../mcp/lib/css-tokens";
import type { DesignTokens } from "../mcp/lib/types";

export interface TokenMapping {
  user: string;
  myui: string | null;
  note: string;
}

export interface TokenMapResult {
  mappings: TokenMapping[];
  unmapped: TokenMapping[];
  hexValues: string[];
}

export function mapUserTokens(
  userTokens: string,
  tokens: DesignTokens = buildDesignTokens(),
): TokenMapResult {
  const known = tokens.colors.tokens.map((token) => token.name);
  const variables = [...userTokens.matchAll(/--([\w-]+)\s*:/g)].map((match) => match[1] ?? "");
  const hexValues = [...new Set([...userTokens.matchAll(/#([0-9a-fA-F]{3,8})\b/g)].map((match) => match[1] ?? ""))];

  const mappings: TokenMapping[] = variables.map((variable) => {
    const lower = variable.toLowerCase();
    let match = known.find(
      (name) =>
        name === lower ||
        name.replace(/-/g, "") === lower.replace(/-/g, ""),
    );
    if (!match) {
      match = known.find((name) => lower.includes(name) || name.includes(lower));
    }
    return {
      user: `--${variable}`,
      myui: match ? `--${match}` : null,
      note: match ? "name match" : "no direct match — review manually",
    };
  });

  return {
    mappings,
    unmapped: mappings.filter((mapping) => !mapping.myui),
    hexValues,
  };
}

export function tokenMapMarkdown(result: TokenMapResult): string {
  const lines = [
    "# Token mapping",
    "",
    `${result.mappings.length} variable(s), ${result.unmapped.length} unmapped.`,
    "",
  ];
  if (result.mappings.length) {
    lines.push("| User token | My Ui token | Note |", "| --- | --- | --- |");
    for (const mapping of result.mappings) {
      lines.push(`| \`${mapping.user}\` | ${mapping.myui ? `\`${mapping.myui}\`` : "—"} | ${mapping.note} |`);
    }
  }
  if (result.hexValues.length) {
    lines.push("", `Raw hex values found: ${result.hexValues.map((value) => `#${value}`).join(", ")}`);
    lines.push("", "Map these to the nearest semantic colour token before shipping.");
  }
  return lines.join("\n");
}
