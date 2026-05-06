# serverless-wiki-pages-endpoint Plan

## Summary
- Create `packages/serverless`.
- Add a Lambda-compatible `wikiPagesHandler`.
- Keep it as a thin adapter around `fetchConfluencePageRecords`.

## Impacted Modules
- `packages/serverless/*`
- `package.json`
- `README.md`
- `docs/prd/implementation-status.md`

## Architecture Approach
- Keep Confluence fetch and mapping in `wiki-core`.
- Keep HTTP/Lambda concerns in `packages/serverless`.
- Do not expose Atlassian tokens through Vite/browser env.

## Data And API Impact
- Adds serverless handler for:
  - `GET /api/wiki-pages`
  - response: `{ "pages": RemoteWikiPageRecord[] }`

## Validation Plan
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`

## Risks
- Actual AWS packaging still needs deployment configuration.
- CORS origin may need tightening before production.

## Rollback Considerations
- Remove `packages/serverless` and continue using only the local Vite dev endpoint.
