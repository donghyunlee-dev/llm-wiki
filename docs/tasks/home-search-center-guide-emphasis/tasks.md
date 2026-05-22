# Home Search Center Guide Emphasis Tasks

## Implementation Tasks
- [x] Capture the Home emphasis request in a task spec and plan.
- [x] Center the search area more vertically.
- [x] Tighten the vertical spacing around the recommended guide block.
- [x] Tighten the vertical spacing around the recommended guide block without changing the search block.
- [x] Emphasize the starting guide row.
- [x] Add icons to the guide list rows.
- [x] Restore the Home search box width after the guide block compression pass.
- [x] Narrow the recommended guide list block without changing the blueprint spacing.
- [x] Replace the duplicate arrow-style list icon with a document-style icon.
- [x] Restore the search block to full hero width and narrow the recommended guide block independently.
- [x] Align the Home search, recommended guide, and blueprint blocks to one shared width.
- [x] Rebalance the vertical spacing between the Home blocks.
- [x] Reposition the search hero as the dominant center area with wider top/bottom breathing room.
- [x] Make the search box narrower than the recommendation card on tablet and desktop widths.
- [x] Improve the recommended guide header treatment.
- [x] Narrow the guide list inside the recommendation card.
- [x] Convert the recommended guide list into a card section.
- [x] Keep the non-pinned recommendation card grid to an even count.
- [x] Restore the pinned card title from `추천 가이드` to `시작 가이드`.
- [x] Remove the over-emphasized recommendation header treatment.
- [x] Reduce left/right empty space inside the recommendation card section.
- [x] Reduce desktop left/right whitespace around the recommendation and blueprint support sections without changing the search width.

## Test Tasks
- [x] Add or update a Home render test for the guide row structure.
- [x] Run web typecheck.
- [x] Run web tests.
- [x] Run workspace typecheck.

## Documentation Tasks
- [x] Update PRD docs if the Home hierarchy changes materially.
- [x] Record validation results.
- [x] Record the final outcome.

## Progress Notes
- 2026-05-19: The Home search area still sits high and the pinned guide row looks too plain.
- 2026-05-19: Home now centers the search block more vertically, uses icon-led guide rows, and gives the pinned recommendation a stronger treatment.
- 2026-05-19: Reduced only the recommended guide block height so the search area stays unchanged while the guide list becomes denser.
- 2026-05-19: Restored the Home search box width to `max-w-3xl` after the guide block tightening pass.
- 2026-05-19: Narrowed the recommended guide list width and restored the blueprint gap; replaced the guide row icon with a document glyph.
- 2026-05-19: Playwright confirmed the search box is back to full hero width while the guide list is narrower than the blueprint CTA.
- 2026-05-19: Aligned search, recommended guides, and blueprint on the same `max-w-3xl` frame and reduced the hero-to-guide gap.
- 2026-05-19: Re-centered the search hero with larger vertical space, narrowed the search box and guide list to `max-w-2xl`, and made the recommendation card/header a secondary support surface.
- 2026-05-19: Converted recommended guides to one featured starting card plus four regular guide cards in a balanced two-column grid.
- 2026-05-19: Corrected the starting card title to `시작 가이드`, simplified the recommendation header, and widened the card area inside the recommendation frame.
- 2026-05-19: Widened the shared recommendation/blueprint support frame from `max-w-3xl` to `max-w-4xl`; Playwright confirmed the desktop support frame width is now `896px` while the search box remains `672px`.

## Review Notes
- Keep the change local to the Home surface and shared home styles.
