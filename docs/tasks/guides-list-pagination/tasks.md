# Guides List Pagination Tasks

## Implementation Tasks
- [x] Capture the guide list and pagination request in a task spec and plan.
- [x] Filter `/guides` down to `metadata.docType === "guide"` documents only.
- [x] Exclude intro-style pages from the guide list.
- [x] Move the guide index map card to the bottom of the page.
- [x] Add pagination for longer guide lists.
- [x] Rename the page title to `추천 가이드`.
- [x] Simplify the toolbar to a single integrated search input.
- [x] Hide the guide index map view button.

## Test Tasks
- [x] Add or update a render test for the guide list page.
- [x] Run web typecheck.
- [x] Run web tests.
- [x] Run workspace typecheck.

## Documentation Tasks
- [x] Update PRD docs if the guide list behavior changes materially.
- [x] Record validation results.
- [x] Record the final outcome.

## Progress Notes
- 2026-05-19: `/guides` currently mixes guide-like section documents and places the guide index map above the list.
- 2026-05-19: `/guides` now filters to guide documents only, excludes intro pages, paginates long results, and moves the guide index map to the bottom.

## Review Notes
- Keep the fix local to the guide browsing surface and shared category page logic.
