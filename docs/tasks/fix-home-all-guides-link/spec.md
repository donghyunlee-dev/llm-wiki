# Fix Home All Guides Link Spec

## Problem Statement
- On the Home screen, the guides tab "전체 보기" action opens `/guides`.
- The `/guides` route currently renders the fixed starting guide document instead of the full guide list.

## Business Context
- Users expect "전체 보기" to show all guide documents for browsing, filtering, and sorting.
- Showing only the starting guide makes the Home tab action misleading and blocks guide discovery.

## Scope
- Restore `/guides` as the full guide list page.
- Keep the starting guide reachable from the Home starting guide card through a dedicated route.
- Keep existing article detail routes under `/guides/:slug` working.

## Out Of Scope
- Changing guide ranking, search behavior, or Confluence metadata.
- Redesigning the Home page or guide article renderer.
- Changing FAQ, library, or project page behavior.

## User Or Operator Scenarios
- A user opens Home, selects the guides tab, and clicks "전체 보기"; the full guide list appears.
- A user clicks the Home starting guide card; the starting guide article appears.

## Acceptance Criteria
- `/guides` renders the guide category list with list search, filters, sort controls, and guide document rows.
- The Home guides tab "전체 보기" continues to link to `/guides`.
- The Home starting guide card links to a dedicated starting guide route.
- The dedicated starting guide route renders the current starting guide content when document `63668231` is available.

## Edge Cases
- If the starting guide document is missing, the dedicated starting guide route shows the existing missing-state message.
- If guide documents are still loading or fail to load, route-level loading and error states remain visible.

## Assumptions
- The fixed starting guide document ID remains `63668231`.
- `/guides/:slug` remains reserved for normal guide article detail pages.

## Clarifications
- Question: Should "전체 보기" point to a new path instead of changing `/guides`?
- Answer: No. Existing category routes for FAQ and library use their root paths, so `/guides` should also mean the full category list.
