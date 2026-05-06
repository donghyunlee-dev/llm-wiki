# local-browsing-ux Spec

## Scope
- Improve local browsing UX for category and search pages with live Confluence data.
- Keep AWS/deployment work out of scope.
- Do not use Playwright snapshots, screenshots, markdown exports, or browser-generated artifacts.

## Acceptance Criteria
- Category pages support in-list query, audience filter, document type filter, and sort.
- Category pages show total and filtered result counts.
- Search results show clear grouped counts and avoid rendering empty groups before useful results.
- Repeated document card UI is shared.
- AI search checks matching index pages first and expands into detailed documents before answer generation.
- Confluence `ops` pages are cached as hidden policy context but never shown in search results or recommendations.
- `pnpm test`, `pnpm typecheck`, and `pnpm build` pass.
