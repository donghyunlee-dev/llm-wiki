# Home Search Center Guide Emphasis Plan

## Summary
- Increase the vertical breathing room around the Home hero so search feels more central.
- Tighten the spacing around the recommended guide section.
- Give the pinned starting guide a distinct visual treatment and add icons to all guide rows.
- Restore search as the dominant Home action by widening hero spacing while keeping the input narrower than the secondary blocks.
- Improve the recommendation header and narrow the guide row list inside the recommendation card.
- Convert the recommendation list into one pinned feature card plus an even-count card grid.

## Impacted Modules
- `apps/web/src/ui/pages/HomePage.tsx`
- `apps/web/src/styles.css`
- `apps/web/src/ui/pages/HomePage.test.tsx`
- Task and PRD documentation

## Architecture Approach
- Keep the changes local to the Home page component and shared home styles.
- Reuse the current guide list data model and just alter the presentation.
- Use separate frame classes for primary search width, secondary section width, and compact guide-list width instead of overloading one shared frame.
- Keep the pinned starting guide separate, then render four non-pinned guide cards in a two-column grid on desktop and one column on mobile.

## Data And API Impact
- No API or persistence changes.

## Validation Plan
- Add or update a Home render test for the visual hierarchy and guide row structure.
- Measure Home block widths and gaps with Playwright on desktop and smaller viewports.
- Run web typecheck.
- Run web tests.
- Run workspace typecheck.

## Risks
- Over-emphasizing the starting guide could make the list feel noisy if the style is too heavy.
- Vertical spacing changes can cause mobile crowding if not constrained carefully.

## Rollback Considerations
- Revert the spacing and row styling changes if the Home screen loses balance.
