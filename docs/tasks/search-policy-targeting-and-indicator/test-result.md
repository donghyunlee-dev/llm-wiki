# search-policy-targeting-and-indicator Test Result

## Scope
- Policy-targeting contract and UI indicator for search and page `AI Ask`.

## Environment
- Profile: local development
- Database: none
- External dependencies: none executed in this task

## Commands
- `pnpm --filter @sfood/wiki-core test -- src/lib/aiAsk.test.ts`
- `pnpm --filter @sfood/web test -- src/ui/searchRecommendations.test.ts`
- `pnpm typecheck`

## Results
- PASS: `packages/wiki-core` tests passed after adding the `policyNotice` schema field to both AI contracts.
- PASS: `apps/web` tests passed after removing `guideDocuments` usage from the search recommendation path.
- PASS: workspace typecheck passed after updating the search and article answer client types.

## Failure Notes
- No live Confluence/OpenAI request was executed in this task.

## Retest Results
- No retest loop was needed after the first code pass.

## Acceptance Criteria Coverage
- AC1: Passed. Search and page `AI Ask` outputs now require `policyNotice`.
- AC2: Passed. Search and article answer UIs render a visible notice only when `policyNotice.isPolicyRelated` is true.
- AC3: Passed. `guideDocuments` was removed from the search response path and client usage.
- AC4: Passed. Task docs and PRD docs record policy pages as hidden answer-generation targets.
