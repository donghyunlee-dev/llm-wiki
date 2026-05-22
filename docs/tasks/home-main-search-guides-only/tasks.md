# Home Main Search Guides Only Tasks

## Implementation Tasks
- [x] Capture the Home layout request in a task spec and plan.
- [x] Rework the Home page to show only search and recommended guides.
- [x] Pin the starting guide to the top of the guide list.
- [x] Show five additional recommended guides after the starting guide.
- [x] Fix the starting guide link to use a real guide route.
- [x] Restore the blueprint CTA below the guide section.
- [x] Move the `사내 지식 위키` label into the centered site header.
- [x] Align the blueprint and recommended guide widths.

## Test Tasks
- [x] Run web typecheck.
- [x] Run web tests.
- [x] Run workspace typecheck.
- [x] Add focused render tests for the Home page and header label.

## Documentation Tasks
- [x] Update Home-related PRD docs to match the new compact layout.
- [x] Record validation results.
- [x] Record the final outcome.

## Progress Notes
- 2026-05-19: The Home page still renders projects, FAQ, library, and project design. The search help text and search examples also need to be repositioned.
- 2026-05-19: Home now shows the search block first and the recommended guide list second, with the starting guide pinned to the top and linked through the dedicated start route.
- 2026-05-19: The blueprint CTA is back and the `사내 지식 위키` label now lives in the centered site header.
- 2026-05-19: The blueprint CTA and recommended guide card now share the same max width on Home.
- 2026-05-19: Home now shows the starting guide plus five more recommended guides.

## Review Notes
- Keep the change scoped to the Home surface and the matching docs.
