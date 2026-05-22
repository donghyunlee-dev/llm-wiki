# Home Search Center Guide Emphasis Spec

## Problem Statement
- The Home search block still sits too high in the page and feels visually light.
- The pinned starting guide needs stronger emphasis so it reads like the primary guide entry, not a plain document row.
- The recommended guide list should read more like a list with icons and tighter vertical rhythm.
- The Home hierarchy still needs to make search the dominant primary action while recommendation and blueprint blocks read as secondary support.

## Business Context
- The Home screen should direct the user to search first, then the guide entry path.
- The starting guide is the most important guide recommendation and needs clearer hierarchy.

## Scope
- Center the Home search area more vertically.
- Reduce the vertical spacing around the recommended guide block.
- Emphasize the pinned starting guide visually.
- Add icons to the guide rows so the list reads as a structured list.
- Make the search component visually central with broader top/bottom breathing room.
- Allow the search input to be narrower than the supporting recommendation card.
- Improve the recommended guide header treatment.
- Narrow the guide list rows within the recommendation card.
- Convert the recommended guide list into a card section.
- Keep the non-pinned guide card grid to an even count so desktop rows stay balanced.
- Reduce the visible left/right whitespace around the recommendation and blueprint support sections without changing the search box width.

## Out Of Scope
- Changing guide ranking, guide filtering, or `/guides` page behavior.
- Reintroducing the removed project/FAQ/library sections on Home.
- Search page behavior.

## User Or Operator Scenarios
- A user lands on Home and the search feels like the central action.
- A user sees the starting guide as the most prominent recommendation.
- A user scans the guide list with icons and clearer row structure.

## Acceptance Criteria
- The Home search block sits more centrally with increased top/bottom breathing room.
- The search box is narrower than the supporting recommendation and blueprint frame.
- The recommended guide block has tighter vertical spacing around it.
- The recommended guide header has a clearer visual treatment.
- The guide list rows are narrower than the recommendation card frame.
- The recommended guide area renders as cards, not list rows.
- The non-pinned recommendation cards render in an even count.
- The pinned starting guide is visually stronger than the other guide rows.
- Each recommended guide row includes an icon.
- The recommendation and blueprint support sections use a wider desktop frame than the search box so they feel less inset.

## Edge Cases
- The starting guide card still renders cleanly if the guide corpus is loading or partially empty.
- The list remains readable on smaller viewports after the spacing changes.

## Assumptions
- The current pinned guide logic remains the same.
- The existing shared Home data source and guide list rendering should be reused.

## Clarifications
- Question: Should the starting guide use a different card style or just stronger row emphasis?
- Answer: Use a stronger row/card style within the same list so the page remains compact.
