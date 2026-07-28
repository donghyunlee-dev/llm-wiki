# aws-static-site-and-ai-api-deployment Tasks

- [x] Move `aiSearchResponse.ts`/`searchAnswerState.ts` (+tests) into `packages/wiki-core`, update consumers
- [x] Extract AI ask/search orchestration into `packages/wiki-core/src/lib/aiOrchestration.ts`
- [x] Refactor `vite.config.ts` AI middlewares into thin adapters over the extracted functions
- [x] Add `packages/serverless/src/aiAskHandler.ts` + `aiSearchHandler.ts` + tests
- [x] Add serverless esbuild entrypoints + `build` script (3 bundles)
- [x] Hide Projects/GitHub entry points from home page + nav (confirmed already unreachable, no change needed)
- [x] Write `.github/workflows/deploy.yml`
- [x] Write `aws-setup-guide.md` (one-time Lambda setup) + final GitHub Secrets list
- [x] Run `pnpm test`/`typecheck`/`build`, manual dev smoke test for AI ask/search
- [x] Playwright verify Projects-hide (not applicable — no UI diff, see test-result.md)
- [x] Codex critical review (extraction fidelity, Lambda handlers, workflow YAML) — 5 findings, all fixed
- [x] Write `test-result.md`, `result.md`, update `implementation-status.md`
- [ ] Commit, push branch, open PR
