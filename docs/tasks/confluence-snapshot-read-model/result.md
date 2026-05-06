# confluence-snapshot-read-model Result

## Delivered Scope
- Added Confluence-shaped raw snapshot fixtures for all current public categories.
- Switched shared wiki documents to be derived through the normalization pipeline.
- Exposed source snapshot links from article pages.
- Kept existing route contracts stable while moving data closer to the final Confluence model.

## Changed Files
- `packages/wiki-core/src/lib/confluenceSnapshots.ts`
- `packages/wiki-core/src/lib/confluenceSnapshots.test.ts`
- `packages/wiki-core/src/lib/wikiDocuments.ts`
- `packages/wiki-core/src/index.ts`
- `apps/web/src/ui/pages/ArticlePage.tsx`
- `docs/tasks/confluence-snapshot-read-model/*`

## Key Decisions
- Treat local snapshots as a bridge to live Confluence fetches.
- Keep the article/category/search rendering contract stable while changing only the underlying source path.

## Open Gaps
- Live Confluence fetch wiring is not connected yet.
- Space-guarded upstream loading and metadata filtering are still pending.

## Next Steps
- Add a real Confluence read-only loader in shared modules.
- Replace local snapshot arrays with upstream fetch results behind the same normalization contract.
