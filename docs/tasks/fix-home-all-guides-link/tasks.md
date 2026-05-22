# Fix Home All Guides Link Tasks

## Implementation Tasks
- [x] Identify why Home "전체 보기" opens the starting guide.
- [x] Restore `/guides` to the full guide category list.
- [x] Add a dedicated starting guide route and update the Home starting guide card.

## Test Tasks
- [x] Run TypeScript validation.
- [x] Run relevant automated tests where practical.

## Documentation Tasks
- [x] Create task spec and plan before implementation.
- [x] Record validation results.
- [x] Record final task outcome.
- [x] Update PRD progress ledger.

## Progress Notes
- 2026-05-19: Root cause found: `TAB_CONFIG.guides.categoryHref` points to `/guides`, while the `/guides` route renders `GuidesPage`, which currently hardcodes the starting guide document.
- 2026-05-19: `GuidesPage` now renders `CategoryPage section="guides"`, and the fixed starting guide moved to `StartingGuidePage` at `/guides/start`.

## Review Notes
- Keep the fix limited to routing/page composition. Do not alter guide content selection or search ranking.
