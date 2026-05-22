# search-policy-targeting-and-indicator Plan

## Summary
- Make policy participation explicit in the AI answer contracts and UI, while keeping policy pages hidden from visible search results and recommendations.
- Clean up the search payload by removing `guideDocuments` so the contract reflects the actual intended fields.

## Impacted Modules
- `packages/wiki-core/src/lib/aiAsk.ts`
- `packages/wiki-core/src/lib/aiAsk.test.ts`
- `apps/web/vite.config.ts`
- `apps/web/src/ui/pages/SearchPage.tsx`
- `apps/web/src/ui/pages/ArticleAskPanel.tsx`
- `apps/web/src/ui/searchRecommendations.ts`
- `apps/web/src/ui/searchRecommendations.test.ts`
- `docs/prd/api-spec.md`
- `docs/prd/implementation-status.md`
- `docs/prd/development-plan.md`

## Architecture Approach
- Keep policy documents hidden and separate from visible wiki results.
- Extend both AI schemas with a small `policyNotice` object:
  - `isPolicyRelated`
  - `message`
- Instruct the model to set the object only when policy materially shaped the answer.
- Render the notice in both search and article answer surfaces.
- Remove `guideDocuments` from the server response and client types, leaving `recommendedDocuments` as the single visible recommendation list.

## Data And API Impact
- Search response shape changes:
  - add `policyNotice`
  - remove `guideDocuments`
- Page `AI Ask` response shape changes:
  - add `policyNotice`
- No persistence changes.

## Validation Plan
- Update unit tests for AI schemas and prompt construction.
- Update client-side tests affected by response contract cleanup.
- Run targeted tests:
  - `pnpm --filter @sfood/wiki-core test -- src/lib/aiAsk.test.ts`
  - `pnpm --filter @sfood/web test -- src/ui/searchRecommendations.test.ts`
- Run workspace validation if the change stabilizes cleanly:
  - `pnpm typecheck`

## Risks
- The model may overuse the policy flag if instructions are too broad.
- The model may underuse the policy flag if the instruction is too weak.
- Search UI and article UI can drift if they do not share the same contract.

## Rollback Considerations
- Revert the schema and UI notice changes together.
- If the policy notice quality is poor, keep the hidden policy context but remove the visible notice until the prompt is improved.
