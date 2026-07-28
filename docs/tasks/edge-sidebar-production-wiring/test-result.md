# edge-sidebar-production-wiring Test Result

## Automated
| Command | Result |
|---|---|
| `pnpm -r typecheck` | ✅ Pass |
| `pnpm -r test` | ✅ Pass — 320 tests (serverless 21, +5 new for `wikiDocumentsHandler`) |
| `pnpm --filter @sfood/web build` | ✅ Pass |
| `pnpm --filter @sfood/serverless build` | ✅ Pass — 4 bundles (`wiki-pages.mjs`, `ai-ask.mjs`, `ai-search.mjs`, `wiki-documents.mjs`) |
| `pnpm --filter @sfood/edge-sidebar typecheck`/`test` | ✅ Pass (21 tests, unchanged) |

## Manual Regression (local dev server)
`curl http://localhost:5183/api/wiki/documents` after the `vite.config.ts` refactor — still returns the same clean document shape (`contentHtml`, `related`, etc.) as before, confirming the extraction didn't change dev behavior.

## Live Verification (deployed Lambda)
User created `sfood-ax-wiki-documents` via console. This session:
- Deployed code (`index.mjs`-renamed zip, matching the other 3 functions' handler convention).
- Copied Confluence env vars from `sfood-ax-wiki-pages` (values not printed, only key names verified) + set `WIKI_ALLOWED_ORIGIN=*` (browser extension origin, not the web app's origin).
- Set timeout 30s / memory 256MB.
- Enabled Function URL with both required permission statements (`lambda:InvokeFunctionUrl` + `lambda:InvokeFunction` with `InvokedViaFunctionUrl` condition) applied from the start — worked on the first live request, no 403 troubleshooting needed this time.
- `curl` verification: 200 OK, real document list including `contentHtml`/`related` fields.

## Extension Build Verification
```bash
VITE_AI_SEARCH_ENDPOINT="<ai-search URL>" VITE_WIKI_DOCUMENTS_ENDPOINT="<wiki-documents URL>" pnpm --filter @sfood/edge-sidebar build
```
Confirmed via `grep` on the built `dist/assets/sidepanel.js`: both Lambda Function URLs are present in the bundle, and the default wiki base URL (`https://ax-wiki.s-food.ai`) appears in both `sidepanel.js` and `content-script.js`.
