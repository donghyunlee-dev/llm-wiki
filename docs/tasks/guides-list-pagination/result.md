# Guides List Pagination Result

## Delivered Scope
- Filtered `/guides` to guide documents only, excluding intro-style pages.
- Moved the guide index map card to the bottom of the guide page.
- Added simple client-side pagination for longer guide lists.
- Renamed the `/guides` page title to `추천 가이드`.
- Simplified the toolbar down to a single integrated search field.
- Hid the guide index map view button.

## Key Decisions
- Kept pagination in the shared category page so the behavior stays consistent and local.
- Kept the intro filter narrow, based on the existing guide-style title/slug patterns.

## Validation Evidence
- `pnpm --filter @sfood/web typecheck`: Passed.
- `pnpm --filter @sfood/web test`: Passed, 9 files / 31 tests.
- `pnpm typecheck`: Passed.

## Remaining Gaps Or Risks
- If a future guide uses an `intro`-like title or slug for a legitimate article, it will be hidden by the current filter.
- Pagination is client-side only, so very large corpora still load into the browser before slicing.
