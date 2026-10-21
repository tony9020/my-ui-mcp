#!/usr/bin/env node
/**
 * derive-catalogue.mjs
 *
 * Offline derivation pipeline for the My Ui catalogue. Reads
 * src/data/components.json and writes src/data/catalogue-derived.json keyed by
 * record id. The server prefers this file when its recorded source hash
 * matches components.json, and recomputes in-process otherwise.
 *
 * Node built-ins + the TypeScript compiler (already a dependency) only.
 * Run with: npm run derive
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC = path.join(ROOT, "src/data/components.json");
const OUT = path.join(ROOT, "src/data/catalogue-derived.json");
const CSS = path.join(ROOT, "src/app/globals.css");
const SITE_URL = (process.env.MYUI_SITE_URL || "https://my-ui-dun.vercel.app").replace(/\/$/, "");

const raw = fs.readFileSync(SRC, "utf8");
const data = JSON.parse(raw);
const records = data.components;

// ---- defined keyframes (for the usesUndefinedKeyframes signal) ---------------
const cssText = fs.readFileSync(CSS, "utf8");
const DEFINED_KEYFRAMES = new Set([...cssText.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]));

// ---- heavy deps + framework lock -------------------------------------------
const HEAVY_DEPS = new Set([
  "three", "@react-three/fiber", "@react-three/drei", "@react-three/rapier",
  "gsap", "@gsap/react", "framer-motion", "motion",
  "next", "react-dom",
  "d3", "recharts", "chart.js", "react-chartjs-2",
  "mapbox-gl", "leaflet", "react-leaflet",
  "@tanstack/react-table", "@tanstack/react-virtual",
  "@stripe/stripe-js", "@clerk/nextjs", "@supabase/supabase-js",
  "@base-ui/react", "@base-ui-components/react",
  "@radix-ui/react-dialog", // commonly the heaviest radix primitive in bundles
]);
// framework lock: a dep that pins the host framework
const FRAMEWORK_DEPS = new Map([["next", "next"]]);

// ---- helpers ----------------------------------------------------------------
function sha1(s) { return crypto.createHash("sha1").update(s).digest("hex"); }
function normalizeCode(s) { return (s || "").replace(/\s+/g, " ").trim().toLowerCase(); }
function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function logNorm(value, max) {
  if (max <= 0 || value <= 0) return 0;
  return Math.log10(value + 1) / Math.log10(max + 1);
}

// ---- licence classification -------------------------------------------------
function licenseClass(license) {
  const s = String(license || "").trim().toUpperCase();
  if (!s || s === "NO-LICENSE" || s === "UNKNOWN") return "none";
  if (s.includes("COMMONS CLAUSE") || s.includes("PROPRIETARY") || s.includes("ATTRIBUTION REQUIRED") || s.includes("BESTE") || s.includes("ACETERNITY") || s.includes("SKIPER") || s.includes("OZZY")) return "restricted";
  if (s.startsWith("MIT")) return "permissive";
  if (s === "MIT-0") return "permissive";
  if (s.startsWith("APACHE")) return "permissive";
  if (s.startsWith("BSD") || s.startsWith("ISC") || s === "0BSD" || s.startsWith("ZLIB") || s.startsWith("UNLICENSE")) return "permissive";
  if (s.startsWith("MPL") || s.startsWith("LGPL") || s.startsWith("EPL") || s.startsWith("CDDL") || s.startsWith("EUPL")) return "weak-copyleft";
  if (s.startsWith("AGPL") || s.startsWith("GPL")) return "strong-copyleft";
  if (s.includes("FREE") && !s.includes("COMMONS")) return "permissive";
  return "unknown";
}

// ---- dependency extraction (regex, fast) ------------------------------------
function extractImports(code) {
  const pkgs = new Set();
  const re = /import\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;
  let m;
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

function isInternalImport(spec) {
  return spec.startsWith("@/") || spec.startsWith("./") || spec.startsWith("../");
}

function importsResolvable(code) {
  const re = /import\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(code))) {
    const spec = m[1];
    if (isInternalImport(spec)) continue;
    // npm package: must not contain path separators beyond scope/pkg
    if (spec.startsWith("@")) {
      if (spec.split("/").length > 2) return false; // @scope/pkg/subpath not resolvable as declared
    } else if (spec.includes("/")) {
      return false; // deep import into a package
    }
  }
  return true;
}

function hasReducedMotion(code) {
  return /prefers-reduced-motion|motion-reduce|motion-safe|useReducedMotion/i.test(code);
}

function usesTokens(code) {
  return /\b(bg|text|border)-(background|foreground|muted|card|popover|primary|secondary|accent|brand|destructive|input|ring)\b/.test(code);
}

function usesHardcodedColor(code) {
  // hex colours outside of comments/strings that look like class names
  return /#[0-9a-fA-F]{3,8}\b/.test(code);
}

function usesUndefinedKeyframes(code) {
  const matches = code.match(/animate-\[([^\]]+)\]/g);
  if (!matches) return false;
  for (const a of matches) {
    const inner = a.match(/animate-\[([^\]]+)\]/)[1];
    const kfName = inner.trim().split(/[\s_]/)[0];
    if (/[a-zA-Z]/.test(kfName) && !DEFINED_KEYFRAMES.has(kfName)) return true;
  }
  return false;
}

function ariaScore(code) {
  let n = 0;
  n += (code.match(/aria-[a-zA-Z]+/g) || []).length;
  n += (code.match(/\brole\s*=\s*["']/g) || []).length;
  n += (code.match(/\balt\s*=\s*["']/g) || []).length;
  n += (code.match(/\bhtmlFor\s*=/g) || []).length;
  n += (code.match(/<(button|a|input|label|nav|main|header|footer|section|article)\b/gi) || []).length;
  return Math.min(1, n / 10);
}

function resolveUrl(u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `${SITE_URL}${u}`;
  return `${SITE_URL}/${u}`;
}

// ---- popularity maxima ------------------------------------------------------
const maxViews = Math.max(...records.map((r) => r.views || 0));
const maxBookmarks = Math.max(...records.map((r) => r.bookmarks || 0));
const maxDownloads = Math.max(...records.map((r) => r.downloads || 0));
const maxLikes = Math.max(...records.map((r) => r.likes || 0));

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const generatedAt = new Date(data.meta.generatedAt || new Date().toISOString());

// ---- first pass: per-record derived ----------------------------------------
const derived = {};
for (const r of records) {
  const code = r.componentCode || "";
  const demo = r.demoCode || "";
  const combined = code + "\n" + demo;
  const declared = Object.keys(r.dependencies || {});
  const used = extractImports(combined);
  const unused = declared.filter((dep) => !used.has(dep));

  const demoImports = [...demo.matchAll(/import\s+[^"']*?["']([^"']+)["']/g)].map((m) => m[1]);
  const demoMatches = demoImports.some((p) => p.includes(r.slug));

  const heavyDeps = declared.filter((dep) => HEAVY_DEPS.has(dep));
  const frameworkLock = FRAMEWORK_DEPS.has(r.dependencies && Object.keys(r.dependencies).find((k) => FRAMEWORK_DEPS.has(k))) ? "next" : "none";
  // simpler framework lock:
  const fwLock = (r.dependencies && r.dependencies.next) ? "next" : "none";

  const lc = licenseClass(r.license);

  // popularity
  const viewsN = logNorm(r.views || 0, maxViews);
  const bookmarksN = logNorm(r.bookmarks || 0, maxBookmarks);
  const downloadsN = logNorm(r.downloads || 0, maxDownloads);
  const likesN = logNorm(r.likes || 0, maxLikes);
  let popularity = 0.35 * viewsN + 0.25 * bookmarksN + 0.20 * downloadsN + 0.20 * likesN;
  const updated = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
  if (updated && generatedAt.getTime() - updated < NINETY_DAYS_MS) popularity = Math.min(1, popularity + 0.05);

  // compliance score
  let compliance = 100;
  const trustTier = r.sourceUrl ? "linked" : "reference";
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

  derived[r.id] = {
    codeHash: sha1(normalizeCode(code)),
    licenseClass: lc,
    trustTier,
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
    resolvedPreviewUrl: resolveUrl(r.previewUrl),
    resolvedPreviewLight: resolveUrl(r.previewLight),
    resolvedPreviewDark: resolveUrl(r.previewDark),
    resolvedVideoUrl: resolveUrl(r.videoUrl),
    heavyDeps,
    frameworkLock: fwLock,
    // placeholders filled in second pass
    canonicalId: r.id,
    isCanonical: true,
    duplicateOf: null,
    alternates: [],
  };
}

// ---- deduplication (union-find over code-hash AND normalised name) ----------
// Two records are duplicates if they share a code hash OR a normalised name.
const parent = {};
for (const r of records) parent[r.id] = r.id;
function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
function union(a, b) { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; }

const byCode = new Map();
const byName = new Map();
for (const r of records) {
  const h = derived[r.id].codeHash;
  if (!byCode.has(h)) byCode.set(h, []);
  byCode.get(h).push(r.id);
  const n = (r.name || "").trim().toLowerCase();
  if (!byName.has(n)) byName.set(n, []);
  byName.get(n).push(r.id);
}
for (const group of byCode.values()) for (let i = 1; i < group.length; i++) union(group[0], group[i]);
for (const group of byName.values()) for (let i = 1; i < group.length; i++) union(group[0], group[i]);

// group members
const groups = new Map();
for (const r of records) {
  const root = find(r.id);
  if (!groups.has(root)) groups.set(root, []);
  groups.get(root).push(r.id);
}

// canonical selection: has sourceUrl > higher popularity > newer updatedAt
function canonicalOf(members) {
  if (members.length === 1) return members[0];
  const scored = members.map((id) => {
    const r = records.find((x) => x.id === id);
    const d = derived[id];
    return {
      id,
      hasSource: r.sourceUrl ? 1 : 0,
      pop: d.popularityScore,
      updated: r.updatedAt ? new Date(r.updatedAt).getTime() : 0,
    };
  });
  scored.sort((a, b) =>
    b.hasSource - a.hasSource ||
    b.pop - a.pop ||
    b.updated - a.updated ||
    a.id.localeCompare(b.id),
  );
  return scored[0].id;
}

for (const members of groups.values()) {
  if (members.length === 1) {
    derived[members[0]].isCanonical = true;
    derived[members[0]].canonicalId = members[0];
    derived[members[0]].duplicateOf = null;
    derived[members[0]].alternates = [];
    continue;
  }
  const canon = canonicalOf(members);
  for (const id of members) {
    derived[id].isCanonical = id === canon;
    derived[id].canonicalId = canon;
    derived[id].duplicateOf = id === canon ? null : canon;
    derived[id].alternates = members.filter((x) => x !== id);
  }
}

// ---- write output -----------------------------------------------------------
const sourceHash = crypto.createHash("sha256").update(raw).digest("hex");
const out = {
  meta: {
    sourceFile: "src/data/components.json",
    sourceHash,
    generatedAt: data.meta?.generatedAt ?? null,
    siteUrl: SITE_URL,
    recordCount: records.length,
    derivedCount: Object.keys(derived).length,
  },
  derived,
};

fs.writeFileSync(OUT, JSON.stringify(out));
const stat = fs.statSync(OUT);
console.log(`wrote ${OUT}`);
console.log(`  records: ${records.length}`);
console.log(`  derived: ${Object.keys(derived).length}`);
console.log(`  file size: ${(stat.size/1024/1024).toFixed(2)} MB`);
console.log(`  canonical groups: ${groups.size}`);
console.log(`  non-canonical records: ${Object.values(derived).filter(d=>!d.isCanonical).length}`);
console.log(`  linked (sourceUrl): ${Object.values(derived).filter(d=>d.trustTier==="linked").length}`);
console.log(`  reference (no sourceUrl): ${Object.values(derived).filter(d=>d.trustTier==="reference").length}`);
console.log(`  license classes:`, Object.entries(Object.values(derived).reduce((a,d)=>{a[d.licenseClass]=(a[d.licenseClass]||0)+1;return a;},{})).map(([k,v])=>`${k}=${v}`).join(" "));
