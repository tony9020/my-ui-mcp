#!/usr/bin/env node
/**
 * audit.mjs — human-readable data-quality report for the My Ui catalogue.
 *
 * Re-measures every finding in docs/ (section 1 of the upgrade task) plus a
 * summary of the derived file's freshness. Run with: npm run audit
 *
 * Read-only: never writes anything.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC = path.join(ROOT, "src/data/components.json");
const DERIVED = path.join(ROOT, "src/data/catalogue-derived.json");
const CSS = path.join(ROOT, "src/app/globals.css");
const SERVER_FILES = [
  "mcp/server.ts", "mcp/lib/component-index.ts", "mcp/lib/suggest.ts",
  "mcp/lib/handoff.ts", "mcp/lib/prompt.ts", "mcp/lib/types.ts",
  "mcp/lib/validate.ts", "mcp/lib/css-tokens.ts",
];

const data = JSON.parse(fs.readFileSync(SRC, "utf8"));
const records = data.components;
const raw = fs.readFileSync(SRC, "utf8");

function median(arr) { if (!arr.length) return 0; const s=[...arr].sort((a,b)=>a-b); const m=Math.floor(s.length/2); return s.length%2 ? s[m] : (s[m-1]+s[m])/2; }
function pct(n,t){ return t ? (n/t*100).toFixed(1)+"%" : "0%"; }
function line(s="") { console.log(s); }

// defined keyframes
const cssText = fs.readFileSync(CSS, "utf8");
const definedKf = new Set([...cssText.matchAll(/@keyframes\s+([\w-]+)/g)].map(m=>m[1]));

// import extraction
function extractImports(code) {
  const pkgs = new Set();
  const re = /import\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(code))) {
    const spec = m[1];
    if (spec.startsWith(".") || spec.startsWith("@/")) continue;
    const pkg = spec.startsWith("@") ? spec.split("/").slice(0,2).join("/") : spec.split("/")[0];
    pkgs.add(pkg);
  }
  const re2 = /import\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = re2.exec(code))) {
    const spec = m[1];
    if (spec.startsWith(".") || spec.startsWith("@/")) continue;
    const pkg = spec.startsWith("@") ? spec.split("/").slice(0,2).join("/") : spec.split("/")[0];
    pkgs.add(pkg);
  }
  return pkgs;
}

line("My Ui catalogue audit");
line("=====================");
line(`source: ${SRC}`);
line(`records: ${records.length}  categories: ${data.categories.length}  authors: ${data.meta.authors}`);
line("");

// F1
const codeLens = records.map(r => (r.componentCode||"").length);
line(`F1  componentCode length: median ${median(codeLens)}, max ${Math.max(...codeLens)}, min ${Math.min(...codeLens)}`);

// F2
let totalDeclared=0, totalUnused=0, recsWithUnused=0, recsWithDeps=0;
for (const r of records) {
  const declared = Object.keys(r.dependencies||{});
  if (!declared.length) continue;
  recsWithDeps++;
  totalDeclared += declared.length;
  const code = (r.componentCode||"")+(r.demoCode||"");
  const used = extractImports(code);
  let hasUnused = false;
  for (const dep of declared) { if (!used.has(dep)) { totalUnused++; hasUnused=true; } }
  if (hasUnused) recsWithUnused++;
}
line(`F2  declared deps: ${recsWithDeps} records, ${totalDeclared} entries; unused ${totalUnused} (${(totalUnused/totalDeclared*100).toFixed(1)}%) across ${recsWithUnused} records (${pct(recsWithUnused, records.length)})`);

// F3
const framer = records.filter(r => Object.keys(r.dependencies||{}).some(k=>/framer-motion/i.test(k)));
const framerImported = framer.filter(r => /from\s+["']framer-motion["']/.test((r.componentCode||"")+(r.demoCode||"")));
line(`F3  framer-motion: declared ${framer.length}, actually imported ${framerImported.length}`);

// F4
let undefKf = 0;
for (const r of records) {
  const code = (r.componentCode||"")+(r.demoCode||"");
  const m = code.match(/animate-\[([^\]]+)\]/g);
  if (!m) continue;
  for (const a of m) {
    const inner = a.match(/animate-\[([^\]]+)\]/)[1].trim().split(/[\s_]/)[0];
    if (/[a-zA-Z]/.test(inner) && !definedKf.has(inner)) { undefKf++; break; }
  }
}
line(`F4  records with undefined arbitrary keyframes: ${undefKf} (${pct(undefKf, records.length)})`);

// F5
let demoMismatch = 0;
for (const r of records) {
  if (!r.demoCode) continue;
  const imports = [...r.demoCode.matchAll(/import\s+[^"']*?["']([^"']+)["']/g)].map(m=>m[1]);
  if (!imports.some(p => p.includes(r.slug))) demoMismatch++;
}
line(`F5  demos not importing a path containing their slug: ${demoMismatch} (${pct(demoMismatch, records.filter(r=>r.demoCode).length)})`);

// F6
line(`F6  sourceUrl: ${records.filter(r=>r.sourceUrl).length}; websiteUrl: ${records.filter(r=>r.websiteUrl).length}; websiteUrl but no sourceUrl: ${records.filter(r=>r.websiteUrl&&!r.sourceUrl).length}`);

// F7
const slugCounts = {}, nameCounts = {};
for (const r of records) { slugCounts[r.slug]=(slugCounts[r.slug]||0)+1; nameCounts[r.name]=(nameCounts[r.name]||0)+1; }
const dupSlugs = Object.keys(slugCounts).filter(s=>slugCounts[s]>1).length;
const dupNames = Object.keys(nameCounts).filter(n=>nameCounts[n]>1).length;
const codeHash = {};
for (const r of records) {
  const key = (r.componentCode||"").trim();
  if (!key) continue;
  const h = crypto.createHash("sha1").update(key).digest("hex");
  (codeHash[h]=codeHash[h]||[]).push(r.id);
}
const dupCodeGroups = Object.values(codeHash).filter(g=>g.length>1);
const dupCodeRecords = dupCodeGroups.reduce((a,g)=>a+g.length,0);
line(`F7  duplicate slugs: ${dupSlugs}; duplicate names: ${dupNames}; identical-code groups: ${dupCodeGroups.length} (${dupCodeRecords} records, ${dupCodeRecords-dupCodeGroups.length} extras)`);

// F8
const localSlugs = new Set();
function walk(d){const out=[];for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())out.push(...walk(p));else if(e.name.endsWith(".tsx"))out.push(path.basename(p,".tsx"));}return out;}
for (const s of walk(path.join(ROOT,"src/components"))) localSlugs.add(s);
const catSlugSet = new Set(records.map(r=>r.slug));
const collisions = [...catSlugSet].filter(s=>localSlugs.has(s));
line(`F8  catalogue slugs colliding with local component files: ${collisions.length} (${collisions.join(", ")})`);

// F9
const lic = {};
for (const r of records) lic[r.license] = (lic[r.license]||0)+1;
const classes = {};
for (const r of records) {
  const s = String(r.license||"").trim().toUpperCase();
  let c = "unknown";
  if (!s || s === "NO-LICENSE") c = "none";
  else if (s.includes("COMMONS CLAUSE") || s.includes("PROPRIETARY") || s.includes("ATTRIBUTION REQUIRED") || s.includes("BESTE") || s.includes("ACETERNITY") || s.includes("SKIPER")) c = "restricted";
  else if (s.startsWith("MIT") || s.startsWith("APACHE") || s.startsWith("BSD") || s.startsWith("ISC") || s === "MIT-0" || s === "0BSD" || s.includes("FREE")) c = "permissive";
  else if (s.startsWith("MPL") || s.startsWith("LGPL") || s.startsWith("EPL") || s.startsWith("CDDL")) c = "weak-copyleft";
  else if (s.startsWith("AGPL") || s.startsWith("GPL")) c = "strong-copyleft";
  classes[c] = (classes[c]||0)+1;
}
line(`F9  licences: ${Object.entries(lic).length} distinct raw values; classes: ${Object.entries(classes).map(([k,v])=>`${k}=${v}`).join(", ")}`);

// F10
let rmCount = 0, rmTailwind = 0;
for (const r of records) {
  const code = (r.componentCode||"")+(r.demoCode||"");
  if (/prefers-reduced-motion|useReducedMotion/i.test(code)) rmCount++;
  if (/motion-reduce|motion-safe/i.test(code)) rmTailwind++;
}
line(`F10 reduced-motion: ${rmCount} records use prefers-reduced-motion/useReducedMotion; ${rmTailwind} use Tailwind motion-reduce utilities`);

// F11
let refCount = 0;
for (const f of SERVER_FILES) {
  const code = fs.readFileSync(path.join(ROOT, f), "utf8");
  const m = code.match(/createdAt|updatedAt/g);
  if (m) refCount += m.length;
}
line(`F11 createdAt/updatedAt references in server code: ${refCount}`);

// F12
line(`F12 previewUrl: relative=${records.filter(r=>r.previewUrl&&r.previewUrl.startsWith("/")).length}, absolute=${records.filter(r=>r.previewUrl&&/^https?:\/\//.test(r.previewUrl)).length}, null=${records.filter(r=>!r.previewUrl).length}`);

// F13
const downloads = records.map(r=>r.downloads||0);
const likes = records.map(r=>r.likes||0);
const views = records.map(r=>r.views||0);
const bookmarks = records.map(r=>r.bookmarks||0);
line(`F13 popularity: downloads median ${median(downloads)}, likes median ${median(likes)} (${pct(records.filter(r=>!r.likes).length, records.length)} zero), views median ${median(views)}, bookmarks median ${median(bookmarks)}`);

// F14
const ci = fs.readFileSync(path.join(ROOT,"mcp/lib/component-index.ts"),"utf8");
const haystackStart = ci.indexOf("const haystack");
const haystackEnd = ci.indexOf("return { component, score }");
const haystackBlock = ci.slice(haystackStart, haystackEnd);
line(`F14 haystack includes description: ${/\bdescription\b/.test(haystackBlock)}; local flat +40 bonus: ${/\? 40 : 0/.test(haystackBlock)}; rebuilt per query: ${/index\.components\s*\n\s*\.map/.test(ci)}`);

// F15
line(`F15 related: catalogue uses first 6 of primary category: ${/catalogueByCategory\.get\(component\.categorySlug\)/.test(ci)}`);

// F16
line(`F16 AST parsing: ts.createSourceFile calls in component-index: ${(ci.match(/createSourceFile/g)||[]).length}; buildCatalogueComponent uses TS AST: ${/function buildCatalogueComponent[\s\S]*?createSourceFile/.test(ci)}`);

// F17
line(`F17 contradictory wording: "do not paraphrase" in component-index: ${(ci.match(/do not paraphrase/gi)||[]).length}, in handoff: ${(fs.readFileSync(path.join(ROOT,"mcp/lib/handoff.ts"),"utf8").match(/do not paraphrase/gi)||[]).length}`);

// F18
const reg = {};
for (const r of records) reg[r.registry] = (reg[r.registry]||0)+1;
line(`F18 registry values: ${JSON.stringify(reg)}`);

// Derived file freshness
line("");
line("===== DERIVED FILE =====");
if (fs.existsSync(DERIVED)) {
  const d2 = JSON.parse(fs.readFileSync(DERIVED,"utf8"));
  const srcHash = crypto.createHash("sha256").update(raw).digest("hex");
  line(`present: yes  records: ${d2.meta.derivedCount}  sourceHash match: ${d2.meta.sourceHash === srcHash}`);
  line(`generatedAt: ${d2.meta.generatedAt}  size: ${(fs.statSync(DERIVED).size/1024/1024).toFixed(2)} MB`);
  const derived = d2.derived;
  const canon = Object.values(derived).filter(x=>x.isCanonical).length;
  const linked = Object.values(derived).filter(x=>x.trustTier==="linked").length;
  line(`canonical: ${canon}  non-canonical: ${Object.keys(derived).length-canon}  linked: ${linked}  reference: ${Object.keys(derived).length-linked}`);
} else {
  line("present: no — run npm run derive");
}

// startup timing estimate
line("");
line("===== QUICK STARTUP PROBE =====");
const t0 = Date.now();
// simulate cheap metadata load
const metaOnly = records.map(r => ({ id:r.id, slug:r.slug, name:r.name, origin:"catalogue" }));
console.log(`metadata-only array build: ${Date.now()-t0} ms (${metaOnly.length} entries)`);
