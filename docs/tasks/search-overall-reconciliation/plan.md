# search-overall-reconciliation Plan

## Summary
- Reconcile the search implementation with the documented contract by aligning candidate selection, prompt guidance, response parsing, and visible rendering around the same index-first search model.
- Treat search as one pipeline: document pool -> candidate ranking -> prompt context -> model output -> parser normalization -> visible answer and recommendation sections.

## Impacted Modules
- `packages/wiki-core/src/lib/wikiDocuments.ts`
- `packages/wiki-core/src/lib/aiAsk.ts`
- `packages/wiki-core/src/lib/wikiDataSource.ts`
- `apps/web/vite.config.ts`
- `apps/web/src/lib/aiSearchResponse.ts`
- `apps/web/src/ui/structuredAnswer.ts`
- `apps/web/src/ui/pages/SearchPage.tsx`
- `apps/web/src/ui/searchRecommendations.ts`
- `apps/web/src/ui/StructuredAnswerView.tsx`
- `docs/prd/search-flow-contract.md`
- `docs/prd/ai-ask-prompt-guide.md`
- `docs/prd/development-plan.md`
- `docs/prd/implementation-status.md`

## Architecture Approach
- Keep the search flow deterministic and read-only.
- Make the search candidate path explicitly index-first for guide-heavy questions, then expand into child, related, and supporting pages.
- Treat recommendation ordering as strongest-first across multiple strong cards, not a one-card primary-only slot.
- Keep filtering rules in shared source/ranking helpers instead of duplicating them in the UI.
- Normalize AI search answers once in the shared web parser/rendering path so the visible surface never depends on a single fragile cleanup step.
- Keep the visible answer format separate from the recommendation list so the answer text, primary page, and related pages can evolve independently.

## Data And API Impact
- No persistent schema change is required.
- The `/api/wiki/ai/search` payload and visible `recommendedDocuments` may be adjusted only if needed to keep the UI and parser aligned.
- Cache behavior remains memory-based, keyed by page ID/version or normalized question, with TTL refresh and version invalidation.

## Validation Plan
- Add or update unit tests for:
  - index-first candidate ordering
  - question-intent routing
  - prefix and JSON cleanup
  - recommendation selection and deduplication
- Re-run representative search queries in the browser:
  - conceptual question
  - setup question
  - troubleshooting question
  - planning question
- Validate the search contract against the implementation before shipping.
- Run workspace checks after changes:
  - `pnpm --filter @sfood/web test`
  - `pnpm typecheck`

## Risks
- Tightening index-first ranking can overcorrect and push setup pages down too far.
- Response cleanup can accidentally trim legitimate content if marker detection is too broad.
- The search pipeline spans shared helpers and UI code, so a partial fix can easily drift again if only one layer is updated.

## Rollback Considerations
- Keep the ranking, parsing, and rendering changes separable so a regression can be rolled back without reverting the entire search flow.
- Preserve the previous candidate ordering behavior in tests so scoring changes can be narrowed if needed.
