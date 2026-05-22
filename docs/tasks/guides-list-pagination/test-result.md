# Guides List Pagination Test Result

## Commands
- `pnpm --filter @sfood/web typecheck`
- `pnpm --filter @sfood/web test`
- `pnpm typecheck`

## Results
- `pnpm --filter @sfood/web typecheck`: Passed.
- `pnpm --filter @sfood/web test`: Passed, 9 files / 31 tests.
- `pnpm typecheck`: Passed across `packages/wiki-core`, `apps/web`, and `packages/serverless`.

## Skipped Checks
- Full workspace `pnpm test` was not run; the web route and render behavior were covered by the web package suite.

## Acceptance Criteria Coverage
- `/guides` lists only `metadata.docType === "guide"` documents.
- Intro-style guide pages do not appear in the visible guide list.
- The guide index map card is rendered below the guide list.
- The guide list is paginated when there are more items than fit on one page.
- The page title reads `추천 가이드`.
- The toolbar exposes only integrated search, not the removed audience/type/sort controls.
- The guide index map view button is hidden.

## Retest Notes
- No failed validation required retesting.
