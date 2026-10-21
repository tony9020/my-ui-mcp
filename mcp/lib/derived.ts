/**
 * Derived catalogue data: trust tiers, licence classes, deduplication, code-quality
 * signals, compliance/popularity scores, resolved preview URLs, heavy deps.
 *
 * The server prefers `src/data/catalogue-derived.json` when its recorded hash of
 * `components.json` matches. Otherwise it computes the same fields in-process
 * (a slightly lighter version) so the server never depends on the file.
 *
 * See scripts/derive-catalogue.mjs for the canonical generator and
 * docs/SCORING.md for the score formulas.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

import { CATALOGUE_JSON, ROOT } from "./paths";
import type {
  CodeQualitySignals,
  LicenseClass,
  TrustTier,
} from "./types";

export interface DerivedRecord {
  codeHash: string;
  licenseClass: LicenseClass;
  trustTier: TrustTier;
  isCanonical: boolean;
  canonicalId: string;
  duplicateOf: string | null;
  alternates: string[];
  codeQuality: CodeQualitySignals;
  complianceScore: number;
  popularityScore: number;
  heavyDeps: string[];
  frameworkLock: "next" | "none";
  resolvedPreviewUrl: string | null;
  resolvedPreviewLight: string | null;
  resolvedPreviewDark: string | null;
  resolvedVideoUrl: string | null;
}

const SITE_URL = (process.env.MYUI_SITE_URL || "https://my-ui-dun.vercel.app").replace(/\/$/, "");
const DERIVED_FILE = path.join(ROOT, "src", "data", "catalogue-derived.json");

const DEFINED_KEYFRAMES = new Set<string>();
try {
  const css = fs.readFileSync(path.join(ROOT, "src", "app", "globals.css"), "utf8");
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)/g)) DEFINED_KEYFRAMES.add(m[1]);
} catch {
  // ignore
}

const HEAVY_DEPS = new Set([
  "three", "@react-three/fiber", "@react-three/drei", "@react-three/rapier",
  "gsap", "@gsap/react", "framer-motion", "motion",
  "next", "d3", "recharts", "chart.js", "react-chartjs-2",
  "mapbox-gl", "leaflet", "react-leaflet",
  "@tanstack/react-table", "@tanstack/react-virtual",
  "@stripe/stripe-js", "@clerk/nextjs", "@supabase/supabase-js",
  "@base-ui/react", "@base-ui-components/react",
]);

function sha1(s: string): string {
  return crypto.createHash("sha1").update(s).digest("hex");
}
function normalizeCode(s: string): string {
  return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
}
function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function logNorm(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0;
  return Math.log10(value + 1) / Math.log10(max + 1);
}

export function licenseClass(license: string | null | undefined): LicenseClass {
  const s = String(license || "").trim().toUpperCase();
  if (!s || s === "NO-LICENSE" || s === "UNKNOWN") return "none";
  if (s.includes("COMMONS CLAUSE") || s.includes("PROPRIETARY") || s.includes("ATTRIBUTION REQUIRED") || s.includes("BESTE") || s.includes("ACETERNITY") || s.includes("SKIPER")) return "restricted";
  if (s.startsWith("MIT") || s.startsWith("APACHE") || s.startsWith("BSD") || s.startsWith("ISC") || s === "MIT-0" || s === "0BSD" || s.includes("FREE")) return "permissive";
  if (s.startsWith("MPL") || s.startsWith("LGPL") || s.startsWith("EPL") || s.startsWith("CDDL")) return "weak-copyleft";
  if (s.startsWith("AGPL") || s.startsWith("GPL")) return "strong-copyleft";
  return "unknown";
}

export function extractImports(code: string): Set<string> {
  const pkgs = new Set<string>();
  const re = /import\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const spec = m[1];
    if (spec.startsWith(".") || spec.startsWith("@/")) continue;
    const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
    pkgs.add(pkg);
  }
  const re2 = /import\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = re2.exec(code))) {
    const spec = m[1];
    if (spec.startsWith(".") || spec.startsWith("@/")) continue;
    const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
    pkgs.add(pkg);
  }
  return pkgs;
}

function importsResolvable(code: string): boolean {
  const re = /import\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const spec = m[1];
    if (spec.startsWith("@/") || spec.startsWith("./") || spec.startsWith("../")) continue;
    if (spec.startsWith("@")) {
      if (spec.split("/").length > 2) return false;
    } else if (spec.includes("/")) {
      return false;
    }
  }
  return true;
}

function hasReducedMotion(code: string): boolean {
  return /prefers-reduced-motion|motion-reduce|motion-safe|useReducedMotion/i.test(code);
}

function usesTokens(code: string): boolean {
  return /\b(bg|text|border)-(background|foreground|muted|card|popover|primary|secondary|accent|brand|destructive|input|ring)\b/.test(code);
}

function usesHardcodedColor(code: string): boolean {
  return /#[0-9a-fA-F]{3,8}\b/.test(code);
}

function usesUndefinedKeyframes(code: string): boolean {
  const matches = code.match(/animate-\[([^\]]+)\]/g);
  if (!matches) return false;
  for (const a of matches) {
    const inner = a.match(/animate-\[([^\]]+)\]/)![1].trim().split(/[\s_]/)[0];
    if (/[a-zA-Z]/.test(inner) && !DEFINED_KEYFRAMES.has(inner)) return true;
  }
  return false;
}

function ariaScore(code: string): number {
  let n = 0;
  n += (code.match(/aria-[a-zA-Z]+/g) || []).length;
  n += (code.match(/\brole\s*=\s*["']/g) || []).length;
  n += (code.match(/\balt\s*=\s*["']/g) || []).length;
  n += (code.match(/\bhtmlFor\s*=/g) || []).length;
  n += (code.match(/<(button|a|input|label|nav|main|header|footer|section|article)\b/gi) || []).length;
  return Math.min(1, n / 10);
}

function resolveUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `${SITE_URL}${u}`;
  return `${SITE_URL}/${u}`;
}

// ---- global maxima (computed lazily, cached) --------------------------------
let _maxima: { views: number; bookmarks: number; downloads: number; likes: number } | null = null;
function maxima(records: any[]): { views: number; bookmarks: number; downloads: number; likes: number } {
  if (_maxima) return _maxima;
  _maxima = {
    views: Math.max(1, ...records.map((r) => r.views || 0)),
    bookmarks: Math.max(1, ...records.map((r) => r.bookmarks || 0)),
    downloads: Math.max(1, ...records.map((r) => r.downloads || 0)),
    likes: Math.max(1, ...records.map((r) => r.likes || 0)),
  };
  return _maxima;
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

function computeOne(record: any, allRecords: any[]): DerivedRecord {
  const code = record.componentCode || "";
  const demo = record.demoCode || "";
  const combined = code + "\n" + demo;
  const declared = Object.keys(record.dependencies || {});
  const used = extractImports(combined);
  const unused = declared.filter((dep) => !used.has(dep));

  const demoImports = [...demo.matchAll(/import\s+[^"']*?["']([^"']+)["']/g)].map((m) => m[1]);
  const demoMatches = demoImports.some((p) => p.includes(record.slug));

  const heavyDeps = declared.filter((dep) => HEAVY_DEPS.has(dep));
  const frameworkLock: "next" | "none" = (record.dependencies && record.dependencies.next) ? "next" : "none";

  const lc = licenseClass(record.license);
  const trustTier: TrustTier = record.sourceUrl ? "linked" : "reference";

  const mx = maxima(allRecords);
  const viewsN = logNorm(record.views || 0, mx.views);
  const bookmarksN = logNorm(record.bookmarks || 0, mx.bookmarks);
  const downloadsN = logNorm(record.downloads || 0, mx.downloads);
  const likesN = logNorm(record.likes || 0, mx.likes);
  let popularity = 0.35 * viewsN + 0.25 * bookmarksN + 0.20 * downloadsN + 0.20 * likesN;
  const updated = record.updatedAt ? new Date(record.updatedAt).getTime() : 0;
  const generatedAt = new Date().getTime();
  if (updated && generatedAt - updated < NINETY_DAYS_MS) popularity = Math.min(1, popularity + 0.05);

  let compliance = 100;
  if (trustTier === "reference") compliance -= 20;
  if (usesUndefinedKeyframes(code)) compliance -= 15;
  if (!demoMatches) compliance -= 10;
  if (!hasReducedMotion(code)) compliance -= 10;
  compliance -= Math.min(20, unused.length * 5);
  if (usesHardcodedColor(code)) compliance -= 10;
  if (ariaScore(code) < 0.2) compliance -= 5;
  if (lc === "none" || lc === "restricted" || lc === "strong-copyleft") compliance -= 10;
  if (trustTier === "linked") compliance = Math.min(100, compliance + 5);
  compliance = Math.max(0, Math.min(100, compliance));

  return {
    codeHash: sha1(normalizeCode(code)),
    licenseClass: lc,
    trustTier,
    isCanonical: true, // filled in by dedup pass
    canonicalId: record.id,
    duplicateOf: null,
    alternates: [],
    codeQuality: {
      declaredDepsUnused: unused,
      importsResolvable: importsResolvable(code),
      usesUndefinedKeyframes: usesUndefinedKeyframes(code),
      demoMatchesComponent: demoMatches,
      hasReducedMotion: hasReducedMotion(code),
      ariaScore: Math.round(ariaScore(code) * 100) / 100,
      usesTokens: usesTokens(code),
      usesHardcodedColor: usesHardcodedColor(code),
    },
    complianceScore: compliance,
    popularityScore: Math.round(popularity * 1000) / 1000,
    heavyDeps,
    frameworkLock: frameworkLock,
    resolvedPreviewUrl: resolveUrl(record.previewUrl),
    resolvedPreviewLight: resolveUrl(record.previewLight),
    resolvedPreviewDark: resolveUrl(record.previewDark),
    resolvedVideoUrl: resolveUrl(record.videoUrl),
  };
}

// ---- dedup (union-find over code-hash AND normalised name) ------------------
function dedup(records: any[], derived: Map<string, DerivedRecord>): void {
  const parent: Record<string, string> = {};
  for (const r of records) parent[r.id] = r.id;
  const find = (x: string): string => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  const union = (a: string, b: string) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  const byCode = new Map<string, string[]>();
  const byName = new Map<string, string[]>();
  for (const r of records) {
    const h = derived.get(r.id)!.codeHash;
    if (!byCode.has(h)) byCode.set(h, []);
    byCode.get(h)!.push(r.id);
    const n = (r.name || "").trim().toLowerCase();
    if (!byName.has(n)) byName.set(n, []);
    byName.get(n)!.push(r.id);
  }
  for (const group of byCode.values()) for (let i = 1; i < group.length; i++) union(group[0], group[i]);
  for (const group of byName.values()) for (let i = 1; i < group.length; i++) union(group[0], group[i]);

  const groups = new Map<string, string[]>();
  for (const r of records) {
    const root = find(r.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(r.id);
  }

  for (const members of groups.values()) {
    if (members.length === 1) {
      const d = derived.get(members[0])!;
      d.isCanonical = true;
      d.canonicalId = members[0];
      d.duplicateOf = null;
      d.alternates = [];
      continue;
    }
    // canonical selection: has sourceUrl > higher popularity > newer updatedAt
    const scored = members.map((id) => {
      const r = records.find((x) => x.id === id)!;
      const dd = derived.get(id)!;
      return {
        id,
        hasSource: r.sourceUrl ? 1 : 0,
        pop: dd.popularityScore,
        updated: r.updatedAt ? new Date(r.updatedAt).getTime() : 0,
      };
    });
    scored.sort((a, b) =>
      b.hasSource - a.hasSource ||
      b.pop - a.pop ||
      b.updated - a.updated ||
      a.id.localeCompare(b.id),
    );
    const canon = scored[0].id;
    for (const id of members) {
      const dd = derived.get(id)!;
      dd.isCanonical = id === canon;
      dd.canonicalId = canon;
      dd.duplicateOf = id === canon ? null : canon;
      dd.alternates = members.filter((x) => x !== id);
    }
  }
}

// ---- public API -------------------------------------------------------------
let _derivedMap: Map<string, DerivedRecord> | null = null;
let _sourceHash: string | null = null;

export function derivedFilePath(): string {
  return DERIVED_FILE;
}

export function sourceHashOfFile(filePath: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

export function currentSourceHash(): string {
  return crypto.createHash("sha256").update(fs.readFileSync(CATALOGUE_JSON)).digest("hex");
}

export function loadDerived(): Map<string, DerivedRecord> | null {
  try {
    if (!fs.existsSync(DERIVED_FILE)) return null;
    const parsed = JSON.parse(fs.readFileSync(DERIVED_FILE, "utf8"));
    if (!parsed || !parsed.meta || !parsed.derived) return null;
    if (parsed.meta.sourceHash !== currentSourceHash()) return null;
    const m = new Map<string, DerivedRecord>();
    for (const [id, d] of Object.entries(parsed.derived)) {
      m.set(id, d as DerivedRecord);
    }
    _derivedMap = m;
    _sourceHash = parsed.meta.sourceHash;
    return m;
  } catch {
    return null;
  }
}

export function computeDerivedAll(records: any[]): Map<string, DerivedRecord> {
  const m = new Map<string, DerivedRecord>();
  for (const r of records) m.set(r.id, computeOne(r, records));
  dedup(records, m);
  _derivedMap = m;
  return m;
}

export function getDerived(recordId: string, record: any, allRecords: any[]): DerivedRecord {
  if (_derivedMap && _derivedMap.has(recordId)) return _derivedMap.get(recordId)!;
  // try loading from file
  const loaded = loadDerived();
  if (loaded && loaded.has(recordId)) return loaded.get(recordId)!;
  // in-process fallback
  if (!_derivedMap) computeDerivedAll(allRecords);
  return _derivedMap!.get(recordId) ?? computeOne(record, allRecords);
}

export function derivedMap(): Map<string, DerivedRecord> | null {
  return _derivedMap;
}

export function isDerivedFresh(): boolean {
  try {
    if (!fs.existsSync(DERIVED_FILE)) return false;
    const parsed = JSON.parse(fs.readFileSync(DERIVED_FILE, "utf8"));
    return parsed?.meta?.sourceHash === currentSourceHash();
  } catch {
    return false;
  }
}

