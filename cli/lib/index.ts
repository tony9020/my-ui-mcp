/**
 * Lazy singletons for the CLI.
 *
 * Building the index parses 35 local component files and the 26 MB catalogue
 * (the derived file makes the catalogue path fast). It costs about a second,
 * so commands that never touch components (`login`, `logout`) must not import
 * this module.
 */
import { buildComponentIndex } from "../../mcp/lib/component-index";
import { buildDesignTokens } from "../../mcp/lib/css-tokens";
import type { ComponentIndex, DesignTokens } from "../../mcp/lib/types";

let index: ComponentIndex | null = null;
let tokens: DesignTokens | null = null;

export function getIndex(): ComponentIndex {
  index ??= buildComponentIndex();
  return index;
}

export function getTokens(): DesignTokens {
  tokens ??= buildDesignTokens();
  return tokens;
}
