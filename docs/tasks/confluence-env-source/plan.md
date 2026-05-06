# confluence-env-source Plan

## Summary
- Add a `wiki-core` Confluence client that fetches pages and page metadata from Confluence Cloud REST API v2.
- Add a Vite dev middleware endpoint at `/api/wiki-pages`.
- Let the web app automatically use that endpoint in development when the provided Confluence env values exist.

## Impacted Modules
- `packages/wiki-core/src/lib/confluenceClient.ts`
- `packages/wiki-core/src/lib/confluenceClient.test.ts`
- `packages/wiki-core/src/index.ts`
- `apps/web/vite.config.ts`
- `apps/web/src/data/WikiDataProvider.tsx`
- `apps/web/src/vite-env.d.ts`
- `README.md`
- PRD/task docs

## Architecture Approach
- Confluence API access is server-side only in the Vite dev server.
- The browser still consumes the existing remote JSON contract.
- The same remote validation and normalization path remains the app boundary.

## Data And API Impact
- Adds local dev endpoint:
  - `GET /api/wiki-pages`
  - Response: `{ "pages": RemoteWikiPageRecord[] }`

## Validation Plan
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- Optionally run `pnpm dev` with real `.env.local` and inspect `/api/wiki-pages`

## Risks
- Confluence API response shape differences may require adapter updates.
- Local dev endpoint does not replace the later production serverless endpoint.

## Rollback Considerations
- Remove the Vite middleware and Confluence client, leaving the previous remote JSON endpoint mode intact.
