# Home Search Center Guide Emphasis Result

## Delivered Scope
- Re-centered the Home search hero with wider top/bottom breathing room so search reads as the primary action.
- Set the search box to a narrower `max-w-2xl` width inside the `max-w-3xl` hero frame.
- Kept recommendation and blueprint as secondary support frames and widened them to `max-w-4xl` to reduce desktop side whitespace.
- Added a distinct header band to the recommendation card.
- Reduced the recommendation header emphasis after converting the body to cards.
- Converted the recommended guide list into a card section.
- Kept one featured starting guide card and four regular guide cards so the desktop grid stays balanced.
- Restored the featured card title to `시작 가이드`.
- Reduced the left/right empty space inside the recommendation card section.
- Reduced the visible desktop left/right whitespace around the recommendation and blueprint sections without changing the search box width.
- Replaced the row icon with a document-style glyph so it no longer duplicates the trailing arrow.
- Added icons to every guide card.

## Key Decisions
- Search is visually dominant through vertical space and central placement, not by making every supporting block smaller.
- Kept the pinned guide as the primary recommendation in a featured card.
- Limited regular guide cards to four so the grid resolves cleanly as two rows on desktop.

## Validation Evidence
- Playwright `1280x800`: search box `672px`, guide card `768px`, guide list `672px`, blueprint `768px`.
- Playwright `800x513`: search box `672px`, guide card `718px`, guide list `672px`, blueprint `718px`.
- Playwright `1280x800`: 5 recommendation cards total; 1 featured card plus 4 regular cards in a 2x2 grid.
- Playwright `1280x800`: featured card title rendered as `시작 가이드`, with the card grid widened to `734px` inside the `768px` recommendation frame.
- Playwright `1280x800`: after support frame widening, search box remained `672px`, recommendation frame became `896px`, and blueprint became `896px`.
- Playwright `390x844`: no horizontal overflow, document scroll width remained `390px`.
- `pnpm --filter @sfood/web typecheck`: Passed.
- `pnpm --filter @sfood/web test`: Passed, 9 files / 31 tests.
- `pnpm typecheck`: Passed.

## Remaining Gaps Or Risks
- The stronger pinned row depends on the current Home guide list structure.
- The guide block height is still bounded by the number of recommended guide rows.
