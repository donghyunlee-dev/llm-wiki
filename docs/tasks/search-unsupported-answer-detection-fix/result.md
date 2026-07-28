# search-unsupported-answer-detection-fix Result

## Delivered Scope
Fixed AI search showing `추천 페이지`/`관련 페이지` for answers where the AI found no supporting document. Root cause: the "fully unsupported" detection relied on two unstable AI free-text signals (`unsupportedClaims` field, which the model sometimes leaves empty, and an anchored regex match against the visible answer text, which breaks on any phrasing drift like an "I'm sorry, but ..." prefix). Simplified to depend solely on `confluenceData.length === 0` — a structured field the AI can only populate with real page citations, reliable regardless of how the visible answer is worded.

## Changed Files
- `packages/wiki-core/src/lib/searchAnswerState.ts`
- `packages/wiki-core/src/lib/searchAnswerState.test.ts`
- `apps/web/src/ui/searchRecommendations.test.ts`
- `docs/prd/search-flow-contract.md`
- `docs/tasks/search-unsupported-answer-detection-fix/` (new)

## Key Decisions
- Kept `isNoPageStyleSearchAnswer`/`NO_PAGE_ANSWER_PATTERNS` defined (still used by `normalizeUnsupportedClaimsForSearchResult` to synthesize a fallback `unsupportedClaims` message) — only removed their role in the recommendation-suppression decision itself.
- Read `docs/prd/search-flow-contract.md` and confirmed this is an implementation bug against an already-documented contract ("완전 미지원 응답은 두 배열을 모두 비운다"), not a new design decision — updated the doc to reflect the corrected, simpler detection rule per this repo's AI-behavior-change discipline (docs first, then code).
- Left the separate, previously-reported index-page leak issue (non-`nav`-docType pages titled "... Index" appearing in recommendations) out of scope — the user asked to hold that fix until later.

## Validation
See `test-result.md`. `pnpm -r typecheck`/`test` pass (317 tests), `pnpm --filter @sfood/web build` passes, and the fix was deployed to the live `ai-search` Lambda and confirmed against the exact reproduced failure combination.
