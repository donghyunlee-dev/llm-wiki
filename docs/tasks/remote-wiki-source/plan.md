# remote-wiki-source Plan

## Summary
- Harden `packages/wiki-core` remote payload loading.
- Add explicit payload validation and visibility/space filtering before normalization.
- Update the web provider to use the new endpoint env name and generic UI error messages.

## Impacted Modules
- `packages/wiki-core/src/lib/wikiDataSource.ts`
- `packages/wiki-core/src/lib/wikiDataSource.test.ts`
- `apps/web/src/data/WikiDataProvider.tsx`
- `apps/web/src/vite-env.d.ts`
- `docs/prd/implementation-status.md`

## Architecture Approach
- Keep source validation in `wiki-core`, not UI components.
- Keep UI pages reading the same `WikiDocument[]` context.
- Preserve local snapshot mode as the default.

## Data And API Impact
- Remote endpoint contract:
  - Either `RemoteWikiPageRecord[]` or `{ pages: RemoteWikiPageRecord[] }`
  - Each record contains `category`, `slug`, and a `page` matching `RawConfluencePage`
  - `page.spaceId` must equal `63111172`
  - Only `page.status=current` and `page.metadata.visibility=public` records are used

## Validation Plan
- Run `pnpm test`.
- Run `pnpm typecheck`.
- Run `pnpm build`.

## Risks
- If a future endpoint returns a different shape, it will fail fast until mapped to this contract.
- Browser fetch still requires CORS to be allowed by the endpoint.

## Rollback Considerations
- Revert `wikiDataSource` and provider changes to return to the previous permissive remote loader.
