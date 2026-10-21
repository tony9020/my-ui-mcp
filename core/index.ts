/**
 * Public core surface.
 *
 * The CLI and the future HTTP server import from here so there is one
 * entry point for index, search, tokens, validation, audit and handoff.
 * The MCP server keeps importing `mcp/lib/*` directly; nothing moved.
 */
export {
  buildComponentIndex,
  componentDetailPayload,
  componentHandoff,
  ensureCatalogueParsed,
  ensureSearchIndex,
  findComponents,
  indexSummaryOf,
  searchComponents,
  suggestNames,
  summaryOf,
} from "../mcp/lib/component-index";
export type { FindOptions, SearchResult } from "../mcp/lib/component-index";

export {
  buildDesignTokens,
  contrastRatio,
  cssForType,
  tokenFileLabel,
  tokensForType,
} from "../mcp/lib/css-tokens";

export { validateComposition, validationMarkdown } from "../mcp/lib/validate";
export type { ValidateOptions } from "../mcp/lib/validate";

export {
  derivedFilePath,
  derivedMap,
  extractImports,
  isDerivedFresh,
  licenseClass,
} from "../mcp/lib/derived";

export {
  HANDOFF_PROTOCOL_MARKDOWN,
  buildHandoffBundle,
  compactHandoffMarkdown,
  handoffMarkdown,
} from "../mcp/lib/handoff";

export { SURFACE_TYPES, suggestCombination, suggestionMarkdown } from "../mcp/lib/suggest";

export { auditCatalogue, auditSource, collectSourceFiles, summariseAudits } from "./audit";
export type { AuditSummary, CatalogueAudit, SourceAudit } from "./audit";

export { mapUserTokens, tokenMapMarkdown } from "./map-tokens";
export type { TokenMapResult, TokenMapping } from "./map-tokens";

export type * from "../mcp/lib/types";
