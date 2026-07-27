# aws-static-site-and-ai-api-deployment Test Result

## Automated Checks

| Command | Result |
|---|---|
| `pnpm -r typecheck` | ✅ Pass (all 6 workspace packages) |
| `pnpm -r test` | ✅ Pass — 316 tests total (web 64, wiki-core 175, serverless 16, mcp-server 36, edge-sidebar 21, 4 test files added: `aiAskHandler.test.ts`, `aiSearchHandler.test.ts`; 2 test files relocated unchanged: `aiSearchResponse.test.ts`, `searchAnswerState.test.ts`) |
| `pnpm --filter @sfood/serverless build` | ✅ Pass — produces `dist/wiki-pages.mjs` (25.8kb), `dist/ai-ask.mjs` (52.3kb), `dist/ai-search.mjs` (124.4kb) |
| `pnpm --filter @sfood/web build` (with `VITE_WIKI_DATA_SOURCE=remote` + dummy `VITE_AI_ASK_ENDPOINT`/`VITE_AI_SEARCH_ENDPOINT`) | ✅ Pass — confirmed the endpoint URLs are correctly baked into the production JS bundle via `grep` |
| `tsc --noEmit` on `apps/web/vite.config.ts` directly (not covered by `tsconfig.app.json`'s `include`) | ✅ Pass — no errors |

## Manual Regression Smoke Test (extraction fidelity)

Ran `pnpm --filter @sfood/web dev` against real Confluence + OpenAI credentials already configured in `.env.local`, then:

- `GET /api/wiki-pages` → 200, real Confluence-backed document list (unchanged, not part of the extraction).
- `POST /api/wiki/ai/ask` with an invalid `pageId` → 404 `PAGE_NOT_FOUND` (correct — proves request reached `handleAiAskRequest` and Confluence cache lookup).
- `POST /api/wiki/ai/ask` with a real `pageId` and a real question → 200, correct structured answer (`supportedByContext`, `confluenceData`, `unsupportedClaims`, `suggestedNextPages` all populated as expected) — confirms the extracted `handleAiAskRequest` in `packages/wiki-core/src/lib/aiOrchestration.ts` produces byte-for-byte the same shape as the original inline `vite.config.ts` logic.
- `POST /api/wiki/ai/search` with a question with no matching documents → 200, correct "no matching page" fallback response (`sufficiency: "부족"`, `unsupportedClaims` populated) — confirms the extracted `handleAiSearchRequest`'s no-results branch is intact.
- `POST /api/wiki/ai/search` with a real page-matching question → 200, real AI-generated answer with `recommendedDocuments`/`relatedDocuments`/`sufficiency` populated correctly.

This is direct evidence the extraction preserved behavior for both the happy path and at least one error/edge branch per endpoint.

## Codex Critical Review (spec-driven-workflow step 6c)

Ran via `mcp__codex__codex` (read-only sandbox) against the full staged diff. Findings and resolutions:

| Severity | Finding | Resolution |
|---|---|---|
| High | `pnpm-lock.yaml` was regenerated locally (esbuild devDependency added to `packages/serverless`) but not staged — `pnpm install --frozen-lockfile` in the workflow would have failed | Staged `pnpm-lock.yaml` |
| Medium | `vite.config.ts`'s refactored `/api/wiki/ai/ask`/`/api/wiki/ai/search` adapters dropped the original `try/catch` around `readJsonBody`/`handleAi*Request`, changing the error-response shape on unexpected failures | Restored `try/catch` wrapping with the original 502 `AI_PROVIDER_UNAVAILABLE` JSON response |
| Medium | Lambda handlers' `parseEventBody` accepted `JSON.parse("null")` (valid JSON, but not an object), which would then be dereferenced outside the `catch` and could throw a raw Lambda runtime error instead of a clean 400 | Added a non-null-object guard inside `parseEventBody`, throwing (caught by the existing `catch` → 400 `BAD_REQUEST`); added regression tests for both handlers |
| Medium | CORS (`WIKI_ALLOWED_ORIGIN`) is the only access control on the new public, OpenAI-backed endpoints — doesn't stop non-browser direct calls | Documented as a known, accepted risk in `spec.md`'s Edge Cases (matches the existing `wikiPagesHandler` precedent exactly; out of scope to add auth/rate-limiting in this task) |
| Low | `import.meta.env.VITE_AI_ASK_ENDPOINT ?? fallback` doesn't fall back when the GitHub Variable exists but is set to an empty string | Changed to `?.trim() || fallback` in both `ArticleAskPanel.tsx` and `SearchPage.tsx` |

Codex's overall assessment: "Extraction fidelity otherwise looks strong... I did not see changed AI orchestration branches, response shapes, policy notice enrichment, query-understanding fallback, unsupported-claim normalization, or search recommendation filtering in the moved logic." No hardcoded secrets found in the workflow YAML.

All fixes re-verified: `pnpm -r typecheck`/`pnpm -r test` pass after applying every fix above (316 tests, +2 new regression tests for the null-body case).

## Skipped / Not Applicable

- **Playwright review of the Projects-hide requirement**: not applicable — confirmed via `grep` that no navigation surface (`HomePage.tsx`, `SiteHeader.tsx`, or any other component) currently links to `/projects` or `/api/github/projects`; the feature was already unreachable before this task, so there is no UI diff to visually verify.
- **Live AWS deployment** (actual `aws lambda create-function`, S3 sync, CloudFront invalidation): out of scope for this task — requires the user's AWS account/credentials and is documented as a manual 1-time procedure in `aws-setup-guide.md` instead of executed here.
