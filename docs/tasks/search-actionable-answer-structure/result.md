# search-actionable-answer-structure Result

## Delivered Scope
- Added structured actionable search fields so the search result can render followable steps, commands, checks, cautions, and guide links deterministically.
- Kept the short direct answer while moving the execution-heavy content into first-class arrays.
- Verified the reproduced Claude CLI install query now returns a detailed actionable result.

## Changed Files
- `packages/wiki-core/src/lib/aiAsk.ts`
- `packages/wiki-core/src/lib/aiAsk.test.ts`
- `apps/web/src/lib/aiSearchResponse.ts`
- `apps/web/src/lib/aiSearchResponse.test.ts`
- `apps/web/src/ui/pages/SearchPage.tsx`
- `apps/web/src/styles.css`
- `apps/web/vite.config.ts`
- `docs/tasks/search-actionable-answer-structure/spec.md`
- `docs/tasks/search-actionable-answer-structure/plan.md`
- `docs/tasks/search-actionable-answer-structure/tasks.md`
- `docs/tasks/search-actionable-answer-structure/test-result.md`
- `docs/tasks/search-actionable-answer-structure/result.md`

## Key Decisions
- Stop depending on prose quality alone for search answers.
- Keep guide links at the bottom through `recommendedDocuments`.
- Treat actionable arrays as the canonical execution-oriented search payload.

## Open Gaps
- This task validated the reproduced Claude CLI install query. Broader search prompt quality across other query classes still needs follow-up.

## Next Steps
- Let the user verify the UI directly in the running service.
