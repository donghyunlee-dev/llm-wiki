# confluence-env-source Result

## Delivered Scope
- Added Confluence Cloud REST v2 read adapter using `ATLASSIAN_SITE_NAME`, `ATLASSIAN_USER_EMAIL`, `ATLASSIAN_API_TOKEN`, and `CONFLUENCE_SPACE_ID`.
- Added Vite dev endpoint `GET /api/wiki-pages` that returns the existing remote payload contract.
- Updated Vite config so local development automatically uses `/api/wiki-pages` when Confluence env is configured, while production build defaults to snapshot unless explicitly configured.
- Added adapter tests for page mapping, metadata property follow-up fetch, and missing metadata omission.
- Verified category, article, and search pages render from live Confluence-backed remote data.
- Added empty body HTML tolerance for valid Confluence index pages.
- Removed user-facing implementation terms from search and article source labels.
- Added a data favicon to avoid local favicon 404.
- Updated README with env-based local Confluence development instructions.

## Changed Files
- `README.md`
- `apps/web/index.html`
- `apps/web/vite.config.ts`
- `apps/web/src/ui/pages/ArticlePage.tsx`
- `apps/web/src/ui/pages/CategoryPage.tsx`
- `apps/web/src/ui/pages/SearchPage.tsx`
- `packages/wiki-core/src/lib/confluenceClient.ts`
- `packages/wiki-core/src/lib/confluenceClient.test.ts`
- `packages/wiki-core/src/lib/wikiDataSource.ts`
- `packages/wiki-core/src/lib/wikiDataSource.test.ts`
- `packages/wiki-core/src/index.ts`
- `docs/tasks/confluence-env-source/*`
- `docs/prd/implementation-status.md`

## Key Decisions
- Atlassian credentials are server-side only and are not exposed through `VITE_` variables.
- Browser code reads same-origin JSON from `/api/wiki-pages`.
- Pages without `wiki.metadata` are omitted rather than guessed as public.
- `docType` maps to app category: `example` to projects, `reference|ops` to library, `troubleshooting` to FAQ, all others to guides.
- Remote documents must be `current`, `public`, `published`, and not `ops` before they become visible.
- Empty body HTML is allowed because Confluence index pages can be valid navigation entries without body content.

## Open Gaps
- Production deployment still needs a Lambda/API Gateway equivalent for the dev endpoint.
- Category pages can become very long with live data; pagination or grouping should be considered next.

## Next Steps
- Add production serverless endpoint equivalent to the Vite dev middleware.
- Improve category/search UX for large live result sets.
