# search-rovo-like-answer-quality Plan

## Summary
- Improve the search pipeline in the order that matters most for this failure mode:
  1. Retrieval and candidate selection
  2. Query-understanding fallback
  3. Answer/result assembly consistency
- Keep the current Confluence-backed corpus and OpenAI answer generation model, but reduce the gap between current behavior and the Rovo answer benchmark for page-backed topics.

## Impacted Modules
- `packages/wiki-core/src/lib/wikiDocuments.ts`
- `packages/wiki-core/src/lib/wikiDocuments.test.ts`
- `packages/wiki-core/src/lib/aiAsk.ts`
- `packages/wiki-core/src/lib/aiAsk.test.ts`
- `apps/web/vite.config.ts`
- `apps/web/src/ui/searchRecommendations.test.ts`
- `docs/prd/search-flow-contract.md`
- `docs/prd/implementation-status.md`

## Architecture Approach
- Preserve the existing architecture: Confluence corpus -> lexical/index-first retrieval -> expanded AI context -> structured answer payload.
- Improve deterministic retrieval before adding more AI dependence.
- Treat prompt rules as post-retrieval prompt augmentation only; do not rely on them to rescue a page that never enters the candidate set.

## Data And API Impact
- No external API contract changes are required.
- Internal search behavior may change in:
  - how candidate documents are ranked or rescued into context
  - how Stage 1 fallback search keywords are derived
  - how unsupported/no-page AI outputs are normalized into final response payloads

## Validation Plan
- Add retrieval tests around singular/plural technical term handling and page-vs-guide ranking for concept questions.
- Add or update search prompt/response tests for no-page answer consistency.
- Run:
  - `pnpm --filter @sfood/wiki-core test`
  - `pnpm --filter @sfood/web test`
  - `pnpm typecheck`
- If feasible, reproduce the local search query through the dev API after code changes.

## Risks
- Over-correcting retrieval for one topic family could regress broader concept-question ranking.
- Existing uncommitted search UI changes may overlap with response assembly files.
- Live behavior still depends on model output quality even after retrieval is improved.

## Rollback Considerations
- The changes are isolated to retrieval/prompt/response assembly helpers and can be reverted without data migration.
