# search-actionable-answer-structure Plan

## Summary
- Replace the search answer’s over-reliance on freeform prose with a structured actionable contract and matching UI rendering.

## Impacted Modules
- `packages/wiki-core/src/lib/aiAsk.ts`
- `packages/wiki-core/src/lib/aiAsk.test.ts`
- `apps/web/src/lib/aiSearchResponse.ts`
- `apps/web/src/lib/aiSearchResponse.test.ts`
- `apps/web/src/ui/pages/SearchPage.tsx`
- `apps/web/src/styles.css`

## Architecture Approach
- Keep `answer` as a short direct answer.
- Add structured fields:
  - `immediateActions`
  - `exampleCommands`
  - `verificationChecks`
  - `cautions`
- Require setup/install answers to fill these fields when the corpus supports them.
- Render those fields directly in the UI above `추천 페이지`.

## Data And API Impact
- Search response contract expands with structured actionable fields.
- Search parser normalizes those new arrays.

## Validation Plan
- `pnpm --filter @sfood/wiki-core test -- src/lib/aiAsk.test.ts`
- `pnpm --filter @sfood/web test -- src/lib/aiSearchResponse.test.ts src/ui/searchRecommendations.test.ts`
- `pnpm typecheck`
- Repeated local query validation for:
  - `윈도우에서 claude code cli 설치하는 방법`

## Risks
- The model may still leave some structured arrays empty.
- The UI can become too sparse if fallback rendering is weak.

## Rollback Considerations
- Revert schema and UI changes together if they regress non-setup answers.
