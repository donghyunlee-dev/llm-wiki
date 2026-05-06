# home-prototype-alignment Plan

## Summary
- Move the shared app layout toward the prototype shell/surface structure.
- Update `SiteHeader` to prototype density and simplify it to brand plus theme control.
- Rebuild Home sections with prototype-like reusable CSS classes.

## Impacted Modules
- `apps/web/src/ui/AppLayout.tsx`
- `apps/web/src/ui/SiteHeader.tsx`
- `apps/web/src/ui/pages/HomePage.tsx`
- `apps/web/src/styles.css`
- `docs/prd/implementation-status.md`

## Architecture Approach
- Keep presentational changes in UI components and CSS only.
- Keep content in `@sfood/wiki-core` and route behavior in React Router.
- Use CSS component classes for surface, section, card, list row, search box, and CTA primitives.

## Data And API Impact
- No data, API, persistence, or source contract changes.

## Validation Plan
- Run `pnpm typecheck`.
- Run `pnpm test`.
- Run `pnpm build`.
- Render Home locally and inspect it against the prototype structure.

## Risks
- Removing GNB links from the header reduces global navigation density, but Home still provides the four prototype entry routes.
- Applying the shared surface at the layout level can visually affect internal pages; keep classes conservative and reusable.

## Rollback Considerations
- Revert the UI and CSS files if prototype alignment is rejected.
