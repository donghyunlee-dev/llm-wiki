# wiki-mvp-bootstrap Result

## Delivered Scope
- Added a `pnpm` monorepo scaffold.
- Added a React/Vite web app skeleton.
- Added a shared wiki-core package with Home fixture data and validation helpers.
- Implemented the first Home MVP screen and placeholder routes.

## Changed Files
- package/workspace config
- `apps/web/*`
- `packages/wiki-core/*`
- `docs/tasks/wiki-mvp-bootstrap/*`

## Key Decisions
- Start with a frontend-first SPA.
- Keep Lambda out until browser-only execution becomes insufficient.
- Centralize Home content policy in shared modules instead of hard-coding it only in the page.

## Open Gaps
- Confluence integration is not implemented yet.
- Search is route-level placeholder only.
- `apps/web` UI tests are not added yet; current executable checks live in `packages/wiki-core`.

## Next Steps
- Implement Confluence read-only client and normalized article model.
- Add UI rendering tests for the Home screen and route placeholders.
