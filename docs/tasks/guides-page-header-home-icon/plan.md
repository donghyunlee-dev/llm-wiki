# guides-page-header-home-icon Plan

## Summary
- Update `CategoryPage` to render a header row with the title on the left and a home icon link on the right.
- Add a small CSS helper for the icon-only link so the style is stable and reusable if needed later.

## Impacted Modules
- `apps/web/src/ui/pages/CategoryPage.tsx`
- `apps/web/src/styles.css`
- `apps/web/src/ui/pages/CategoryPage.test.tsx`

## Architecture Approach
- Keep the change local to the guides list route.
- Preserve the existing `/` navigation target and avoid changing other page shells.

## Data And API Impact
- No data or API impact.

## Validation Plan
- Run the category page unit test.
- Run TypeScript typecheck if needed for the edited surface.

## Risks
- The icon button could look visually too small if the spacing is not tuned.
- A header row change could affect mobile wrapping if the flex layout is too tight.

## Rollback Considerations
- Revert the `CategoryPage` header row and CSS helper if the layout regresses.

