# aws-static-site-and-ai-api-deployment Result

## Delivered Scope
1. **AI ask/search orchestration extracted** from `apps/web/vite.config.ts`'s dev-only middleware into transport-agnostic `packages/wiki-core/src/lib/aiOrchestration.ts` (`handleAiAskRequest`/`handleAiSearchRequest`, returning `{status, body}`) — reusable by both the Vite dev server and Lambda, per `docs/prd/architecture.md`'s "Frontend-First Runtime Policy".
2. **`vite.config.ts` reduced to a thin adapter** calling the extracted functions — local dev behavior confirmed unchanged via live smoke test against real Confluence/OpenAI credentials.
3. **Two pure-logic files moved** (`aiSearchResponse.ts`, `searchAnswerState.ts`) from `apps/web/src/lib` into `packages/wiki-core/src/lib`, since the Lambda package cannot import from `apps/web`.
4. **Two new Lambda handlers** (`packages/serverless/src/aiAskHandler.ts`, `aiSearchHandler.ts`) alongside the existing `wikiPagesHandler.ts` — POST + OPTIONS CORS, base64 body decoding, JSON validation.
5. **esbuild build tooling added** to `packages/serverless` (3 entrypoints → 3 `dist/*.mjs` bundles).
6. **GitHub Actions workflow** (`.github/workflows/deploy.yml`) — deploys `apps/web`'s static build to S3 + CloudFront invalidation, and updates all 3 Lambda functions' code, on push to `main`. Authenticates via static `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` GitHub Secrets.
7. **Production API wiring fix** (found during implementation, not in the original ask): added `VITE_AI_ASK_ENDPOINT`/`VITE_AI_SEARCH_ENDPOINT` build-time env vars so the deployed static site calls the Lambda Function URLs directly instead of relative dev-only paths.
8. **Projects/GitHub feature**: confirmed already unreachable from any navigation surface — no code change needed (routes remain, unlinked, per the user's "제외 및 기능 숨김" instruction).
9. **One-time AWS setup guide** (`aws-setup-guide.md`) for creating the 3 Lambda functions + Function URLs, mirroring `docs/tasks/wiki-mcp-server/aws-deployment-guide.md`'s style.
10. **GitHub Secrets/Variables list** (in `aws-setup-guide.md`).

## Changed Files
- `apps/web/vite.config.ts`
- `apps/web/src/vite-env.d.ts`
- `apps/web/src/ui/pages/ArticleAskPanel.tsx`, `SearchPage.tsx`
- `apps/web/src/ui/searchRecommendations.ts`
- `packages/wiki-core/src/index.ts`
- `packages/wiki-core/src/lib/aiOrchestration.ts` (new)
- `packages/wiki-core/src/lib/aiSearchResponse.ts`, `searchAnswerState.ts` (moved from `apps/web/src/lib`, + tests)
- `packages/serverless/src/aiAskHandler.ts`, `aiSearchHandler.ts` (+ tests)
- `packages/serverless/src/entrypoints/{wikiPagesEntry,aiAskEntry,aiSearchEntry}.ts` (new)
- `packages/serverless/package.json`
- `.github/workflows/deploy.yml` (new)
- `pnpm-lock.yaml`
- `docs/tasks/aws-static-site-and-ai-api-deployment/` (new)

## Key Decisions
- **Module-level caches kept, not made request-scoped**: the extracted `wikiCache`/`aiSearchCache`/`promptRulesCache` stay as module-level state in `aiOrchestration.ts`. This is correct for both runtimes — identical to today's dev-server behavior, and a strict improvement for Lambda (free warm-container caching between invocations) rather than a regression.
- **`readJsonBody` stays in `vite.config.ts`**: it's Node `IncomingMessage`-specific (raw stream parsing), a genuinely different transport concern from the Lambda event's `event.body` (which may be base64-encoded) — kept as separate adapter-side code rather than forced into a shared abstraction.
- **CORS-only access control on the new public AI endpoints**: matches the existing `wikiPagesHandler` precedent exactly. Codex flagged this as a real but pre-existing pattern in this codebase, not a new regression — documented as an accepted, known risk rather than silently fixed with new auth logic that wasn't requested or scoped.
- **Projects/GitHub required zero code changes**: grep-confirmed the feature was already unreachable from all navigation surfaces before this task started (a prior session's changes appear to have already dropped its home-page entry point). Routes remain per the "keep routes, don't delete" scope decision.

## Gaps / Follow-ups (require the user's AWS access — not executable from this session)
- Actual AWS resource creation (Lambda functions, Function URLs, IAM role) per `aws-setup-guide.md` — one-time manual step.
- Confirming the existing S3 bucket/CloudFront distribution IDs and populating the GitHub Secrets/Variables listed in `aws-setup-guide.md`.
- First real deploy run of `.github/workflows/deploy.yml` against the user's AWS account.
- PR not yet opened — pending user confirmation this is ready to push (see below).

## Validation
See `test-result.md`: `pnpm -r typecheck`/`test` pass (316 tests), `packages/serverless` build produces all 3 bundles, live local smoke test against real Confluence/OpenAI credentials confirms zero behavioral regression in AI ask/search, and Codex critical review findings (1 High, 3 Medium, 1 Low) were all fixed and re-verified.
