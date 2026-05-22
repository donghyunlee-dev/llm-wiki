# guide-index-graph-view Tasks

## Implementation Tasks
- [x] Define the guide graph grouping helper or page-local grouping logic.
- [x] Add a dedicated guide index graph route and page component.
- [x] Render index-rooted sections with child, prerequisite, next, and related document groups.
- [x] Add navigation entry points for the new page.
- [x] Make sure the view degrades safely when data is missing or empty.

## Test Tasks
- [x] Add unit tests for graph grouping and index detection reuse.
- [x] Add UI tests for empty state and reference rendering.
- [x] Run targeted tests for the new page and the relevant workspace typecheck.

## Documentation Tasks
- [x] Update `docs/prd/product-prd.md`, `docs/prd/development-plan.md`, and `docs/prd/implementation-status.md` after implementation lands.
- [ ] If the page changes search or guide contracts, update `docs/prd/search-flow-contract.md` first.

## Progress Notes
- Task workspace created after confirming the existing wiki corpus already contains index and graph metadata needed for the view.
- Implemented the guide index graph page using cached guide documents and existing graph metadata.

## Review Notes
- Keep the implementation page-like and readable; do not overbuild a full canvas graph in the first pass.
