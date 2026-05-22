# Search Guide-Led Page Flow Spec

## Scope
- Change search results from evidence-heavy chat output into a guide-led wiki flow.
- Promote the single best matching guide page as the main destination for the answer.
- Keep secondary pages separate as related references rather than blending them into the main answer.
- Improve article page reading by rendering code and callout blocks more clearly and by adding bottom related-page navigation.

## Problem
- Search results were exposing evidence-oriented structures too directly for the user-facing flow.
- The main answer and supporting pages were mixed together, so users could not tell which page to open first.
- Article pages lacked a clear bottom handoff to prerequisite and next pages.

## Acceptance Criteria
- Search results show one representative guide section with an explicit “open guide page” action.
- Search results no longer show evidence quotes in the user-facing answer flow.
- The representative guide page appears under `추천 페이지` and secondary pages appear under `관련 페이지`.
- Both sections render as two-column page-entry grids without summaries.
- Opening the linked article page shows Confluence-derived content with improved code and callout presentation.
- Article pages show bottom page-link sections derived from document graph metadata.
- `pnpm --filter @sfood/web typecheck`, targeted web tests, and workspace `pnpm typecheck` pass.
