# home-ui-and-source-foundation Result

## Delivered Scope
- Realigned the Home screen to a prototype-style compact header and section layout.
- Removed the user-facing policy-check block from the Home screen.
- Reduced the UI to a shared three-level type scale and consistent section spacing rhythm.
- Added a shared async wiki data source provider with `snapshot` and `remote` modes.
- Moved category, article, and search pages to the shared source boundary.
- Changed search results into direct navigation links to matched documents.
- Reworked search results into grouped sections instead of a flat list.
- Corrected Home lower-panel link interactions and CTA button contrast.
- Added article relation panels based on prerequisite, next, and related metadata.
- Promoted the top area into a shared site-wide GNB.
- Improved category list cards with order and metadata cues.
- Reworked the shared GNB into a normal site-style header and removed the mistaken fixed-bar layout.
- Updated PRD progress docs so the next session can continue from the remote-source wiring step.

## Changed Files
- `apps/web/src/ui/pages/HomePage.tsx`
- `apps/web/src/styles.css`
- `apps/web/src/data/WikiDataProvider.tsx`
- `apps/web/src/ui/SiteHeader.tsx`
- `apps/web/src/ui/AppLayout.tsx`
- `apps/web/src/ui/pages/CategoryPage.tsx`
- `apps/web/src/ui/pages/ArticlePage.tsx`
- `apps/web/src/ui/pages/SearchPage.tsx`
- `apps/web/src/ui/pages/ArticlePage.tsx`
- `apps/web/src/ui/pages/StaticPageShell.tsx`
- `apps/web/src/ui/pages/WikiStatePanel.tsx`
- `packages/wiki-core/src/lib/wikiDocuments.ts`
- `packages/wiki-core/src/lib/wikiDataSource.ts`
- `packages/wiki-core/src/lib/wikiDataSource.test.ts`
- `packages/wiki-core/src/lib/confluenceSnapshots.ts`
- `docs/prd/*`

## Open Gaps
- The `remote` mode contract exists, but a real Confluence public endpoint is not connected yet.
- Metadata graph and AI flows are still pending.
- Live Confluence env values are still not needed at runtime because upstream fetch is not wired.

## Next Steps
- Wire `VITE_CONFLUENCE_PUBLIC_ENDPOINT` to a real read-only upstream response.
- Keep the current Home UI baseline stable while replacing snapshots with remote content.
