# search-intent-aware-ranking Result

## Summary
- Implemented an intent-aware search ranking pass that separates concept, setup, troubleshooting, comparison, planning, and general queries.
- Added doc-role scoring so broad overview pages can outrank tool-specific setup pages when the user asks for a definition or conceptual explanation.
- Tightened index expansion so generic guide-index tokens do not leak unrelated same-category pages into the candidate set.

## Delivered Scope
- `packages/wiki-core/src/lib/wikiDocuments.ts`
- `packages/wiki-core/src/lib/wikiDocuments.test.ts`
- `packages/wiki-core/src/lib/aiAsk.ts`
- `packages/wiki-core/src/lib/aiAsk.test.ts`
- `apps/web/src/ui/searchRecommendations.ts`
- `apps/web/src/ui/searchRecommendations.test.ts`
- `apps/web/vite.config.ts`

## Remaining Gaps
- Live dev-server verification still needs a clean restart check because the local API can retain earlier cached responses.
- The next validation pass should confirm that `mcp가 뭐지?` consistently lands on the broad overview page family after cache reset.
