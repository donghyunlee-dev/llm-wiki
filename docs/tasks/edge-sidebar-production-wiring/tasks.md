# edge-sidebar-production-wiring Tasks

- [x] Extract `buildCleanWikiDocumentsList` into `packages/wiki-core`
- [x] Refactor `vite.config.ts`'s `/api/wiki/documents` middleware to use it (regression-checked against local dev server)
- [x] Add `wikiDocumentsHandler.ts` + test + entrypoint in `packages/serverless`
- [x] Add `wiki-documents` to the serverless build script
- [x] Add `wiki-documents` deploy step to `.github/workflows/deploy.yml`
- [x] Update `aws-setup-guide.md` for the 4th Lambda
- [x] Create `sfood-ax-wiki-documents` Lambda (user, via console), deploy code + env vars + Function URL (this session)
- [x] Register `WIKI_DOCUMENTS_LAMBDA_NAME` GitHub secret
- [x] Update `apps/edge-sidebar`'s `wikiClient.ts` to call real Lambda Function URLs when built with `VITE_AI_SEARCH_ENDPOINT`/`VITE_WIKI_DOCUMENTS_ENDPOINT`, falling back to dev-relative paths otherwise
- [x] Update `DEFAULT_WIKI_BASE_URL`/`DEFAULT_BASE_URL` to the real deployed domain
- [x] Update `apps/edge-sidebar/README.md`
- [x] `pnpm test`/`typecheck`/`build` pass (workspace + serverless 4 bundles)
- [x] Live-verify the deployed `wiki-documents` Lambda
- [x] Build the extension with real endpoints and confirm they're embedded in `dist`
- [x] Write test-result.md, result.md
