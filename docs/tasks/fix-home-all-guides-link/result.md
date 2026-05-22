# Fix Home All Guides Link Result

## Delivered Scope
- Restored `/guides` to the full guide category list page.
- Added `/guides/start` for the fixed starting guide document.
- Updated the Home starting guide card to use `/guides/start`, leaving the guides tab "전체 보기" action on `/guides`.

## Key Decisions
- Kept category route semantics consistent with `/faq` and `/library`: root category paths show lists.
- Kept the starting guide route before `/guides/:slug` so it resolves as a static page route instead of an article slug.

## Validation Evidence
- `pnpm --filter @sfood/web typecheck`: Passed.
- `pnpm --filter @sfood/web test`: Passed, 6 files / 28 tests.
- `pnpm typecheck`: Passed.

## Remaining Gaps Or Risks
- Full workspace `pnpm test` was not run; web tests and full workspace typecheck covered the changed surface.
- Any existing bookmark that expected `/guides` to open the starting guide will now see the guide list, matching the visible "전체 보기" label.
