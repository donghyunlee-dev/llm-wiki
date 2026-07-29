# edge-sidebar-production-wiring Result

## Delivered Scope
`apps/edge-sidebar` (the browser side-panel extension) now works against the real deployed wiki instead of only `localhost:5173`. Along the way, discovered and fixed a real gap: the extension called `/api/wiki/documents`, which had no Lambda equivalent (the earlier AWS deployment task had concluded this endpoint was unused, based only on checking `apps/web` — it never checked `apps/edge-sidebar`).

1. Extracted the `/api/wiki/documents` transform logic into `packages/wiki-core` (`buildCleanWikiDocumentsList`), refactored `vite.config.ts` to a thin adapter (same pattern as the earlier AI ask/search extraction).
2. Added a 4th Lambda handler (`wikiDocumentsHandler`), build entrypoint, and deploy workflow step.
3. User created `sfood-ax-wiki-documents` via console; this session deployed code, environment variables (Confluence credentials copied from the existing `wiki-pages` function), Function URL, and registered the GitHub secret.
4. Updated `apps/edge-sidebar`'s `wikiClient.ts` to call the real Lambda Function URLs (`VITE_AI_SEARCH_ENDPOINT`/`VITE_WIKI_DOCUMENTS_ENDPOINT`, injected at build time) instead of dev-only relative `/api/...` paths, falling back to the relative paths when unset (preserves the local-dev-against-`pnpm dev` workflow).
5. Changed the default Wiki URL from `localhost:5173` to the real deployed domain (`https://ax-wiki.s-food.ai`).
6. Built the extension with the real endpoints and confirmed they're correctly embedded in the output.

## Changed Files
- `packages/wiki-core/src/lib/wikiDocumentsService.ts` (new), `src/index.ts`
- `apps/web/vite.config.ts`
- `packages/serverless/src/wikiDocumentsHandler.ts` (new) + test + entrypoint, `package.json`
- `.github/workflows/deploy.yml`
- `docs/tasks/aws-static-site-and-ai-api-deployment/aws-setup-guide.md`
- `apps/edge-sidebar/src/vite-env.d.ts` (new), `sidepanel/wikiClient.ts`, `contentScript.ts`, `README.md`
- `docs/tasks/edge-sidebar-production-wiring/` (new)

## Key Decisions
- Applied the same permission-statement fix learned earlier this session (both `lambda:InvokeFunctionUrl` and `lambda:InvokeFunction`+`InvokedViaFunctionUrl`) from the start for the new Lambda — worked immediately with no 403 troubleshooting needed.
- Reused the existing Confluence credentials from `sfood-ax-wiki-pages` via CLI (values never printed to the conversation) rather than asking the user to re-enter them.
- `WIKI_ALLOWED_ORIGIN=*` specifically for this function (unlike the web app's functions, which are scoped to `https://ax-wiki.s-food.ai`) — a browser extension's fetch requests originate from `chrome-extension://...`, not the wiki's own origin.

## Gaps / Follow-ups
- CI does not build or package the extension (matches the existing manual "Load unpacked" distribution model) — building with the real endpoints is a manual step, documented in the README.
- No automated test covers the actual embedded-endpoint-in-bundle behavior (verified manually via `grep` this session) — acceptable given this mirrors the same manual verification approach already used for `apps/web`'s equivalent env-var injection.

## Validation
See `test-result.md`: `pnpm -r typecheck`/`test` pass (320 tests), `packages/serverless` build produces 4 bundles, the new Lambda was deployed and verified live, and the extension build was confirmed to embed the real endpoints correctly.
