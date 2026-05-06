# home-header-refinement Plan

## Summary
- Convert the shared site header from a panel-like section into a slimmer in-flow header.
- Remove non-actionable duplicate header text and reduce visual weight around the theme controls.
- Normalize Home CTA typography to the shared section title scale.

## Impacted Modules
- `apps/web/src/ui/SiteHeader.tsx`
- `apps/web/src/ui/pages/HomePage.tsx`
- `apps/web/src/styles.css`
- `docs/prd/implementation-status.md`

## Architecture Approach
- Keep the change in presentational UI components only.
- Preserve routing, content constants, theme state, and wiki data source boundaries.

## Data And API Impact
- No data model, API, persistence, or route contract changes.

## Validation Plan
- Run `pnpm typecheck`.
- Run `pnpm build`.
- Render Home locally and inspect the first viewport.

## Risks
- Header compaction could make mobile wrapping cramped if controls are not allowed to wrap.
- Removing helper text could reduce context if the brand line becomes too sparse.

## Rollback Considerations
- Revert the touched UI files and remove this task entry if the compact header direction is rejected.
