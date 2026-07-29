# edge-sidebar-production-wiring Plan

## Impacted Areas
- `packages/wiki-core/src/lib/wikiDocumentsService.ts` (new) + `src/index.ts`
- `apps/web/vite.config.ts` (refactored to a thin adapter, same pattern as the earlier AI ask/search extraction)
- `packages/serverless/src/wikiDocumentsHandler.ts` (new) + test + entrypoint
- `packages/serverless/package.json` (build script)
- `.github/workflows/deploy.yml` (4th Lambda code-update step)
- `docs/tasks/aws-static-site-and-ai-api-deployment/aws-setup-guide.md`
- `apps/edge-sidebar/src/vite-env.d.ts` (new), `sidepanel/wikiClient.ts`, `contentScript.ts`, `README.md`

## Technical Approach
Same extraction pattern as the earlier AI ask/search work: pull the transform logic (`buildCleanWikiDocumentsList`) out of `vite.config.ts` into `packages/wiki-core`, keep `vite.config.ts`'s own dev-only wiki cache untouched (still its own concern), and build a new Lambda handler that independently fetches+builds the document list (matching `wikiPagesHandler.ts`'s no-cache-per-invocation style, not `aiOrchestration.ts`'s warm-cache style — this endpoint has no per-request cost sensitivity like the AI calls do).

`apps/edge-sidebar`'s `wikiClient.ts` gets the same `import.meta.env.VITE_*_ENDPOINT` override pattern already used in `apps/web` — if set at build time, use the absolute Lambda Function URL; otherwise fall back to the dev-only relative path (`{baseUrl}/api/...`), preserving the existing local-dev-against-`pnpm dev`-server workflow described in the README.

`DEFAULT_WIKI_BASE_URL`/`DEFAULT_BASE_URL` changed from `http://localhost:5173` to the real deployed domain (`https://ax-wiki.s-food.ai`), since the extension's default "Wiki URL" is meant to be the real site once installed, not a developer's local server.

## Validation Plan
- `pnpm -r typecheck`/`test`/`build` (including `packages/serverless` producing 4 bundles).
- Manual regression check: dev server's `/api/wiki/documents` still works after the `vite.config.ts` refactor.
- Live verification: deploy the new Lambda, confirm it returns the same clean document shape as the dev endpoint.
- Build the extension with the real endpoints and confirm they're correctly embedded in the output bundle.

## Risks
- None significant — this mirrors an already-proven extraction pattern from the AI ask/search work, and the new Lambda has no state/caching complexity to get wrong.
