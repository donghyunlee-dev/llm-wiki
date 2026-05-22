# Guides List Pagination Spec

## Problem Statement
- The `/guides` page can show non-guide documents such as intro-related pages because it currently includes all `guides` section documents.
- The guide index map card appears above the list, but the requested layout is to keep it at the bottom.
- When there are many guide documents, the page should be paginated instead of showing one very long list.

## Business Context
- `/guides` should act as a clean guide catalog, not a mixed section dump.
- Users should browse only actual guide documents, with the guide index map available as a secondary tool at the bottom.
- Pagination keeps the page usable when the guide corpus grows.

## Scope
- Show only documents whose `metadata.docType` is `guide` on `/guides`.
- Exclude intro-style guide pages from the visible list.
- Move the guide index map card to the bottom of the guide page.
- Add pagination for guide lists with many items.

## Out Of Scope
- Changing the article renderer or the separate starting guide route.
- Changing search ranking or Home-page recommendations.
- Modifying non-guide category pages unless needed for shared pagination behavior.

## User Or Operator Scenarios
- A user opens `/guides` and sees only real guide documents.
- A user scrolls the page and finds the guide index map at the bottom.
- A user opens a long guide list and pages through the results.

## Acceptance Criteria
- `/guides` lists only `metadata.docType === "guide"` documents.
- Intro-style pages do not appear in the visible guide list.
- The guide index map card is rendered below the guide list.
- The guide list is paginated when there are more items than fit on one page.

## Edge Cases
- If there are no guide documents after filtering, the page shows the existing empty state.
- If the current page number becomes invalid after filtering changes, the page resets to the first page.

## Assumptions
- Intro pages can be identified by title/slug patterns already used elsewhere in the Home logic.
- A moderate page size is acceptable for guide browsing.

## Clarifications
- Question: Should pagination apply only to guides or to all category pages?
- Answer: Implement it in the shared category page so the behavior is consistent, while the guide-specific docType filtering applies only to `/guides`.
