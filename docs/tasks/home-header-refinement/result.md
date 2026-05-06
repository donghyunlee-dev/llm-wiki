# home-header-refinement Result

## Delivered Scope
- Converted the shared site header from a rounded panel-like top section into a compact in-flow header.
- Removed non-actionable header text and controls that duplicated the Home page context.
- Reduced Home card and CTA typography so the search-led hero remains the visual priority.

## Changed Files
- `apps/web/src/ui/SiteHeader.tsx`
- `apps/web/src/ui/pages/HomePage.tsx`
- `apps/web/src/styles.css`
- `docs/tasks/home-header-refinement/*`
- `docs/prd/implementation-status.md`

## Key Decisions
- Search placement was left unchanged as requested.
- The disabled environment settings control was removed instead of visually preserving a non-working action.
- The user/environment block was removed from the header because it made the header read like a top content section.

## Open Gaps
- Existing favicon 404 remains outside this task.
- Article detail still has a separate user-facing `Confluence page` label that should be handled in a later policy-copy cleanup.

## Next Steps
- Continue the current Phase 2 target: connect the remote wiki source to a real read-only endpoint without changing route/page contracts.
