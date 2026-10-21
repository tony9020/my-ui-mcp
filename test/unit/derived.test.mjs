import assert from "node:assert/strict";
import { test } from "node:test";
import { buildComponentIndex, searchComponents, findComponents, suggestNames, componentHandoff } from "../../mcp/lib/component-index.ts";

const index = buildComponentIndex();

test("dedup: canonical count is less than total", () => {
  const canonical = index.components.filter((c) => c.isCanonical !== false).length;
  assert.ok(canonical < index.components.length, `canonical ${canonical} < total ${index.components.length}`);
  assert.equal(index.components.length, 8214);
});

test("dedup: search returns canonical by default", () => {
  const res = searchComponents(index, "button", { include_duplicates: false });
  for (const c of res.components) {
    assert.notEqual(c.isCanonical, false, `${c.id} should be canonical`);
  }
});

test("dedup: include_duplicates reaches non-canonical", () => {
  const off = searchComponents(index, "button", { include_duplicates: false });
  const on = searchComponents(index, "button", { include_duplicates: true });
  assert.ok(on.components.length >= off.components.length);
});

test("trust tier: local components are verified", () => {
  const locals = index.components.filter((c) => c.origin === "local");
  assert.ok(locals.length > 0);
  for (const c of locals) {
    assert.equal(c.trustTier, "verified");
    assert.equal(c.licenseClass, "first-party");
  }
});

test("trust tier: catalogue components are linked or reference", () => {
  const cats = index.components.filter((c) => c.origin === "catalogue");
  for (const c of cats) {
    assert.ok(c.trustTier === "linked" || c.trustTier === "reference");
  }
  const linked = cats.filter((c) => c.trustTier === "linked").length;
  assert.equal(linked, 15, "15 linked (sourceUrl) records");
});

test("componentHandoff: reference records do not say 'copy exactly'", () => {
  const ref = index.components.find((c) => c.origin === "catalogue" && c.trustTier === "reference");
  assert.ok(ref);
  const h = componentHandoff(ref);
  assert.ok(!h.copyInstruction.includes("Do not paraphrase"), "reference must not say 'do not paraphrase'");
  assert.ok(h.copyInstruction.includes("Reference-only") || h.copyInstruction.includes("illustrative"));
});

test("componentHandoff: verified records say 'copy exactly'", () => {
  const local = index.components.find((c) => c.origin === "local");
  const h = componentHandoff(local);
  assert.ok(h.copyInstruction.includes("Do not paraphrase"));
  assert.ok(h.suggestedPath === local.file);
});

test("componentHandoff: catalogue suggestedPath uses catalogue/ prefix", () => {
  const cat = index.components.find((c) => c.origin === "catalogue");
  const h = componentHandoff(cat);
  assert.ok(h.suggestedPath.startsWith("src/components/catalogue/"), h.suggestedPath);
  assert.ok(!h.suggestedPath.startsWith("src/components/ui/"));
});

test("search: description-only match returns the record", () => {
  // find a component whose description contains a distinctive word
  const target = index.components.find((c) => c.description && c.description.length > 40);
  assert.ok(target);
  const match = target.description.match(/[a-zA-Z]{7,}/);
  assert.ok(match, "need a distinctive word");
  const word = match[0];
  const res = searchComponents(index, word, { include_duplicates: true, license_policy: "any" });
  assert.ok(res.components.some((c) => c.id === target.id), `search for "${word}" should find ${target.id}`);
});

test("licence policy: permissive-only excludes non-permissive", () => {
  const any = searchComponents(index, "button", { license_policy: "any", include_duplicates: true });
  const perm = searchComponents(index, "button", { license_policy: "permissive-only", include_duplicates: true });
  assert.ok(perm.components.length <= any.components.length);
  for (const c of perm.components) {
    assert.ok(c.licenseClass === "first-party" || c.licenseClass === "permissive", `${c.id} ${c.licenseClass}`);
  }
});

test("did you mean: suggestNames returns suggestions for typo", () => {
  const sug = suggestNames(index, "buttun", 5);
  assert.ok(sug.length > 0);
  assert.ok(sug.some((n) => /button/i.test(n)));
});

test("preview urls are absolute for catalogue", () => {
  const cat = index.components.find((c) => c.origin === "catalogue");
  assert.ok(cat.resolvedPreviewUrl === null || /^https?:\/\//.test(cat.resolvedPreviewUrl));
  assert.ok(cat.catalogue?.previewUrl === null || /^https?:\/\//.test(cat.catalogue?.previewUrl ?? ""));
});