# search-rovo-like-answer-quality Test Result

## Scope
- Improve search retrieval and answer consistency so employee-facing search can produce a grounded answer closer to the Confluence Rovo result for page-backed topics.

## Environment
- Profile: local repository
- Database: none
- External dependencies: Confluence-backed env and OpenAI-backed dev API if reproduced live

## Commands
- `pnpm --filter @sfood/wiki-core test`
- `pnpm --filter @sfood/web test`
- `pnpm typecheck`
- `pnpm dev`
- `curl -sS -m 90 -H 'Content-Type: application/json' -d '{"question":"claude worktree를 설명하세요."}' http://localhost:5174/api/wiki/ai/search`

## Results
- PASS: `packages/wiki-core` tests passed after retrieval scoring and fallback-query changes.
- PASS: `apps/web` tests passed after no-page answer normalization changes.
- PASS: workspace `pnpm typecheck` passed.
- PASS: live dev API retest for `claude worktree를 설명하세요.` returned:
  - `confluenceData[0].pageId = "95780877"`
  - `recommendedDocuments[0].id = "95780877"`
  - visible answer grounded in `Claude Code Worktrees`

## Failure Notes
- `sufficiency` remains `부족` for the reproduced answer because the current rule still requires at least 2 recommended documents for `충분`.
- Query-understanding completion was not re-instrumented in this task; the fix assumes Stage 1 may still fail and hardens the deterministic fallback path.

## Retest Results
- Initial regression tests passed for `wiki-core`.
- Initial `apps/web` tests failed because the no-page regex used `\b` with Korean text and did not match. After removing the word-boundary anchor, `apps/web` tests passed.

## Acceptance Criteria Coverage
- AC1: PASS — retrieval now surfaces page `95780877` into the AI context path, confirmed by live API result.
- AC2: PASS — the dev API no longer emits a no-page answer for the `Claude Code Worktrees` query.
- AC3: PASS — no-page visible answers are now normalized as unsupported even when `unsupportedClaims` is empty.
- AC4: PASS — retrieval and no-page normalization regressions are covered by automated tests.
