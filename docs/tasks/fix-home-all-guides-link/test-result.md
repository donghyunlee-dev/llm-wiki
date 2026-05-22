# Fix Home All Guides Link Test Result

## Commands
- `pnpm --filter @sfood/web typecheck`
- `pnpm --filter @sfood/web test`
- `pnpm typecheck`

## Results
- `pnpm --filter @sfood/web typecheck`: Passed.
- `pnpm --filter @sfood/web test`: Passed, 6 files / 28 tests.
- `pnpm typecheck`: Passed across `packages/wiki-core`, `apps/web`, and `packages/serverless`.

## Skipped Checks
- Full workspace `pnpm test` was not run because the change is limited to web routing and page composition; the web package test suite was run.

## Acceptance Criteria Coverage
- `/guides` now renders the shared guide category list through `CategoryPage section="guides"`.
- Home guides tab "전체 보기" still links to `/guides`, which now shows the full list instead of the starting guide.
- Home starting guide card now links to `/guides/start`.
- `/guides/start` renders the previous fixed starting guide content using document `63668231`.

## Retest Notes
- No failed validation required a retest.
