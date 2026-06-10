# guides-page-header-home-icon Result

## Delivered Scope
- Removed the bracket styling from the guides page title so it now renders as `추천 가이드`.
- Replaced the left-aligned text home link with a right-aligned icon-only home affordance.
- Kept the navigation target on `/` and preserved accessibility via `aria-label` and `title`.
- Removed the extra outer search wrapper on `/guides` so the search area no longer renders a double border.
- Switched the shared prompt button styling to theme-aware colors so it remains visible in dark mode.

## Validation
- `pnpm --filter @sfood/web test`
- `pnpm --filter @sfood/web typecheck`

## Notes
- The change is scoped to the guides page header only.
