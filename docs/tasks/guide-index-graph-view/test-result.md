# guide-index-graph-view Test Result

## Scope
- Validation for the new guide index graph view.

## Environment
- Profile: local web app
- Database: none
- External dependencies: none for the page itself

## Commands
- `pnpm --filter @sfood/web test`
- `pnpm typecheck`

## Results
- PASS: web test suite passed
- PASS: workspace typecheck passed
- PASS: graph board renders as a node/link layout and empty state is covered
- PASS: desktop layout now keeps the graph centered and dominant while moving support information below the board

## Failure Notes
- No validation failures remained after the helper and page test adjustments.

## Retest Results
- Reworked the page test to use server rendering instead of jsdom, then reran the test suite successfully.
- Reworked the graph page from card sections into a graph board, then reran the web test suite successfully.
- Reworked the graph support area into a compact dashboard, then verified the layout with Playwright measurements and section-height checks.

## Acceptance Criteria Coverage
- AC1: covered by route and page rendering tests
- AC2: covered by graph grouping helper tests and page rendering tests
- AC3: covered by helper output and page section structure
- AC4: covered by using `useWikiData()` corpus only
- AC5: covered by empty-state page test
- AC6: covered by category-page navigation link and route registration
