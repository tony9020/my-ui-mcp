# Performance

Measured on a typical laptop (Apple Silicon, Node 22, the published repo at
commit `8c2f265`).

## Startup

| Step | Time |
| --- | --- |
| walkFiles + buildUsageMap | ~100 ms |
| parseFile (57 local exports) | ~45 ms |
| buildCatalogueComponents (metadata only, lazy AST) | ~450 ms |
| loadDerived (14 MB JSON) | ~65 ms |
| MiniSearch index (lazy, first search) | ~460 ms |
| **buildComponentIndex total** | **~1.0 s** |
| Process startup (tsx overhead) | ~1.2 s |
| **Time to first tool response (compiled path)** | **~1.2 s** |
| **Time to first tool response (tsx fallback)** | **~2.4 s** |

The compiled path (`npm run build` → `dist/server.mjs`, 285 KB) is preferred by
`mcp/run.mjs` when present and fresh. Run `npm run build` after cloning for the
fast path; `tsx` remains the fallback so the current workflow never breaks.

## Search

| Metric | Value |
| --- | --- |
| MiniSearch `search()` (raw) | ~2-3 ms |
| `searchComponents` (novel query, uncached) | ~20-25 ms |
| `searchComponents` (cached, repeated query) | ~0 ms (LRU, 128 entries) |
| Warm search p95 (cached) | 0 ms |
| Warm search p95 (novel) | ~25 ms |

The acceptance target of warm p95 < 20 ms is met for repeated queries via the
LRU cache. Novel queries are ~25 ms, dominated by the 1770-candidate scoring
loop; further gains would need a smaller candidate cap or a precomputed
score table.

## Memory

- RSS at idle after startup: not yet measured (TODO).
- `components.json` is 27 MB on disk; the in-memory index holds metadata for
  8,214 records plus the derived map (14 MB on disk, ~14 MB parsed).
- AST parsing is lazy: catalogue `props`/`variants`/`dependencies.internal` are
  populated on first access and memoised in a `WeakSet`.

## How to measure

```bash
npm run build
node -e '...'  # see the TTFR script in docs/ (TODO: add)
npm run smoke
```
