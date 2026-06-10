# Browser Sidebar Extension MVP Plan

## Summary
- Add `apps/edge-sidebar` as an isolated Vite React package that emits a Manifest V3 extension bundle.
- Keep the side panel self-contained and communicate with the wiki through the existing HTTP API and search route.

## Impacted Modules
- `apps/edge-sidebar`: new extension app, manifest, side panel UI, background worker, tests, documentation.
- `package.json`: add a convenience script for building the extension.
- `docs/prd/implementation-status.md`: record the new extension MVP work.

## Architecture Approach
- Use the existing monorepo workspace pattern under `apps/*`.
- Use a background service worker only to configure toolbar-click side panel behavior.
- Keep browser API types local to the extension package to avoid introducing global project coupling.
- Keep URL construction and response normalization in small testable utilities.
- Keep guide navigation inside the side panel with a slide transition so users can return to search without opening a new tab.
- Resolve selected guide links against `/api/wiki-pages` and render sanitized `contentHtml` in the extension so the full wiki header/nav is not embedded.

## Data And API Impact
- The extension reads from the existing wiki endpoint:
  - `POST /api/wiki/ai/search`
  - fallback link: `/search?q=...`
- The MVP manifest grants host permission only for `http://localhost:5173/*`.
- No wiki database, Confluence access, or server code changes are introduced.

## Validation Plan
- Run extension unit tests.
- Run extension typecheck.
- Run extension build and inspect the generated `dist/manifest.json`.
- Run workspace typecheck to confirm the new package is compatible with the monorepo.
- Browser load-unpacked verification is documented as manual because it requires a GUI browser session.

## Risks
- Extension host permissions must be updated before testing against a non-local internal wiki domain.
- Existing wiki API response shape may evolve, so the extension should tolerate unknown fields.
- Browser side panel support depends on modern Chrome/Edge versions.

## Rollback Considerations
- Remove `apps/edge-sidebar`, the root extension build script, and this task workspace.
- No existing wiki runtime files need rollback.
