import assert from "node:assert/strict";
import { test } from "node:test";

test("sanity: 1+1=2", () => {
  assert.equal(1 + 1, 2);
});

test("can import component-index via tsx", async () => {
  const mod = await import("../../mcp/lib/component-index.ts");
  assert.ok(typeof mod.buildComponentIndex === "function");
  assert.ok(typeof mod.searchComponents === "function");
  assert.ok(typeof mod.suggestNames === "function");
});
