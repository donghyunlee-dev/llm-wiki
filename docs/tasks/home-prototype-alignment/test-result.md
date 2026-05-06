# home-prototype-alignment Test Result

## Scope
- Validate Home prototype alignment, shared CSS commonization, and preserved route/search behavior.

## Environment
- Local development workspace
- No database
- Snapshot wiki source only

## Commands
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- Playwright navigation and screenshot for `http://localhost:5174/`

## Results
- PASS: `pnpm typecheck`
- PASS: `pnpm test`
- PASS: `pnpm build`
- PASS: Home render inspection matched the prototype structure and confirmed CTA label visibility after correction.

## Failure Notes
- Initial build failed because the new `card-hover-bg` color token was not exposed through Tailwind's `@theme inline` block. Added `--color-card-hover-bg`.
- Initial render showed the CTA button label was not visible. Added an explicit button label span and foreground token handling.
- Existing `/favicon.ico` 404 remains outside this task scope.

## Retest Results
- PASS: Retried `pnpm build` after CSS token fix.
- PASS: Retried Home render inspection after CTA label fix.

## Acceptance Criteria Coverage
- AC1: Covered by `site-shell` and `site-surface` layout classes.
- AC2: Covered by simplified `SiteHeader` with brand and theme control.
- AC3: Covered by Home CSS component classes for sections, cards, lists, search, and CTA.
- AC4: Covered by retaining existing route links and search form navigation.
- AC5: Covered by preserving theme tokens and `ThemeProvider` behavior.
