# Fix Home All Guides Link Plan

## Summary
- Split the guide category list and starting guide article into separate routes.
- Make `GuidesPage` match the other category wrappers by rendering `CategoryPage section="guides"`.
- Move the existing fixed starting guide rendering into a new page component and route it at `/guides/start`.

## Impacted Modules
- `apps/web/src/ui/pages/GuidesPage.tsx`
- `apps/web/src/ui/pages/HomePage.tsx`
- `apps/web/src/router.tsx`
- Task and PRD progress documentation

## Architecture Approach
- Keep category list behavior centralized in `CategoryPage`.
- Keep the starting guide as a route-level page that reads through `useWikiData`, matching the previous data boundary.
- Avoid changing shared wiki-core models or Confluence read behavior.

## Data And API Impact
- No data model, API, or persistence changes.
- No changes to Confluence metadata or source filtering.

## Validation Plan
- Run a targeted web test/typecheck command if available.
- Run workspace typecheck to catch route/component typing issues.
- Record all executed validation commands and outcomes in `test-result.md`.

## Risks
- `/guides/start` could conflict with a real guide slug named `start`; placing the static route before `guides/:slug` avoids router ambiguity.
- Existing external references to `/guides` that expected the starting guide will now see the guide list; this matches category route semantics and the Home "전체 보기" label.

## Rollback Considerations
- Revert the route/component split to restore the previous `/guides` starting guide behavior if product direction changes.
