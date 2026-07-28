# aws-static-site-and-ai-api-deployment Plan

## Impacted Areas
- `packages/wiki-core` — new shared modules (moved parsing logic + new orchestration functions)
- `apps/web/vite.config.ts` — refactored to call shared functions (dev behavior unchanged)
- `apps/web/src/lib/aiSearchResponse.ts`, `apps/web/src/lib/searchAnswerState.ts` — moved to wiki-core, imports updated at call sites
- `packages/serverless` — 2 new Lambda handlers + build tooling
- `apps/web/src/ui/pages/HomePage.tsx`, navigation component(s) — hide Projects entry
- `.github/workflows/deploy.yml` — new
- `docs/tasks/aws-static-site-and-ai-api-deployment/aws-setup-guide.md` — new

## Technical Approach

### 1. Move pure parsing logic into wiki-core (no behavior change)
`apps/web/src/lib/aiSearchResponse.ts` and `apps/web/src/lib/searchAnswerState.ts` have zero DOM/React dependency — pure functions already. Move both files (and their `*.test.ts`) to `packages/wiki-core/src/lib/`, add `export * from "./lib/aiSearchResponse"` and `export * from "./lib/searchAnswerState"` to `packages/wiki-core/src/index.ts`. Update the two current consumers (`apps/web/src/ui/searchRecommendations.ts`, `apps/web/vite.config.ts`) to import from `@sfood/wiki-core` instead of the relative path. This is required because the Lambda handlers (in `packages/serverless`) cannot import from `apps/web` — only from `@sfood/wiki-core`.

### 2. Extract AI ask/search orchestration into `packages/wiki-core/src/lib/aiOrchestration.ts`
Two exported entry points, each transport-agnostic (no Node `http` types, no Vite-specific `response.end`):

```ts
export type OrchestrationEnv = {
  ATLASSIAN_SITE_NAME?: string;
  ATLASSIAN_USER_EMAIL?: string;
  ATLASSIAN_API_TOKEN?: string;
  CONFLUENCE_SPACE_ID?: string;
  CONFLUENCE_PLAYBOOK_PAGE_ID?: string;
  CONFLUENCE_PROMPT_RULES_PAGE_ID?: string;
  OPENAI_API_KEY?: string;
  VITE_OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  VITE_OPENAI_MODEL?: string;
};

export type OrchestrationResult = { status: number; body: unknown };

export async function handleAiAskRequest(
  env: OrchestrationEnv,
  input: { pageId: unknown; question: unknown; history: unknown },
): Promise<OrchestrationResult>;

export async function handleAiSearchRequest(
  env: OrchestrationEnv,
  input: { question: unknown; persona: unknown; history: unknown },
): Promise<OrchestrationResult>;
```

