# search-unsupported-answer-detection-fix Plan

## Impacted Areas
- `packages/wiki-core/src/lib/searchAnswerState.ts`
- `packages/wiki-core/src/lib/searchAnswerState.test.ts`
- `apps/web/src/ui/searchRecommendations.test.ts` (fixture updates only — several existing tests omitted `confluenceData` in mock answers, which now matters since it's the sole signal)
- `docs/prd/search-flow-contract.md`

## Technical Approach
Simplify `isFullyUnsupportedSearchAnswerState` to `Boolean(answer && (answer.confluenceData?.length ?? 0) === 0)`, dropping the `unsupportedClaims`/text-regex OR-condition entirely. Document the new single-signal rule in `search-flow-contract.md`, explaining why `confluenceData` is reliable where the other two signals aren't (structured field vs. free-form AI text).

Existing `searchRecommendations.test.ts` fixtures that mocked a "supported" answer without including `confluenceData` at all now need an explicit non-empty `confluenceData`, since `undefined` and `[]` both evaluate to length 0 under the new check — these fixtures were just incomplete mocks (real API responses always include the field), not testing a genuinely different scenario.

## Validation Plan
- `pnpm -r typecheck`/`test`/`build`.
- Live verification against the deployed `ai-search` Lambda: reproduce the original failure combination (varied phrasing of a nonexistent-feature question) before and after the fix, confirming `recommendedDocuments`/`relatedDocuments` are empty once `confluenceData` is empty regardless of `unsupportedClaims`/answer wording.

## Risks
- None identified — this is a strict simplification (fewer OR-conditions), not a behavior expansion. The only way this differs from old behavior is in the direction of *more* aggressively suppressing recommendations, matching the documented contract intent.
