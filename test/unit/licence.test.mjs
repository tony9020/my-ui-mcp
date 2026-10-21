import assert from "node:assert/strict";
import { test } from "node:test";
import { licenseClass, extractImports } from "../../mcp/lib/derived.ts";

test("licenseClass: MIT variants are permissive", () => {
  assert.equal(licenseClass("MIT"), "permissive");
  assert.equal(licenseClass("MIT-0"), "permissive");
  assert.equal(licenseClass("mit"), "permissive");
});

test("licenseClass: Apache/BSD/ISC permissive", () => {
  assert.equal(licenseClass("Apache-2.0"), "permissive");
  assert.equal(licenseClass("BSD-3-Clause"), "permissive");
  assert.equal(licenseClass("ISC"), "permissive");
});

test("licenseClass: MPL weak-copyleft", () => {
  assert.equal(licenseClass("MPL-2.0"), "weak-copyleft");
});

test("licenseClass: AGPL strong-copyleft", () => {
  assert.equal(licenseClass("AGPL-3.0"), "strong-copyleft");
});

test("licenseClass: NO-LICENSE is none", () => {
  assert.equal(licenseClass("NO-LICENSE"), "none");
  assert.equal(licenseClass(null), "none");
  assert.equal(licenseClass(""), "none");
});

test("licenseClass: Commons Clause restricted", () => {
  assert.equal(licenseClass("MIT + COMMONS CLAUSE"), "restricted");
});

test("extractImports: extracts npm packages", () => {
  const code = `import React from "react";\nimport { Button } from "@/components/ui/button";\nimport { motion } from "framer-motion";\nimport("lodash/debounce");`;
  const pkgs = extractImports(code);
  assert.ok(pkgs.has("react"));
  assert.ok(pkgs.has("framer-motion"));
  assert.ok(pkgs.has("lodash"));
  assert.ok(!pkgs.has("@/components/ui/button"));
});

test("extractImports: handles scoped packages", () => {
  const code = `import { Slot } from "@radix-ui/react-slot";`;
  const pkgs = extractImports(code);
  assert.ok(pkgs.has("@radix-ui/react-slot"));
});