Everything currently inline in `vite.config.ts` lines 218–528 plus its supporting helpers (`loadVisibleDevWikiCache` → `loadWikiCache`, `loadDevPromptRulesCache` → `loadPromptRulesCache`, `fetchAndBuildWikiCache`, `readAiSearchCache`/`writeAiSearchCache`, `normalizeCacheKey`, `uniqueWikiDocuments`, `parseConversationHistory`, `extractResponseText`, `parseAiSearchResult`, `normalizeAiSearchResponsePayload`, `fetchQueryUnderstanding`, `normalizeUnsupportedClaimsForSearchResult`, `enrichPolicyNoticeSources`, `firePlaybookLog`) moves into this file verbatim (renamed to drop the "Dev" naming since it's no longer dev-only), with module-level cache variables (`wikiCache`, `aiSearchCache`, `promptRulesCache`) kept as module-level `let`/`Map` state — this is intentional and correct for both runtimes: in Vite dev it behaves exactly as today; in Lambda it gives free warm-container caching between invocations (a strict improvement over cold-cache-every-request), and cache correctness never depended on request identity.

Input validation (missing `pageId`/`question`, config-missing checks) moves inside these functions and returns `{status, body}` instead of writing to an HTTP response — this is what makes the function transport-agnostic.

`readJsonBody` (Node-`IncomingMessage`-specific) is **not** moved — it stays in `vite.config.ts` as the Vite-side adapter concern, since body parsing differs between a Vite dev middleware (raw stream) and a Lambda event (`event.body`, possibly base64).

### 3. Refactor `vite.config.ts` into a thin adapter
The `/api/wiki/ai/ask` and `/api/wiki/ai/search` middleware bodies become:
```ts
server.middlewares.use("/api/wiki/ai/ask", async (request, response) => {
  if (request.method !== "POST") { /* 405, unchanged */ }
  const body = await readJsonBody(request);
  const { status, body: resultBody } = await handleAiAskRequest(env, body);
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(resultBody));
});
```
Same pattern for `/api/wiki/ai/search`. The method-check / Content-Type header stay in `vite.config.ts` (transport concerns); everything else moves. No behavior change for local `pnpm dev`.

### 4. New Lambda handlers in `packages/serverless`
- `src/aiAskHandler.ts` — mirrors `wikiPagesHandler.ts`'s shape: `aiAskHandler(event, options)`, POST-only, parses `event.body` (JSON, handling `event.isBase64Encoded`), calls `handleAiAskRequest`, wraps the `{status, body}` result into the Lambda response shape (CORS headers via `WIKI_ALLOWED_ORIGIN`, same as `wikiPagesHandler`).
- `src/aiSearchHandler.ts` — same pattern calling `handleAiSearchRequest`.
- Both get a `*.test.ts` following `wikiPagesHandler.test.ts`'s existing test conventions (missing env → 503, bad method → 405, happy path with a stubbed `fetch`).

### 5. Build tooling for `packages/serverless`
Add three thin entrypoint files under `src/entrypoints/` (`wikiPagesEntry.ts`, `aiAskEntry.ts`, `aiSearchEntry.ts`), each just:
```ts
import { wikiPagesHandler } from "../wikiPagesHandler";
export const handler = wikiPagesHandler;
```
`package.json` gets:
```json
"build": "esbuild src/entrypoints/wikiPagesEntry.ts --bundle --platform=node --target=node22 --format=esm --outfile=dist/wiki-pages.mjs && esbuild src/entrypoints/aiAskEntry.ts --bundle --platform=node --target=node22 --format=esm --outfile=dist/ai-ask.mjs && esbuild src/entrypoints/aiSearchEntry.ts --bundle --platform=node --target=node22 --format=esm --outfile=dist/ai-search.mjs"
```
matching `apps/mcp-server`'s single-command esbuild pattern (add `esbuild` devDependency, same version already pinned in the workspace).

### 6. Hide Projects/GitHub UI entry points
Grep-confirmed entry points to remove: the home-page card/link to `/projects` (in `HomePage.tsx`) and any nav link to `/projects` (need to locate the nav component — likely `AppLayout`/`CardLayout` or a shared header). Router entries for `/projects` and `/projects/:slug` stay (out-of-scope decision: no route deletion), simply unlinked from all navigation surfaces.

### 7. GitHub Actions workflow
Single workflow `.github/workflows/deploy.yml`, triggered on push to `main`:
- Job `deploy-web`: checkout → pnpm setup/install → `pnpm --filter @sfood/web build` with `VITE_WIKI_DATA_SOURCE=remote` and `VITE_WIKI_REMOTE_ENDPOINT` env vars set → configure AWS credentials (`aws-actions/configure-aws-credentials` with static keys) → `aws s3 sync apps/web/dist s3://$BUCKET --delete` → `aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"`.
- Job `deploy-serverless`: checkout → pnpm setup/install → `pnpm --filter @sfood/serverless build` → three `aws lambda update-function-code` calls (one per handler, function names from secrets/vars) → depends on `deploy-web` only in the sense of running in the same workflow (can run in parallel — independent jobs).

All bucket/distribution/function names and AWS keys come from `${{ secrets.* }}` — nothing hardcoded in the YAML.

### 8. One-time AWS setup guide
New `docs/tasks/aws-static-site-and-ai-api-deployment/aws-setup-guide.md`, following `docs/tasks/wiki-mcp-server/aws-deployment-guide.md`'s structure: for each of the 3 Lambda functions — initial `aws lambda create-function` (Node.js 22.x, arm64, 256MB/30s, handler `index.handler`) using a first manually-built zip, environment variables via `update-function-configuration`, Function URL creation (`auth-type NONE`) + `add-permission` for public invoke, curl-based smoke test. Also documents that the S3 bucket + CloudFront distribution already exist and only need their IDs recorded into GitHub Secrets — no creation steps for those.

## Validation Plan
- `pnpm test` (workspace-wide) — existing tests must pass unchanged; new tests added for moved files (import path only, same assertions) and the 2 new Lambda handlers.
- `pnpm typecheck` (workspace-wide).
- `pnpm --filter @sfood/web build` and `pnpm --filter @sfood/serverless build` — both must succeed, serverless build must produce 3 `dist/*.mjs` files.
- Manual local verification: run `pnpm dev`, ask a question via the Ask panel and via Search, confirm identical behavior to pre-refactor (this is the regression check for the extraction, since there's no automated end-to-end AI-response test today).
- Playwright: home page in light/dark, desktop/mobile — confirm no "프로젝트 사례" entry point renders, confirm remaining entry points unaffected, confirm no broken links.
- Codex critical review: the `aiOrchestration.ts` extraction (does it preserve every branch/edge case from the original `vite.config.ts` code?), the 2 new Lambda handlers, and the workflow YAML (secret handling, no hardcoded values, correct AWS CLI flags).

## Addendum: production API endpoint wiring (found during implementation)
The original plan didn't address how a static S3/CloudFront deployment reaches the 3 Lambda Function URLs — `ArticleAskPanel.tsx`/`SearchPage.tsx` called relative paths (`/api/wiki/ai/ask`, `/api/wiki/ai/search`) that only resolve because Vite's dev server proxies them; a static build has no such proxy. Fixed by adding `VITE_AI_ASK_ENDPOINT`/`VITE_AI_SEARCH_ENDPOINT` build-time env vars (same pattern as the existing `VITE_WIKI_REMOTE_ENDPOINT`), falling back to the relative dev path when unset. The GitHub Actions workflow passes these from repo Variables (populated with the Function URLs from `aws-setup-guide.md` step 4) at build time.

## Risks
- **Extraction fidelity**: ~300 lines of branching logic (intent classification, caching, fallback ranking) — a missed branch would silently change AI answer quality/shape without any test catching it (no existing test asserts on this end-to-end response shape). Mitigation: line-by-line diff-style Codex review specifically comparing old `vite.config.ts` logic to new `aiOrchestration.ts`, plus the manual local pnpm dev smoke test above.
- **Lambda cold start + in-memory caches**: caches reset on cold start / container recycle — documented as a known limitation in spec.md, not a bug to fix here.
- **CORS on POST endpoints**: `wikiPagesHandler`'s CORS pattern is GET/OPTIONS only; the new handlers must add `POST` to `Access-Control-Allow-Methods` and handle OPTIONS pre-flight — must not copy-paste the GET-only CORS headers verbatim.
- **`event.body` base64 handling**: API Gateway/Function URL may base64-encode the body depending on content-type negotiation; the new handlers must check `event.isBase64Encoded` before `JSON.parse`, which `wikiPagesHandler` never needed (GET, no body).
