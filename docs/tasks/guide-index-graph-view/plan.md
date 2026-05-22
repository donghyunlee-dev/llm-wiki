# guide-index-graph-view Plan

## Summary
- Add a dedicated guide index graph page that reuses the existing loaded wiki corpus and renders index-rooted document relationships in a page-like map.
- Prefer a readable tree/card layout over a heavy canvas graph so the result stays consistent with the wiki UI and can be reviewed quickly.

## Impacted Modules
- `apps/web/src/router.tsx`
- `apps/web/src/ui/pages/`
- `apps/web/src/ui/AppLayout.tsx`
- `apps/web/src/ui/pages/HomePage.tsx`
- `apps/web/src/ui/pages/GuidesPage.tsx`
- `apps/web/src/ui/pages/CategoryPage.tsx`
- `apps/web/src/ui/pages/ArticlePage.tsx`
- `apps/web/src/ui/pages/WikiStatePanel.tsx`
- `apps/web/src/ui/theme/`
- `packages/wiki-core/src/lib/wikiDocuments.ts`
- `docs/prd/ui-spec.md`
- `docs/prd/search-flow-contract.md`
- `docs/prd/development-plan.md`
- `docs/prd/implementation-status.md`

## Architecture Approach
- Build the page as a thin UI layer on top of the existing `useWikiData()` corpus.
- Derive guide graph groups from loaded documents instead of introducing a new API or persistence layer.
- Reuse existing graph helpers where possible:
  - detect guide index pages with the current index heuristic
  - resolve `parent`, `prerequisites`, `next`, and `related` references from document metadata
  - keep the page read-only and deterministic
- If needed, add a small shared helper in `wiki-core` for “guide index graph groups” so the route and any future review tools can share the same grouping logic.
- Keep the page route simple and make it accessible from the app navigation without changing search behavior.

## Data And API Impact
- No external API changes are required for the MVP of this page.
- The page reads from the existing loaded wiki document set in memory.
- If the current startup cache is already populated, the view should render directly from that cache.
- If the corpus is unavailable, show a safe empty/loading state instead of attempting a separate fetch path.

## Validation Plan
- Add focused unit tests for any new graph grouping helper.
- Add route-level or component-level tests for:
  - index page grouping
  - child and relation sections
  - empty-state rendering
  - missing reference handling
- Run the smallest relevant test set for the new page and then the workspace typecheck.

## Risks
- The page can become too dense if it tries to visualize the entire guide corpus at once.
- Index detection may be too broad if it relies only on title/slug heuristics.
- A graph-style page can look busy unless the layout keeps a clear root > child > related hierarchy.
- If guide documents are not fully populated yet, the view may expose data quality issues that need follow-up cleanup.

## Rollback Considerations
- The page can be removed cleanly by deleting the route and page component if the UX proves too noisy.
- Any shared grouping helper should be kept isolated so it can be reverted without affecting search ranking or AI prompt behavior.
