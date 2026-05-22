# Home Main Search Guides Only Test Result

## Commands
- `pnpm --filter @sfood/web typecheck`
- `pnpm --filter @sfood/web test`
- `pnpm typecheck`

## Results
- `pnpm --filter @sfood/web typecheck`: Passed.
- `pnpm --filter @sfood/web test`: Passed, 8 files / 30 tests.
- `pnpm typecheck`: Passed across `packages/wiki-core`, `apps/web`, and `packages/serverless`.

## Skipped Checks
- Full workspace `pnpm test` was not run; the web surface changed and the web package suite covered the affected route/component behavior.

## Acceptance Criteria Coverage
- Home now shows search first and recommended guides below it.
- The help sentence appears below the search control.
- Visible search example text is no longer rendered on Home.
- Project examples, FAQ, library, and project design sections are no longer visible on Home.
- The starting guide item links to `/guides/agent-start`, with `/guides/start` kept as a compatibility alias.
- The starting guide is followed by five additional recommended guides.
- The blueprint CTA appears below the guide list.
- The `사내 지식 위키` label appears in the centered site header.
- The blueprint and recommended guide card now share the same max width.

## Retest Notes
- No failed validation required retesting.
