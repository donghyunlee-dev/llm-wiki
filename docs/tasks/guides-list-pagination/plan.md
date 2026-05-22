# Guides List Pagination Plan

## Summary
- Keep `CategoryPage` as the shared category browser, but add a guide-specific filter path for `/guides`.
- Filter guide documents down to `metadata.docType === "guide"` and skip intro-style pages.
- Move the guide index map card below the document list.
- Add simple client-side pagination with a fixed page size.

## Impacted Modules
- `apps/web/src/ui/pages/CategoryPage.tsx`
- `apps/web/src/ui/pages/GuidesPage.tsx`
- `apps/web/src/ui/pages/GuideIndexGraphPage.tsx`
- `apps/web/src/styles.css`
- Related task and PRD documentation

## Architecture Approach
- Keep filtering and pagination in the page component so the shared document model stays unchanged.
- Preserve the existing list item and filter controls, but constrain the guide section to actual guide documents.
- Use client-side pagination because the page is already rendering a client-side loaded document list.

## Data And API Impact
- No API or persistence changes.
- No changes to `WikiDocument` or Confluence data contracts.

## Validation Plan
- Add or update a web render test for `/guides` to verify intro pages are excluded and pagination is present.
- Run web typecheck.
- Run web tests.
- Run workspace typecheck.

## Risks
- If the intro identification rule is too broad, a valid guide could be hidden.
- Pagination can make filter combinations harder to reason about unless the page resets cleanly when filters change.

## Rollback Considerations
- Remove the guide-specific filter and pagination logic from `CategoryPage` if the new behavior causes regressions.
